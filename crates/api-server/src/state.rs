use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::actor::SessionActorHandle;
use crate::ws_hub::WsHub;
use core_engine::{OperatoryChair, QueueToken, WaitingSeat};
use db_schema::models::{DentalLabOrder, DentalOdontogramRecord, LabOrderStatus};

#[derive(Clone)]
pub struct AppState {
    pub ws_hub: WsHub,
    pub sessions: Arc<RwLock<HashMap<Uuid, SessionActorHandle>>>,
    pub clinic_id: Uuid,
    pub default_session_id: Uuid,
    pub tokens: Arc<RwLock<HashMap<Uuid, QueueToken>>>,
    pub lab_orders: Arc<RwLock<HashMap<Uuid, DentalLabOrder>>>,
    pub odontogram: Arc<RwLock<HashMap<(Uuid, i16), DentalOdontogramRecord>>>,
}

impl AppState {
    pub fn new_with_defaults() -> Self {
        let clinic_id = Uuid::parse_str("8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f").unwrap();
        let session_id = Uuid::parse_str("a1111111-2222-3333-4444-555555555555").unwrap();

        // Create default waiting seats
        let waiting_seats = vec![
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "P-01".to_string(),
                zone_name: "Priority Zone".to_string(),
                seat_type: core_engine::WaitingSeatType::PriorityElderlyPregnant,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "P-02".to_string(),
                zone_name: "Priority Zone".to_string(),
                seat_type: core_engine::WaitingSeatType::PriorityElderlyPregnant,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "N-01".to_string(),
                zone_name: "Numbing Lounge".to_string(),
                seat_type: core_engine::WaitingSeatType::NumbingLounge,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "W-01".to_string(),
                zone_name: "Wheelchair Bay".to_string(),
                seat_type: core_engine::WaitingSeatType::Wheelchair,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "A-01".to_string(),
                zone_name: "Main Lobby".to_string(),
                seat_type: core_engine::WaitingSeatType::Standard,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "A-02".to_string(),
                zone_name: "Main Lobby".to_string(),
                seat_type: core_engine::WaitingSeatType::Standard,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "A-03".to_string(),
                zone_name: "Main Lobby".to_string(),
                seat_type: core_engine::WaitingSeatType::Standard,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "A-04".to_string(),
                zone_name: "Main Lobby".to_string(),
                seat_type: core_engine::WaitingSeatType::Standard,
                occupied_by_token: None,
            },
        ];

        // Create default chairs
        let operatory_chairs = vec![
            OperatoryChair {
                chair_id: Uuid::parse_str("c1111111-0000-0000-0000-000000000001").unwrap(),
                chair_code: "DENTAL-CHAIR-1".to_string(),
                state: core_engine::ChairState::Available,
            },
            OperatoryChair {
                chair_id: Uuid::parse_str("c2222222-0000-0000-0000-000000000002").unwrap(),
                chair_code: "DENTAL-CHAIR-2".to_string(),
                state: core_engine::ChairState::Available,
            },
            OperatoryChair {
                chair_id: Uuid::parse_str("c3333333-0000-0000-0000-000000000003").unwrap(),
                chair_code: "GP-CABIN-1".to_string(),
                state: core_engine::ChairState::Available,
            },
        ];

        let actor = core_engine::UnifiedClinicActor::new(
            session_id,
            waiting_seats,
            operatory_chairs,
            2, // lab interleaving ratio
            2, // late grace offset
            10, // 10 mins sterilization
            80, // 80% peak crowd threshold
        );

        let handle = SessionActorHandle::new(actor);
        let mut session_map = HashMap::new();
        session_map.insert(session_id, handle);

        // Pre-seed some lab orders
        let lab_order_id = Uuid::parse_str("b1111111-0000-0000-0000-000000000001").unwrap();
        let patient_id = Uuid::new_v4();
        let treatment_plan_id = Uuid::new_v4();
        let mut lab_map = HashMap::new();
        lab_map.insert(
            lab_order_id,
            DentalLabOrder {
                id: lab_order_id,
                clinic_id,
                treatment_plan_id,
                patient_id,
                lab_vendor_name: "Apex Precision Dental Lab".to_string(),
                prosthesis_type: "Monolithic Multi-layer Zirconia Crown - Shade A2".to_string(),
                fdi_teeth: vec![36],
                status: LabOrderStatus::ReceivedAtClinic,
                expected_delivery_at: chrono::Utc::now(),
                received_verified_at: None,
                verified_by_staff_id: None,
            },
        );

        Self {
            ws_hub: WsHub::new(),
            sessions: Arc::new(RwLock::new(session_map)),
            clinic_id,
            default_session_id: session_id,
            tokens: Arc::new(RwLock::new(HashMap::new())),
            lab_orders: Arc::new(RwLock::new(lab_map)),
            odontogram: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}
