use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use ts_rs::TS;
use uuid::Uuid;

use crate::seat_allocator::WaitingSeatType;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TokenCategory {
    Emergency,
    AnesthesiaReady, // Dental patient whose 15-min LA numbing timer has completed
    LabReturn,       // GP blood test/ECG return or Dental X-Ray return
    LateGrace,       // Patient arrived >15m past scheduled slot
    Regular,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TokenStatus {
    Booked,
    BlockedLabPending, // Blocked because lab prosthesis not yet QC verified
    CheckedIn,
    Called,
    InCabin,
    AnesthesiaWait,
    AwaitingDiagnostic,
    Completed,
    Skipped,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct QueueToken {
    pub token_id: Uuid,
    pub session_id: Uuid,
    pub token_display: String,
    pub patient_id: Uuid,
    pub patient_name: String,
    pub category: TokenCategory,
    pub status: TokenStatus,
    pub required_seat_type: WaitingSeatType,
    pub assigned_waiting_seat: Option<String>,
    pub assigned_chair_code: Option<String>,
    pub planned_duration_secs: u32,
    pub requires_sterilization: bool,
    pub lab_qc_verified: bool,
    pub estimated_wait_secs: u32,
    #[ts(type = "string | null")]
    pub anesthesia_ready_at: Option<DateTime<Utc>>,
    #[ts(type = "string")]
    pub booked_at: DateTime<Utc>,
    #[ts(type = "string | null")]
    pub checked_in_at: Option<DateTime<Utc>>,
    #[ts(type = "string | null")]
    pub called_at: Option<DateTime<Utc>>,
    #[ts(type = "string | null")]
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
pub struct PhysicianQueueEngine {
    pub ema_gp_consult_secs: f64,
    pub regular_since_last_lab: u8,
    pub lab_interleave_ratio: u8,
    pub late_grace_offset: u8,
    pub emergency_q: VecDeque<QueueToken>,
    pub anesthesia_ready_q: VecDeque<QueueToken>,
    pub lab_return_q: VecDeque<QueueToken>,
    pub grace_q: VecDeque<QueueToken>,
    pub regular_q: VecDeque<QueueToken>,
}

impl PhysicianQueueEngine {
    pub fn new(lab_interleave_ratio: u8, late_grace_offset: u8) -> Self {
        Self {
            ema_gp_consult_secs: 360.0, // 6 minutes default
            regular_since_last_lab: 0,
            lab_interleave_ratio: if lab_interleave_ratio == 0 { 2 } else { lab_interleave_ratio },
            late_grace_offset: if late_grace_offset == 0 { 2 } else { late_grace_offset },
            emergency_q: VecDeque::new(),
            anesthesia_ready_q: VecDeque::new(),
            lab_return_q: VecDeque::new(),
            grace_q: VecDeque::new(),
            regular_q: VecDeque::new(),
        }
    }

    /// Inserts token into appropriate category queue
    pub fn enqueue(&mut self, token: QueueToken) {
        match token.category {
            TokenCategory::Emergency => self.emergency_q.push_back(token),
            TokenCategory::AnesthesiaReady => self.anesthesia_ready_q.push_back(token),
            TokenCategory::LabReturn => self.lab_return_q.push_back(token),
            TokenCategory::LateGrace => self.grace_q.push_back(token),
            TokenCategory::Regular => self.regular_q.push_back(token),
        }
    }

    /// Selects the next token according to Weighted Round-Robin (WRR) and clinical urgency:
    /// 1. Emergency (highest priority)
    /// 2. AnesthesiaReady (dental patient numb and waiting)
    /// 3. LabReturn if interleaving threshold reached (e.g., 2 regular consults served)
    /// 4. LateGrace / Regular
    /// 5. Remaining LabReturn
    pub fn pop_next(&mut self) -> Option<QueueToken> {
        if let Some(token) = self.emergency_q.pop_front() {
            return Some(token);
        }

        if let Some(token) = self.anesthesia_ready_q.pop_front() {
            return Some(token);
        }

        if self.regular_since_last_lab >= self.lab_interleave_ratio && !self.lab_return_q.is_empty() {
            self.regular_since_last_lab = 0;
            return self.lab_return_q.pop_front();
        }

        if let Some(token) = self.grace_q.pop_front() {
            self.regular_since_last_lab += 1;
            return Some(token);
        }

        if let Some(token) = self.regular_q.pop_front() {
            self.regular_since_last_lab += 1;
            return Some(token);
        }

        if let Some(token) = self.lab_return_q.pop_front() {
            self.regular_since_last_lab = 0;
            return Some(token);
        }

        None
    }

    /// Updates EMA consult duration with clamping between 60s (1m) and 5400s (90m)
    pub fn update_ema_duration(&mut self, actual_duration_secs: u32) {
        let clamped = (actual_duration_secs as f64).clamp(60.0, 5400.0);
        self.ema_gp_consult_secs = (0.25 * clamped) + (0.75 * self.ema_gp_consult_secs);
    }

    /// Recomputes dynamic Estimated Wait Time (EWT) for all waiting patients across active chairs/cabins
    pub fn recompute_ewt(&mut self, active_resources_count: usize) {
        let active_count = (active_resources_count.max(1)) as u32;
        let mut cumulative_secs = 0u32;

        for q in [
            &mut self.emergency_q,
            &mut self.anesthesia_ready_q,
            &mut self.grace_q,
            &mut self.regular_q,
            &mut self.lab_return_q,
        ] {
            for token in q.iter_mut() {
                let effective_dur = if token.planned_duration_secs > 0 {
                    token.planned_duration_secs
                } else {
                    self.ema_gp_consult_secs as u32
                };
                cumulative_secs += effective_dur / active_count;
                token.estimated_wait_secs = cumulative_secs;
            }
        }
    }

    /// Returns total waiting count across all sub-queues
    pub fn total_waiting_count(&self) -> usize {
        self.emergency_q.len()
            + self.anesthesia_ready_q.len()
            + self.lab_return_q.len()
            + self.grace_q.len()
            + self.regular_q.len()
    }
}
