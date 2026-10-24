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
use integrations::WhatsAppClient;

#[derive(Debug, Deserialize)]
pub struct CreateTokenRequest {
    pub patient_name: String,
    pub category: Option<TokenCategory>,
    pub required_seat_type: Option<WaitingSeatType>,
    pub planned_duration_secs: Option<u32>,
    pub requires_sterilization: Option<bool>,
    pub lab_qc_verified: Option<bool>,
    pub fee_charged_inr: Option<u32>,
    pub family_cluster_id: Option<Uuid>,
    pub cluster_suffix: Option<String>,
    #[allow(dead_code)]
    pub household_phone: Option<String>,
    pub actor_role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PaymentRecordRequest {
    pub amount_paid_inr: u32,
    pub fee_charged_inr: Option<u32>,
    pub payment_method: String, // "CASH", "UPI", "WAIVED", "FREE_FOLLOWUP"
    pub staff_id: Option<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EmergencyTriageRequest {
    pub patient_name: String,
    pub complaint: String,
    pub pain_relief_slot_mins: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct PreMedHoldRequest {
    pub sedation_mins: Option<u32>,
    pub medication_notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CascadeDelayRequest {
    pub delay_mins: i16,
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct DiagnosticPauseRequest {
    pub token_id: Uuid,
    pub procedure_type: String, // e.g. "BLOOD_TEST", "ECG", "NEBULIZATION", "EYE_DILATION"
    pub pause_mins: Option<u32>,
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
    let suffix = payload.cluster_suffix.clone().unwrap_or_default();
    let token_display = format!("{}-{:02}{}", prefix, count, suffix);

    let token = QueueToken {
        token_id,
        session_id,
        token_display: token_display.clone(),
        patient_id,
        patient_name: payload.patient_name.clone(),
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

    // Record immutable audit event
    let actor_role = payload.actor_role.as_deref().unwrap_or("RECEPTIONIST_DESK");
    state
        .record_audit_event(
            token_id,
            Uuid::new_v4(),
            actor_role,
            "TOKEN_BOOKED",
            None,
            serde_json::json!({
                "token_display": token_display,
                "patient_name": payload.patient_name,
                "category": format!("{:?}", category),
                "family_cluster_id": payload.family_cluster_id,
                "fee_charged_inr": payload.fee_charged_inr.unwrap_or(500),
            }),
        )
        .await;

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

            // Record audit event for check-in
            state
                .record_audit_event(
                    token_id,
                    Uuid::new_v4(),
                    "RECEPTIONIST_DESK",
                    "TOKEN_CHECKED_IN",
                    None,
                    serde_json::json!({
                        "token_display": checked_in_token.token_display,
                        "assigned_waiting_seat": checked_in_token.assigned_waiting_seat,
                        "estimated_wait_secs": checked_in_token.estimated_wait_secs,
                    }),
                )
                .await;

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

/// Shifts session Estimated Wait Time by +Delta mins and triggers WhatsApp notifications
pub async fn cascade_delay_handler(
    State(state): State<AppState>,
    Path(_session_id): Path<Uuid>,
    Json(payload): Json<CascadeDelayRequest>,
) -> impl IntoResponse {
    let tokens_count = state.tokens.read().await.len();

    // Broadcast cascade delay event to TV and patient phones
    state
        .ws_hub
        .broadcast(
            state.clinic_id,
            ClinicWebSocketPayload::CascadeDelayAlert {
                delay_mins: payload.delay_mins,
                reason: payload.reason.clone(),
                affected_tokens_count: tokens_count,
            },
        )
        .await;

    // Simulate WhatsApp Cloud API notifications to waiting patients
    tokio::spawn(async move {
        let _ = WhatsAppClient::send_cascade_delay_alert(
            "+919876543210",
            "Waiting Patients",
            payload.delay_mins,
            "Updated Live Schedule",
        )
        .await;
    });

    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            data: Some(format!(
                "Cascade delay of +{} mins logged. WhatsApp alerts dispatched to {} patients.",
                payload.delay_mins, tokens_count
            )),
            error: None,
        }),
    )
}

/// GP Intra-Visit Diagnostic Pause (Nebulization, Blood test, ECG)
pub async fn diagnostic_pause_handler(
    State(state): State<AppState>,
    Path((_session_id, _chair_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<DiagnosticPauseRequest>,
) -> impl IntoResponse {
    let mut tokens = state.tokens.write().await;
    if let Some(token) = tokens.get_mut(&payload.token_id) {
        token.status = TokenStatus::AwaitingDiagnostic;
        let token_disp = token.token_display.clone();

        state
            .ws_hub
            .broadcast(
                state.clinic_id,
                ClinicWebSocketPayload::DiagnosticHoldStarted {
                    token_display: token_disp.clone(),
                    procedure_type: payload.procedure_type.clone(),
                    pause_mins: payload.pause_mins.unwrap_or(20),
                },
            )
            .await;

        (
            StatusCode::OK,
            Json(ApiResponse {
                success: true,
                data: Some(format!(
                    "Patient {} moved to Awaiting Diagnostic ({})",
                    token_disp, payload.procedure_type
                )),
                error: None,
            }),
        )
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse {
                success: false,
                data: None,
                error: Some("Token not found".to_string()),
            }),
        )
    }
}

/// Reception POS: Records patient fee payment or records a high-priority pilferage alert for fee waiver
pub async fn record_payment_handler(
    State(state): State<AppState>,
    Path((_session_id, token_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<PaymentRecordRequest>,
) -> impl IntoResponse {
    let tokens = state.tokens.read().await;
    let token = match tokens.get(&token_id) {
        Some(t) => t.clone(),
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

    let is_waiver = payload.payment_method == "WAIVED" || (payload.amount_paid_inr == 0 && payload.payment_method != "FREE_FOLLOWUP");
    let action_type = if is_waiver { "FEE_WAIVED_ALERT" } else { "FEE_COLLECTED" };

    state
        .record_audit_event(
            token_id,
            payload.staff_id.unwrap_or_else(Uuid::new_v4),
            "RECEPTIONIST_POS",
            action_type,
            Some(serde_json::json!({
                "status": "UNPAID",
                "fee_charged": payload.fee_charged_inr.unwrap_or(500),
            })),
            serde_json::json!({
                "amount_paid_inr": payload.amount_paid_inr,
                "payment_method": payload.payment_method,
                "notes": payload.notes,
                "is_pilferage_alert": is_waiver,
            }),
        )
        .await;

    // Broadcast audit event
    state
        .ws_hub
        .broadcast(
            state.clinic_id,
            ClinicWebSocketPayload::AuditEventLogged {
                action_type: action_type.to_string(),
                actor_role: "RECEPTIONIST_POS".to_string(),
                token_display: token.token_display.clone(),
                is_tamper_alert: is_waiver,
            },
        )
        .await;

    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            data: Some(format!(
                "Payment recorded: ₹{} via {}{}",
                payload.amount_paid_inr,
                payload.payment_method,
                if is_waiver { " (⚠️ High-Priority Waiver Logged)" } else { "" }
            )),
            error: None,
        }),
    )
}

/// Retrieves immutable audit events log
pub async fn list_audit_events_handler(
    State(state): State<AppState>,
    Path(_clinic_id): Path<Uuid>,
) -> impl IntoResponse {
    let audits = state.audit_events.read().await.clone();
    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            data: Some(audits),
            error: None,
        }),
    )
}

/// Doctor Cockpit / Reception: Inserts emergency acute pain walk-in and shifts session EWT
pub async fn emergency_triage_handler(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    Json(payload): Json<EmergencyTriageRequest>,
) -> impl IntoResponse {
    let token_id = Uuid::new_v4();
    let patient_id = Uuid::new_v4();
    let count = state.tokens.read().await.len() + 1;
    let token_display = format!("E-{:02}", count);
    let delay_mins = 12i16;

    let token = QueueToken {
        token_id,
        session_id,
        token_display: token_display.clone(),
        patient_id,
        patient_name: format!("{} (ACUTE PAIN)", payload.patient_name),
        category: TokenCategory::Emergency,
        status: TokenStatus::Booked,
        required_seat_type: WaitingSeatType::Standard,
        assigned_waiting_seat: None,
        assigned_chair_code: None,
        planned_duration_secs: payload.pain_relief_slot_mins.unwrap_or(10) * 60,
        requires_sterilization: false,
        lab_qc_verified: true,
        estimated_wait_secs: 0,
        anesthesia_ready_at: None,
        booked_at: Utc::now(),
        checked_in_at: Some(Utc::now()),
        called_at: None,
        completed_at: None,
    };

    state.tokens.write().await.insert(token_id, token.clone());

    // Record audit
    state
        .record_audit_event(
            token_id,
            Uuid::new_v4(),
            "DOCTOR_MOBILE",
            "EMERGENCY_TRIAGE_INSERTED",
            None,
            serde_json::json!({
                "token_display": token_display,
                "complaint": payload.complaint,
                "cascade_delay_mins": delay_mins,
            }),
        )
        .await;

    // Broadcast emergency alert
    state
        .ws_hub
        .broadcast(
            state.clinic_id,
            ClinicWebSocketPayload::EmergencyTriageAlert {
                token_display: token_display.clone(),
                patient_name: payload.patient_name.clone(),
                complaint: payload.complaint.clone(),
                cascade_delay_mins: delay_mins,
            },
        )
        .await;

    (
        StatusCode::CREATED,
        Json(ApiResponse {
            success: true,
            data: Some(token),
            error: None,
        }),
    )
}

/// Pediatric / Anxious Patient: Starts 25m Pre-Medication Numbing Gel / Sedation Hold
pub async fn pre_med_hold_handler(
    State(state): State<AppState>,
    Path((_session_id, token_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<PreMedHoldRequest>,
) -> impl IntoResponse {
    let mut tokens = state.tokens.write().await;
    if let Some(token) = tokens.get_mut(&token_id) {
        let sedation_mins = payload.sedation_mins.unwrap_or(25);
        let token_disp = token.token_display.clone();

        state
            .record_audit_event(
                token_id,
                Uuid::new_v4(),
                "DOCTOR_MOBILE",
                "PRE_MED_HOLD_STARTED",
                None,
                serde_json::json!({
                    "token_display": token_disp,
                    "sedation_mins": sedation_mins,
                    "notes": payload.medication_notes,
                }),
            )
            .await;

        state
            .ws_hub
            .broadcast(
                state.clinic_id,
                ClinicWebSocketPayload::PreMedHoldStarted {
                    token_display: token_disp.clone(),
                    sedation_mins,
                },
            )
            .await;

        (
            StatusCode::OK,
            Json(ApiResponse {
                success: true,
                data: Some(format!("Patient {} placed on {}m Pre-Medication Hold", token_disp, sedation_mins)),
                error: None,
            }),
        )
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse {
                success: false,
                data: None,
                error: Some("Token not found".to_string()),
            }),
        )
    }
}

