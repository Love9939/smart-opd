mod actor;
mod routes;
mod state;
mod ws_hub;

use axum::{
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use routes::dental::{
    anesthesia_hold_handler, complete_consultation_handler, get_odontogram_handler,
    list_lab_orders_handler, upsert_odontogram_handler, verify_lab_order_handler,
};
use routes::queue::{
    call_next_handler, cascade_delay_handler, check_in_handler, create_token_handler,
    diagnostic_pause_handler, emergency_triage_handler, get_snapshot_handler,
    list_audit_events_handler, pre_med_hold_handler, record_payment_handler,
};
use routes::ws::ws_handler;
use state::AppState;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info,api_server=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting SmartOPD & DentalFlow High-Performance Backend...");

    let state = AppState::new_with_defaults();
    let clinic_id = state.clinic_id;
    let default_session_id = state.default_session_id;

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Health check & session info
        .route(
            "/health",
            get(move || async move {
                Json(serde_json::json!({
                    "status": "UP",
                    "clinic_id": clinic_id,
                    "default_session_id": default_session_id,
                    "platform": "SmartOPD & DentalFlow Core",
                    "version": "1.0.0"
                }))
            }),
        )
        // Queue & Session Routes
        .route("/api/v1/sessions/:session_id/tokens", post(create_token_handler))
        .route(
            "/api/v1/sessions/:session_id/tokens/:token_id/check-in",
            post(check_in_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/tokens/:token_id/payment",
            post(record_payment_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/tokens/:token_id/pre-med-hold",
            post(pre_med_hold_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/emergency-triage",
            post(emergency_triage_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/chairs/:chair_id/call-next",
            post(call_next_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/snapshot",
            get(get_snapshot_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/cascade-delay",
            post(cascade_delay_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/chairs/:chair_id/diagnostic-pause",
            post(diagnostic_pause_handler),
        )
        .route(
            "/api/v1/clinics/:clinic_id/audit-events",
            get(list_audit_events_handler),
        )
        // Dental & Operatory Routes
        .route(
            "/api/v1/sessions/:session_id/chairs/:chair_id/anesthesia-hold",
            post(anesthesia_hold_handler),
        )
        .route(
            "/api/v1/sessions/:session_id/chairs/:chair_id/complete",
            post(complete_consultation_handler),
        )
        .route(
            "/api/v1/patients/:patient_id/odontogram",
            post(upsert_odontogram_handler).get(get_odontogram_handler),
        )
        .route(
            "/api/v1/lab-orders",
            get(list_lab_orders_handler),
        )
        .route(
            "/api/v1/lab-orders/:order_id/verify",
            post(verify_lab_order_handler),
        )
        // WebSocket Hub Stream
        .route("/ws/clinic/:clinic_id", get(ws_handler))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse::<u16>()?;
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("SmartOPD & DentalFlow Axum server listening on {}", addr);
    tracing::info!("Clinic ID: {}", clinic_id);
    tracing::info!("Default Session ID: {}", default_session_id);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
