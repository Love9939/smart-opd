use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use core_engine::{QueueToken, TokenCategory, TokenStatus, WaitingSeatType};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::AppState;
use crate::ws_hub::{ChairStatusItem, ClinicWebSocketPayload, TtsAnnouncements};

#[derive(Debug, Deserialize)]
pub struct CreateTokenRequest {
    pub patient_name: String,
    pub category: Option<TokenCategory>,
    pub required_seat_type: Option<WaitingSeatType>,
    pub planned_duration_secs: Option<u32>,
    pub requires_sterilization: Option<bool>,
    pub lab_qc_verified: Option<bool>,
    #[allow(dead_code)]
    pub fee_charged_inr: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

pub async fn create_token_handler(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    Json(payload): Json<CreateTokenRequest>,
) -> impl IntoResponse {
    let token_id = Uuid::new_v4();
    let patient_id = Uuid::new_v4();
    let category = payload.category.unwrap_or(TokenCategory::Regular);
    
    // Prefix based on category
    let prefix = match category {
        TokenCategory::Emergency => "E",
        TokenCategory::AnesthesiaReady => "D",
        TokenCategory::LabReturn => "L",
        TokenCategory::LateGrace => "G",
        TokenCategory::Regular => "A",
    };
    let count = state.tokens.read().await.len() + 1;
    let token_display = format!("{}-{:02}", prefix, count);

    let token = QueueToken {
        token_id,
        session_id,
        token_display,
        patient_id,
        patient_name: payload.patient_name,
        category,
        status: TokenStatus::Booked,
        required_seat_type: payload.required_seat_type.unwrap_or(WaitingSeatType::Standard),
        assigned_waiting_seat: None,
        assigned_chair_code: None,
        planned_duration_secs: payload.planned_duration_secs.unwrap_or(360),
        requires_sterilization: payload.requires_sterilization.unwrap_or(false),
        lab_qc_verified: payload.lab_qc_verified.unwrap_or(true),
        estimated_wait_secs: 0,
        anesthesia_ready_at: None,
        booked_at: Utc::now(),
        checked_in_at: None,
        called_at: None,
        completed_at: None,
    };

    state.tokens.write().await.insert(token_id, token.clone());

    (
        StatusCode::CREATED,
        Json(ApiResponse {
            success: true,
            data: Some(token),
            error: None,
        }),
    )
}

pub async fn check_in_handler(
    State(state): State<AppState>,
    Path((session_id, token_id)): Path<(Uuid, Uuid)>,
) -> impl IntoResponse {
    let token_opt = state.tokens.read().await.get(&token_id).cloned();
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

    match handle.check_in(token).await {
        Ok(checked_in_token) => {
            state.tokens.write().await.insert(token_id, checked_in_token.clone());

            // Broadcast check-in event over WebSockets
            state
                .ws_hub
                .broadcast(
                    state.clinic_id,
                    ClinicWebSocketPayload::TokenCheckedIn {
                        token_display: checked_in_token.token_display.clone(),
                        patient_first_name: checked_in_token.patient_name.clone(),
                        assigned_waiting_seat: checked_in_token.assigned_waiting_seat.clone(),
                        estimated_wait_secs: checked_in_token.estimated_wait_secs,
                    },
                )
                .await;

            // Check crowd threshold
            if let Ok(snap) = handle.get_snapshot().await {
                if snap.is_peak_crowd {
                    state
                        .ws_hub
                        .broadcast(
                            state.clinic_id,
                            ClinicWebSocketPayload::CrowdAlert {
                                occupancy_pct: snap.lobby_occupancy_pct,
                                message: "Peak Crowd Mode Active: Kindly limit lobby presence to 1 attendant per patient.".to_string(),
                            },
                        )
                        .await;
                }
            }

            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: true,
                    data: Some(checked_in_token),
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

pub async fn call_next_handler(
    State(state): State<AppState>,
    Path((session_id, chair_id)): Path<(Uuid, Uuid)>,
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

    let now = Utc::now();
    match handle.call_next(chair_id, now).await {
        Ok(called_token) => {
            state.tokens.write().await.insert(called_token.token_id, called_token.clone());
            let chair_code = called_token
                .assigned_chair_code
                .clone()
                .unwrap_or_else(|| "Cabin".to_string());

            let snap = handle.get_snapshot().await.ok();
            let chair_states = if let Some(ref s) = snap {
                s.operatory_chairs
                    .iter()
                    .map(|c| ChairStatusItem {
                        chair_code: c.chair_code.clone(),
                        state: match &c.state {
                            core_engine::ChairState::Available => "AVAILABLE".to_string(),
                            core_engine::ChairState::Occupied { .. } => "OCCUPIED".to_string(),
                            core_engine::ChairState::AnesthesiaHold { .. } => "ANESTHESIA_HOLD".to_string(),
                            core_engine::ChairState::SterilizationLock { .. } => "STERILIZATION_LOCK".to_string(),
                            core_engine::ChairState::Maintenance => "MAINTENANCE".to_string(),
                        },
                        unlocks_in_secs: match &c.state {
                            core_engine::ChairState::SterilizationLock { unlocks_at } => {
                                let diff = *unlocks_at - now;
                                Some(diff.num_seconds().max(0) as u32)
                            }
                            _ => None,
                        },
                        active_token: if c.chair_id == chair_id {
                            Some(called_token.token_display.clone())
                        } else {
                            None
                        },
                    })
                    .collect()
            } else {
                vec![]
            };

            // Build multi-lingual TTS announcements
            let tts = TtsAnnouncements {
                en_in: format!(
                    "Token {}, {}, please proceed to {}.",
                    called_token.token_display, called_token.patient_name, chair_code
                ),
                hi_in: format!(
                    "टोकन {}, कृपया {} में जाएं।",
                    called_token.token_display, chair_code
                ),
                kn_in: format!(
                    "ಟೋಕನ್ {}, ದಯವಿಟ್ಟು {} ಗೆ ಬನ್ನಿ.",
                    called_token.token_display, chair_code
                ),
            };

            // Broadcast TOKEN_CALLED over WebSockets
            state
                .ws_hub
                .broadcast(
                    state.clinic_id,
                    ClinicWebSocketPayload::TokenCalled {
                        token_display: called_token.token_display.clone(),
                        patient_first_name: called_token.patient_name.clone(),
                        assigned_chair_code: chair_code,
                        previous_waiting_seat: called_token.assigned_waiting_seat.clone(),
                        tts_announcements: tts,
                        chair_states,
                    },
                )
                .await;

            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: true,
                    data: Some(called_token),
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

pub async fn get_snapshot_handler(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
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

    match handle.get_snapshot().await {
        Ok(snapshot) => (
            StatusCode::OK,
            Json(ApiResponse {
                success: true,
                data: Some(snapshot),
                error: None,
            }),
        ),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                success: false,
                data: None,
                error: Some(err),
            }),
        ),
    }
}
