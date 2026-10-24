use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatsAppNotificationRequest {
    pub recipient_phone: String,
    pub template_name: String,
    pub parameters: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RazorpayPaymentWebhookPayload {
    pub payment_id: String,
    pub order_id: String,
    pub amount_inr: u32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbdmScanShareProfile {
    pub abha_address: String,
    pub full_name: String,
    pub gender: String,
    pub year_of_birth: i16,
    pub mobile: String,
}

pub struct WhatsAppClient;

impl WhatsAppClient {
    pub async fn send_cascade_delay_alert(
        phone: &str,
        patient_name: &str,
        delay_mins: i16,
        new_estimated_time: &str,
    ) -> Result<(), String> {
        tracing::info!(
            "WhatsApp cascade delay alert -> {}: Dear {}, doctor is running {} mins late. New estimated time: {}",
            phone, patient_name, delay_mins, new_estimated_time
        );
        Ok(())
    }

    pub async fn send_digital_receipt(
        phone: &str,
        receipt_id: &str,
        amount_paid: u32,
        balance_due: u32,
    ) -> Result<(), String> {
        tracing::info!(
            "WhatsApp receipt -> {}: Payment of ₹{} recorded (Receipt: {}). Remaining balance: ₹{}",
            phone, amount_paid, receipt_id, balance_due
        );
        Ok(())
    }
}
