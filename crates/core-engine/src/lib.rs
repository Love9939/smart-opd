pub mod dental_actor;
pub mod fee_policy;
pub mod physician_actor;
pub mod seat_allocator;

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

pub use dental_actor::{ChairState, DentalOperatoryMatrix, OperatoryChair};
pub use fee_policy::{FeeCalculationResult, FeePolicyEngine, TreatmentPlanLedger};
pub use physician_actor::{PhysicianQueueEngine, QueueToken, TokenCategory, TokenStatus};
pub use seat_allocator::{SeatAllocator, WaitingSeat, WaitingSeatType};

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct UnifiedSessionSnapshot {
    pub session_id: Uuid,
    pub ema_gp_consult_secs: f64,
    pub total_waiting: usize,
    pub waiting_seats: Vec<WaitingSeat>,
    pub operatory_chairs: Vec<OperatoryChair>,
    pub lobby_occupancy_pct: u8,
    pub is_peak_crowd: bool,
}

#[derive(Debug, Clone)]
pub struct UnifiedClinicActor {
    pub session_id: Uuid,
    pub queue_engine: PhysicianQueueEngine,
    pub seat_allocator: SeatAllocator,
    pub operatory_matrix: DentalOperatoryMatrix,
}

impl UnifiedClinicActor {
    pub fn new(
        session_id: Uuid,
        waiting_seats: Vec<WaitingSeat>,
        operatory_chairs: Vec<OperatoryChair>,
        lab_interleave_ratio: u8,
        late_grace_offset: u8,
        sterilization_duration_mins: i64,
        max_lobby_occupancy_pct: u8,
    ) -> Self {
        Self {
            session_id,
            queue_engine: PhysicianQueueEngine::new(lab_interleave_ratio, late_grace_offset),
            seat_allocator: SeatAllocator::new(waiting_seats, max_lobby_occupancy_pct),
            operatory_matrix: DentalOperatoryMatrix::new(operatory_chairs, sterilization_duration_mins),
        }
    }

    /// Checks in a patient, verifies dental lab readiness gate, and allocates a physical waiting seat
    pub fn check_in_patient(&mut self, mut token: QueueToken) -> Result<QueueToken, String> {
        // Lab gate: If this procedure depends on an external prosthodontic lab crown/bridge,
        // it cannot be checked in unless marked QC_VERIFIED
        if !token.lab_qc_verified {
            return Err(format!(
                "Cannot check in {}: External Dental Lab prosthesis is not marked QC_VERIFIED.",
                token.token_display
            ));
        }

        // Allocate physical waiting room seat
        if let Some(seat_code) = self.seat_allocator.allocate_seat(token.token_id, token.required_seat_type) {
            token.assigned_waiting_seat = Some(seat_code);
        }

        token.status = TokenStatus::CheckedIn;
        token.checked_in_at = Some(Utc::now());

        self.queue_engine.enqueue(token.clone());
        self.queue_engine.recompute_ewt(self.operatory_matrix.chairs.len());

        Ok(token)
    }

    /// Dental Workflow: Places patient on a Local Anesthesia (LA) Numbing Hold
    /// Moves them to a Numbing Lounge seat (or keeps them in Chair while Dentist moves to Chair 2)
    pub fn start_dental_anesthesia_hold(
        &mut self,
        chair_id: Uuid,
        mut token: QueueToken,
        numbing_mins: i64,
        move_to_numbing_lounge: bool,
        now: DateTime<Utc>,
    ) -> Result<QueueToken, String> {
        let ready_at = now + Duration::minutes(numbing_mins);
        token.anesthesia_ready_at = Some(ready_at);
        token.status = TokenStatus::AnesthesiaWait;

        if move_to_numbing_lounge {
            // Free operatory chair
            self.operatory_matrix.release_chair_to_numbing_lounge(chair_id)?;
            // Allocate numbing lounge seat
            if let Some(lounge_seat_code) = self.seat_allocator.allocate_numbing_seat(token.token_id) {
                token.assigned_waiting_seat = Some(lounge_seat_code);
            }
        } else {
            // Keep patient in this chair on hold
            self.operatory_matrix.hold_for_anesthesia(chair_id, token.token_id, numbing_mins, now)?;
        }

        token.category = TokenCategory::AnesthesiaReady;
        self.queue_engine.enqueue(token.clone());
        self.queue_engine.recompute_ewt(self.operatory_matrix.chairs.len());

        Ok(token)
    }

    /// Completes consultation/procedure and triggers Sterilization Lock if required
    pub fn complete_consultation(
        &mut self,
        chair_id: Uuid,
        actual_duration_secs: u32,
        requires_sterilization: bool,
        now: DateTime<Utc>,
    ) -> Result<(), String> {
        self.queue_engine.update_ema_duration(actual_duration_secs);
        self.operatory_matrix.complete_visit(chair_id, requires_sterilization, now)?;
        self.queue_engine.recompute_ewt(self.operatory_matrix.chairs.len());
        Ok(())
    }

    /// Calls the next optimal patient into an available Cabin or Dental Operatory Chair
    pub fn call_next_for_chair(&mut self, target_chair_id: Uuid, now: DateTime<Utc>) -> Result<QueueToken, String> {
        // Auto-unlock chairs whose sterilization timer has expired
        self.operatory_matrix.refresh_sterilization_status(now);

        let chair = self
            .operatory_matrix
            .chairs
            .iter()
            .find(|c| c.chair_id == target_chair_id)
            .ok_or_else(|| "Target clinical chair/cabin not found".to_string())?;

        if chair.state != ChairState::Available {
            return Err(format!(
                "Chair {} is currently not Available ({:?})",
                chair.chair_code, chair.state
            ));
        }

        let mut called_token = self
            .queue_engine
            .pop_next()
            .ok_or_else(|| "No waiting patients in any queue".to_string())?;

        // Release physical waiting room seat
        self.seat_allocator.release_seat(called_token.token_id);
        called_token.assigned_waiting_seat = None;

        // Assign to target chair
        let chair_code = self.operatory_matrix.assign_chair(target_chair_id, called_token.token_id)?;
        called_token.assigned_chair_code = Some(chair_code);
        called_token.status = TokenStatus::Called;
        called_token.called_at = Some(now);

        self.queue_engine.recompute_ewt(self.operatory_matrix.chairs.len());
        Ok(called_token)
    }

    /// Generates live state snapshot for clients & TV displays
    pub fn snapshot(&self) -> UnifiedSessionSnapshot {
        UnifiedSessionSnapshot {
            session_id: self.session_id,
            ema_gp_consult_secs: self.queue_engine.ema_gp_consult_secs,
            total_waiting: self.queue_engine.total_waiting_count(),
            waiting_seats: self.seat_allocator.seats.clone(),
            operatory_chairs: self.operatory_matrix.chairs.clone(),
            lobby_occupancy_pct: self.seat_allocator.occupancy_pct(),
            is_peak_crowd: self.seat_allocator.is_peak_crowd_mode(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_actor() -> UnifiedClinicActor {
        let session_id = Uuid::new_v4();
        let seats = vec![
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "P-01".to_string(),
                zone_name: "Priority Zone".to_string(),
                seat_type: WaitingSeatType::PriorityElderlyPregnant,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "N-01".to_string(),
                zone_name: "Numbing Lounge".to_string(),
                seat_type: WaitingSeatType::NumbingLounge,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "A-01".to_string(),
                zone_name: "Main Lobby".to_string(),
                seat_type: WaitingSeatType::Standard,
                occupied_by_token: None,
            },
            WaitingSeat {
                seat_id: Uuid::new_v4(),
                seat_code: "A-02".to_string(),
                zone_name: "Main Lobby".to_string(),
                seat_type: WaitingSeatType::Standard,
                occupied_by_token: None,
            },
        ];

        let chairs = vec![
            OperatoryChair {
                chair_id: Uuid::new_v4(),
                chair_code: "DENTAL-CHAIR-1".to_string(),
                state: ChairState::Available,
            },
            OperatoryChair {
                chair_id: Uuid::new_v4(),
                chair_code: "DENTAL-CHAIR-2".to_string(),
                state: ChairState::Available,
            },
        ];

        UnifiedClinicActor::new(session_id, seats, chairs, 2, 2, 10, 80)
    }

    fn create_token(display: &str, category: TokenCategory, seat_type: WaitingSeatType, lab_qc: bool) -> QueueToken {
        QueueToken {
            token_id: Uuid::new_v4(),
            session_id: Uuid::new_v4(),
            token_display: display.to_string(),
            patient_id: Uuid::new_v4(),
            patient_name: format!("Patient {}", display),
            category,
            status: TokenStatus::Booked,
            required_seat_type: seat_type,
            assigned_waiting_seat: None,
            assigned_chair_code: None,
            planned_duration_secs: 360,
            requires_sterilization: false,
            lab_qc_verified: lab_qc,
            estimated_wait_secs: 0,
            anesthesia_ready_at: None,
            booked_at: Utc::now(),
            checked_in_at: None,
            called_at: None,
            completed_at: None,
        }
    }

    #[test]
    fn test_dental_lab_qc_gate() {
        let mut actor = create_test_actor();

        // Token with missing lab QC verification
        let token_unverified = create_token("D-01", TokenCategory::Regular, WaitingSeatType::Standard, false);
        let result = actor.check_in_patient(token_unverified);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not marked QC_VERIFIED"));

        // Token with QC verified lab order
        let token_verified = create_token("D-02", TokenCategory::Regular, WaitingSeatType::Standard, true);
        let result = actor.check_in_patient(token_verified);
        assert!(result.is_ok());
    }

    #[test]
    fn test_priority_seat_allocation() {
        let mut actor = create_test_actor();

        let elderly_token = create_token("P-01", TokenCategory::Regular, WaitingSeatType::PriorityElderlyPregnant, true);
        let checked_in = actor.check_in_patient(elderly_token).unwrap();
        assert_eq!(checked_in.assigned_waiting_seat.as_deref(), Some("P-01"));

        // Second priority patient falls back to standard
        let elderly_token2 = create_token("P-02", TokenCategory::Regular, WaitingSeatType::PriorityElderlyPregnant, true);
        let checked_in2 = actor.check_in_patient(elderly_token2).unwrap();
        assert_eq!(checked_in2.assigned_waiting_seat.as_deref(), Some("A-01"));
    }

    #[test]
    fn test_wrr_interleaving_priority() {
        let mut actor = create_test_actor();
        let chair_id = actor.operatory_matrix.chairs[0].chair_id;

        // Add 1 Emergency, 1 AnesthesiaReady, 3 Regular, 1 LabReturn
        actor.check_in_patient(create_token("REG-1", TokenCategory::Regular, WaitingSeatType::Standard, true)).unwrap();
        actor.check_in_patient(create_token("REG-2", TokenCategory::Regular, WaitingSeatType::Standard, true)).unwrap();
        actor.check_in_patient(create_token("REG-3", TokenCategory::Regular, WaitingSeatType::Standard, true)).unwrap();
        actor.check_in_patient(create_token("LAB-1", TokenCategory::LabReturn, WaitingSeatType::Standard, true)).unwrap();
        actor.check_in_patient(create_token("EMG-1", TokenCategory::Emergency, WaitingSeatType::Standard, true)).unwrap();
        actor.check_in_patient(create_token("ANES-1", TokenCategory::AnesthesiaReady, WaitingSeatType::Standard, true)).unwrap();

        let now = Utc::now();

        // 1. First called MUST be Emergency
        let call1 = actor.call_next_for_chair(chair_id, now).unwrap();
        assert_eq!(call1.token_display, "EMG-1");
        actor.operatory_matrix.chairs[0].state = ChairState::Available; // simulate finish

        // 2. Second called MUST be AnesthesiaReady
        let call2 = actor.call_next_for_chair(chair_id, now).unwrap();
        assert_eq!(call2.token_display, "ANES-1");
        actor.operatory_matrix.chairs[0].state = ChairState::Available;

        // 3. Regular 1
        let call3 = actor.call_next_for_chair(chair_id, now).unwrap();
        assert_eq!(call3.token_display, "REG-1");
        actor.operatory_matrix.chairs[0].state = ChairState::Available;

        // 4. Regular 2
        let call4 = actor.call_next_for_chair(chair_id, now).unwrap();
        assert_eq!(call4.token_display, "REG-2");
        actor.operatory_matrix.chairs[0].state = ChairState::Available;

        // 5. Interleaved LabReturn after 2 regulars (lab_interleave_ratio = 2)
        let call5 = actor.call_next_for_chair(chair_id, now).unwrap();
        assert_eq!(call5.token_display, "LAB-1");
        actor.operatory_matrix.chairs[0].state = ChairState::Available;

        // 6. Regular 3
        let call6 = actor.call_next_for_chair(chair_id, now).unwrap();
        assert_eq!(call6.token_display, "REG-3");
    }

    #[test]
    fn test_sterilization_lock_and_auto_unlock() {
        let mut actor = create_test_actor();
        let chair_id = actor.operatory_matrix.chairs[0].chair_id;
        let now = Utc::now();

        // Complete visit with sterilization lock
        actor.complete_consultation(chair_id, 300, true, now).unwrap();

        // Verify chair is in SterilizationLock
        let chair = &actor.operatory_matrix.chairs[0];
        assert!(matches!(chair.state, ChairState::SterilizationLock { .. }));

        // Attempting to call next immediately must fail
        actor.check_in_patient(create_token("REG-1", TokenCategory::Regular, WaitingSeatType::Standard, true)).unwrap();
        let err = actor.call_next_for_chair(chair_id, now);
        assert!(err.is_err());

        // Advance time by 11 minutes (past 10 min default sterilization duration)
        let future = now + Duration::minutes(11);
        let called = actor.call_next_for_chair(chair_id, future).unwrap();
        assert_eq!(called.token_display, "REG-1");
    }

    #[test]
    fn test_anesthesia_hold_and_numbing_lounge_swap() {
        let mut actor = create_test_actor();
        let chair1_id = actor.operatory_matrix.chairs[0].chair_id;
        let now = Utc::now();

        let token = create_token("RCT-36", TokenCategory::Regular, WaitingSeatType::Standard, true);
        let _checked_in = actor.check_in_patient(token).unwrap();

        // Patient called to Chair 1
        let called = actor.call_next_for_chair(chair1_id, now).unwrap();
        assert_eq!(called.token_display, "RCT-36");

        // Dentist gives nerve block and moves patient to Numbing Lounge
        let held = actor.start_dental_anesthesia_hold(chair1_id, called, 15, true, now).unwrap();
        assert_eq!(held.status, TokenStatus::AnesthesiaWait);
        assert_eq!(held.category, TokenCategory::AnesthesiaReady);
        assert_eq!(held.assigned_waiting_seat.as_deref(), Some("N-01"));

        // Chair 1 is now Available for another patient
        assert_eq!(actor.operatory_matrix.chairs[0].state, ChairState::Available);
    }
}
