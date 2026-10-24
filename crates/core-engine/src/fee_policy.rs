use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FeeCalculationResult {
    pub fee_inr: u32,
    pub is_free_followup: bool,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TreatmentPlanLedger {
    pub treatment_plan_id: Uuid,
    pub total_estimated_inr: u32,
    pub total_paid_inr: u32,
    pub balance_due_inr: u32,
    pub total_sittings_planned: u8,
    pub sittings_completed: u8,
    pub is_fully_settled: bool,
}

pub struct FeePolicyEngine {
    pub free_followup_days: i64,
    pub standard_consultation_fee_inr: u32,
}

impl FeePolicyEngine {
    pub fn new(free_followup_days: i64, standard_consultation_fee_inr: u32) -> Self {
        Self {
            free_followup_days: if free_followup_days <= 0 { 5 } else { free_followup_days },
            standard_consultation_fee_inr: if standard_consultation_fee_inr == 0 { 500 } else { standard_consultation_fee_inr },
        }
    }

    /// Evaluates if patient qualifies for a free follow-up or standard consultation fee
    pub fn calculate_consultation_fee(
        &self,
        last_completed_visit: Option<DateTime<Utc>>,
        now: DateTime<Utc>,
    ) -> FeeCalculationResult {
        if let Some(last_visit) = last_completed_visit {
            let cutoff = last_visit + Duration::days(self.free_followup_days);
            if now <= cutoff {
                return FeeCalculationResult {
                    fee_inr: 0,
                    is_free_followup: true,
                    reason: format!(
                        "Eligible for Free Follow-up (within {}-day window of previous visit)",
                        self.free_followup_days
                    ),
                };
            }
        }

        FeeCalculationResult {
            fee_inr: self.standard_consultation_fee_inr,
            is_free_followup: false,
            reason: "Standard Consultation Fee Applicable".to_string(),
        }
    }

    /// Computes running ledger balance for dental multi-sitting treatment plans
    pub fn compute_treatment_plan_ledger(
        treatment_plan_id: Uuid,
        total_estimated_inr: u32,
        total_paid_inr: u32,
        total_sittings_planned: u8,
        sittings_completed: u8,
    ) -> TreatmentPlanLedger {
        let balance_due_inr = total_estimated_inr.saturating_sub(total_paid_inr);
        let is_fully_settled = balance_due_inr == 0;

        TreatmentPlanLedger {
            treatment_plan_id,
            total_estimated_inr,
            total_paid_inr,
            balance_due_inr,
            total_sittings_planned,
            sittings_completed,
            is_fully_settled,
        }
    }
}
