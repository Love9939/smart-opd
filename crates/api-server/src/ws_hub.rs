use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TtsAnnouncements {
    #[serde(rename = "en-IN")]
    pub en_in: String,
    #[serde(rename = "kn-IN")]
    pub kn_in: String,
    #[serde(rename = "hi-IN")]
    pub hi_in: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChairStatusItem {
    pub chair_code: String,
    pub state: String,
    pub unlocks_in_secs: Option<u32>,
    pub active_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event_type", content = "payload")]
pub enum ClinicWebSocketPayload {
    #[serde(rename = "TOKEN_CALLED")]
    TokenCalled {
        token_display: String,
        patient_first_name: String,
        assigned_chair_code: String,
        previous_waiting_seat: Option<String>,
        tts_announcements: TtsAnnouncements,
        chair_states: Vec<ChairStatusItem>,
    },
    #[serde(rename = "TOKEN_CHECKED_IN")]
    TokenCheckedIn {
        token_display: String,
        patient_first_name: String,
        assigned_waiting_seat: Option<String>,
        estimated_wait_secs: u32,
    },
    #[serde(rename = "ANESTHESIA_HOLD_STARTED")]
    AnesthesiaHoldStarted {
        token_display: String,
        chair_code: String,
        numbing_lounge_seat: Option<String>,
        ready_in_mins: u32,
    },
    #[serde(rename = "STERILIZATION_STARTED")]
    SterilizationStarted {
        chair_code: String,
        duration_mins: u32,
    },
    #[serde(rename = "STERILIZATION_COMPLETED")]
    SterilizationCompleted {
        chair_code: String,
    },
    #[serde(rename = "CROWD_ALERT")]
    CrowdAlert {
        occupancy_pct: u8,
        message: String,
    },
    #[serde(rename = "SESSION_STATE_SYNC")]
    SessionStateSync {
        snapshot: serde_json::Value,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClinicWebSocketEvent {
    pub event_id: Uuid,
    pub clinic_id: Uuid,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub timestamp: chrono::DateTime<chrono::Utc>,
    #[serde(flatten)]
    pub payload: ClinicWebSocketPayload,
}

#[derive(Clone)]
pub struct WsHub {
    channels: Arc<RwLock<HashMap<Uuid, broadcast::Sender<ClinicWebSocketEvent>>>>,
}

impl WsHub {
    pub fn new() -> Self {
        Self {
            channels: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Subscribes to a clinic's event channel (creates broadcast channel with capacity 512 if not existing)
    pub async fn subscribe(&self, clinic_id: Uuid) -> broadcast::Receiver<ClinicWebSocketEvent> {
        let mut channels = self.channels.write().await;
        let sender = channels.entry(clinic_id).or_insert_with(|| {
            let (tx, _rx) = broadcast::channel(512);
            tx
        });
        sender.subscribe()
    }

    /// Broadcasts an event to all connected clients of this clinic
    pub async fn broadcast(&self, clinic_id: Uuid, payload: ClinicWebSocketPayload) {
        let channels = self.channels.read().await;
        if let Some(tx) = channels.get(&clinic_id) {
            let event = ClinicWebSocketEvent {
                event_id: Uuid::new_v4(),
                clinic_id,
                timestamp: chrono::Utc::now(),
                payload,
            };
            let _ = tx.send(event);
        }
    }
}
