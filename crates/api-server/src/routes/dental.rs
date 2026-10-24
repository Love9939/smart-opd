use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use db_schema::models::{DentalLabOrder, DentalOdontogramRecord, LabOrderStatus};
use serde::Deserialize;
use uuid::Uuid;

use crate::routes::queue::ApiResponse;
use crate::state::AppState;
use crate::ws_hub::ClinicWebSocketPayload;

#[derive(Debug, Deserialize)]
pub struct AnesthesiaHoldRequest {
    pub token_id: Uuid,
    pub numbing_mins: Option<i64>,
    pub move_to_numbing_lounge: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CompleteVisitRequest {
    pub actual_duration_secs: Option<u32>,
    pub requires_sterilization: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertOdontogramRequest {
    pub fdi_tooth: i16,
    pub surfaces: Vec<String>,
    pub condition_code: String,
    pub notes: Option<String>,
    pub iopa_xray_url: Option<String>,
}

pub async fn anesthesia_hold_handler(
    State(state): State<AppState>,
    Path((session_id, chair_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<AnesthesiaHoldRequest>,
) -> impl IntoResponse {
    let token_opt = state.tokens.read().await.get(&payload.token_id).cloned();
    let token = match token_opt {
        Some(t) => t,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("Token not found".to_string()),
                }),
            )
        }
    };

    let sessions = state.sessions.read().await;
    let handle = match sessions.get(&session_id) {
        Some(h) => h,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("Session not found".to_string()),
                }),
            )
        }
    };

    let numbing_mins = payload.numbing_mins.unwrap_or(15);
    let move_to_lounge = payload.move_to_numbing_lounge.unwrap_or(false);
    let now = Utc::now();

    match handle
        .anesthesia_hold(chair_id, token, numbing_mins, move_to_lounge, now)
        .await
    {
        Ok(updated_token) => {
            state.tokens.write().await.insert(payload.token_id, updated_token.clone());

            // Broadcast Anesthesia Hold Started
            state
                .ws_hub
                .broadcast(
                    state.clinic_id,
                    ClinicWebSocketPayload::AnesthesiaHoldStarted {
                        token_display: updated_token.token_display.clone(),
                        chair_code: format!("Chair-{}", chair_id),
                        numbing_lounge_seat: updated_token.assigned_waiting_seat.clone(),
                        ready_in_mins: numbing_mins as u32,
                    },
                )
                .await;

            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: true,
                    data: Some(updated_token),
                    error: None,
                }),
            )
        }
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse {
                success: false,
                data: None,
                error: Some(err),
            }),
        ),
    }
}

pub async fn complete_consultation_handler(
    State(state): State<AppState>,
    Path((session_id, chair_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<CompleteVisitRequest>,
) -> impl IntoResponse {
    let sessions = state.sessions.read().await;
    let handle = match sessions.get(&session_id) {
        Some(h) => h,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse {
                    success: false,
                    data: None,
                    error: Some("Session not found".to_string()),
                }),
            )
        }
    };

    let actual_duration_secs = payload.actual_duration_secs.unwrap_or(360);
    let requires_sterilization = payload.requires_sterilization.unwrap_or(false);
    let now = Utc::now();

    match handle
        .complete_consultation(chair_id, actual_duration_secs, requires_sterilization, now)
        .await
    {
        Ok(_) => {
            if requires_sterilization {
                state
                    .ws_hub
                    .broadcast(
                        state.clinic_id,
                        ClinicWebSocketPayload::SterilizationStarted {
                            chair_code: format!("Chair-{}", chair_id),
                            duration_mins: 10,
                        },
                    )
                    .await;
            }

            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: true,
                    data: Some("Consultation completed successfully".to_string()),
                    error: None,
                }),
            )
        }
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse {
                success: false,
                data: None,
                error: Some(err),
            }),
        ),
    }
}

pub async fn upsert_odontogram_handler(
    State(state): State<AppState>,
    Path(patient_id): Path<Uuid>,
    Json(payload): Json<UpsertOdontogramRequest>,
) -> impl IntoResponse {
    if payload.fdi_tooth < 11 || payload.fdi_tooth > 85 {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse {
                success: false,
                data: None,
                error: Some("Invalid FDI tooth number (must be 11-85)".to_string()),
            }),
        );
    }

    let record = DentalOdontogramRecord {
        id: Uuid::new_v4(),
        patient_id,
        fdi_tooth: payload.fdi_tooth,
        surfaces: payload.surfaces,
        condition_code: payload.condition_code,
        notes: payload.notes,
        iopa_xray_url: payload.iopa_xray_url,
        updated_at: Utc::now(),
    };

    state
        .odontogram
        .write()
        .await
        .insert((patient_id, payload.fdi_tooth), record.clone());

    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            data: Some(record),
            error: None,
        }),
    )
}

pub async fn get_odontogram_handler(
    State(state): State<AppState>,
    Path(patient_id): Path<Uuid>,
) -> impl IntoResponse {
    let odontogram = state.odontogram.read().await;
    let records: Vec<DentalOdontogramRecord> = odontogram
        .iter()
        .filter(|((p_id, _), _)| *p_id == patient_id)
        .map(|(_, rec)| rec.clone())
        .collect();

    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            data: Some(records),
            error: None,
        }),
    )
}

pub async fn verify_lab_order_handler(
    State(state): State<AppState>,
    Path(order_id): Path<Uuid>,
) -> impl IntoResponse {
    let mut orders = state.lab_orders.write().await;
    match orders.get_mut(&order_id) {
        Some(order) => {
            order.status = LabOrderStatus::QcVerified;
            order.received_verified_at = Some(Utc::now());
            let updated = order.clone();

            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: true,
                    data: Some(updated),
                    error: None,
                }),
            )
        }
        None => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse {
                success: false,
                data: None,
                error: Some("Dental Lab order not found".to_string()),
            }),
        ),
    }
}

pub async fn list_lab_orders_handler(State(state): State<AppState>) -> impl IntoResponse {
    let orders = state.lab_orders.read().await;
    let list: Vec<DentalLabOrder> = orders.values().cloned().collect();

    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            data: Some(list),
            error: None,
        }),
    )
}
