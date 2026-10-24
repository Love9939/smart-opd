use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum ClinicSpecialty {
    GeneralPhysician,
    Dental,
    PolyclinicHybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Clinic {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub specialty: ClinicSpecialty,
    pub abha_hfr_id: Option<String>,
    #[ts(type = "Record<string, any>")]
    pub config: serde_json::Value,
    #[ts(type = "string")]
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Patient {
    pub id: Uuid,
    pub clinic_id: Uuid,
    pub household_phone: String,
    pub full_name: String,
    pub age: i16,
    pub gender: String,
    pub abha_address: Option<String>,
    pub priority_flags: Vec<String>,
    pub medical_alerts: Vec<String>,
    #[ts(type = "string | null")]
    pub dpdp_consent_signed_at: Option<DateTime<Utc>>,
    #[ts(type = "string")]
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DentalTreatmentPlan {
    pub id: Uuid,
    pub clinic_id: Uuid,
    pub patient_id: Uuid,
    pub procedure_name: String,
    pub fdi_tooth_numbers: Vec<i16>,
    pub total_estimated_inr: i32,
    pub total_paid_inr: i32,
    pub total_sittings_planned: i16,
    pub sittings_completed: i16,
    pub status: String,
    #[ts(type = "string")]
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum LabOrderStatus {
    ImpressionTaken,
    SentToLab,
    InTransit,
    ReceivedAtClinic,
    QcVerified,
    Fitted,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DentalLabOrder {
    pub id: Uuid,
    pub clinic_id: Uuid,
    pub treatment_plan_id: Uuid,
    pub patient_id: Uuid,
    pub lab_vendor_name: String,
    pub prosthesis_type: String,
    pub fdi_teeth: Vec<i16>,
    pub status: LabOrderStatus,
    #[ts(type = "string")]
    pub expected_delivery_at: DateTime<Utc>,
    #[ts(type = "string | null")]
    pub received_verified_at: Option<DateTime<Utc>>,
    pub verified_by_staff_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DentalOdontogramRecord {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub fdi_tooth: i16,
    pub surfaces: Vec<String>,
    pub condition_code: String,
    pub notes: Option<String>,
    pub iopa_xray_url: Option<String>,
    #[ts(type = "string")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct OpdSession {
    pub id: Uuid,
    pub clinic_id: Uuid,
    pub doctor_id: Uuid,
    #[ts(type = "string")]
    pub session_date: NaiveDate,
    pub shift_name: String,
    pub ema_consult_secs: i32,
    pub regular_since_last_lab: i16,
    pub cascade_delay_mins: i16,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TokenAuditEvent {
    pub id: i64,
    pub clinic_id: Uuid,
    pub token_id: Uuid,
    pub actor_id: Uuid,
    pub actor_role: String,
    pub action_type: String,
    #[ts(type = "Record<string, any> | null")]
    pub old_payload: Option<serde_json::Value>,
    #[ts(type = "Record<string, any>")]
    pub new_payload: serde_json::Value,
    #[ts(type = "string")]
    pub created_at: DateTime<Utc>,
}
