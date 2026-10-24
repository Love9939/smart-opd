use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use uuid::Uuid;

use crate::state::AppState;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(clinic_id): Path<Uuid>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, clinic_id, state))
}

async fn handle_socket(socket: WebSocket, clinic_id: Uuid, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.ws_hub.subscribe(clinic_id).await;

    // Task to forward broadcast events to this client
    let mut send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            if let Ok(json_str) = serde_json::to_string(&event) {
                if sender.send(Message::Text(json_str)).await.is_err() {
                    break;
                }
            }
        }
    });

    // Task to receive client messages (e.g. heartbeat ping)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Ping(_) => {}
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    // Terminate when either task finishes
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
