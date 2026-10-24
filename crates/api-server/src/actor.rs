use chrono::{DateTime, Utc};
use core_engine::{QueueToken, UnifiedClinicActor, UnifiedSessionSnapshot};
use tokio::sync::{mpsc, oneshot};
use uuid::Uuid;

pub enum SessionCommand {
    CheckIn {
        token: QueueToken,
        reply: oneshot::Sender<Result<QueueToken, String>>,
    },
    CallNext {
        chair_id: Uuid,
        now: DateTime<Utc>,
        reply: oneshot::Sender<Result<QueueToken, String>>,
    },
    AnesthesiaHold {
        chair_id: Uuid,
        token: QueueToken,
        numbing_mins: i64,
        move_to_numbing_lounge: bool,
        now: DateTime<Utc>,
        reply: oneshot::Sender<Result<QueueToken, String>>,
    },
    CompleteConsultation {
        chair_id: Uuid,
        actual_duration_secs: u32,
        requires_sterilization: bool,
        now: DateTime<Utc>,
        reply: oneshot::Sender<Result<(), String>>,
    },
    GetSnapshot {
        reply: oneshot::Sender<UnifiedSessionSnapshot>,
    },
}

#[derive(Clone)]
pub struct SessionActorHandle {
    sender: mpsc::Sender<SessionCommand>,
}

impl SessionActorHandle {
    pub fn new(mut actor: UnifiedClinicActor) -> Self {
        let (sender, mut receiver) = mpsc::channel::<SessionCommand>(256);

        tokio::spawn(async move {
            while let Some(cmd) = receiver.recv().await {
                match cmd {
                    SessionCommand::CheckIn { token, reply } => {
                        let res = actor.check_in_patient(token);
                        let _ = reply.send(res);
                    }
                    SessionCommand::CallNext { chair_id, now, reply } => {
                        let res = actor.call_next_for_chair(chair_id, now);
                        let _ = reply.send(res);
                    }
                    SessionCommand::AnesthesiaHold {
                        chair_id,
                        token,
                        numbing_mins,
                        move_to_numbing_lounge,
                        now,
                        reply,
                    } => {
                        let res = actor.start_dental_anesthesia_hold(
                            chair_id,
                            token,
                            numbing_mins,
                            move_to_numbing_lounge,
                            now,
                        );
                        let _ = reply.send(res);
                    }
                    SessionCommand::CompleteConsultation {
                        chair_id,
                        actual_duration_secs,
                        requires_sterilization,
                        now,
                        reply,
                    } => {
                        let res = actor.complete_consultation(
                            chair_id,
                            actual_duration_secs,
                            requires_sterilization,
                            now,
                        );
                        let _ = reply.send(res);
                    }
                    SessionCommand::GetSnapshot { reply } => {
                        let _ = reply.send(actor.snapshot());
                    }
                }
            }
        });

        Self { sender }
    }

    pub async fn check_in(&self, token: QueueToken) -> Result<QueueToken, String> {
        let (reply, rx) = oneshot::channel();
        self.sender
            .send(SessionCommand::CheckIn { token, reply })
            .await
            .map_err(|e| e.to_string())?;
        rx.await.map_err(|e| e.to_string())?
    }

    pub async fn call_next(&self, chair_id: Uuid, now: DateTime<Utc>) -> Result<QueueToken, String> {
        let (reply, rx) = oneshot::channel();
        self.sender
            .send(SessionCommand::CallNext { chair_id, now, reply })
            .await
            .map_err(|e| e.to_string())?;
        rx.await.map_err(|e| e.to_string())?
    }

    pub async fn anesthesia_hold(
        &self,
        chair_id: Uuid,
        token: QueueToken,
        numbing_mins: i64,
        move_to_numbing_lounge: bool,
        now: DateTime<Utc>,
    ) -> Result<QueueToken, String> {
        let (reply, rx) = oneshot::channel();
        self.sender
            .send(SessionCommand::AnesthesiaHold {
                chair_id,
                token,
                numbing_mins,
                move_to_numbing_lounge,
                now,
                reply,
            })
            .await
            .map_err(|e| e.to_string())?;
        rx.await.map_err(|e| e.to_string())?
    }

    pub async fn complete_consultation(
        &self,
        chair_id: Uuid,
        actual_duration_secs: u32,
        requires_sterilization: bool,
        now: DateTime<Utc>,
    ) -> Result<(), String> {
        let (reply, rx) = oneshot::channel();
        self.sender
            .send(SessionCommand::CompleteConsultation {
                chair_id,
                actual_duration_secs,
                requires_sterilization,
                now,
                reply,
            })
            .await
            .map_err(|e| e.to_string())?;
        rx.await.map_err(|e| e.to_string())?
    }

    pub async fn get_snapshot(&self) -> Result<UnifiedSessionSnapshot, String> {
        let (reply, rx) = oneshot::channel();
        self.sender
            .send(SessionCommand::GetSnapshot { reply })
            .await
            .map_err(|e| e.to_string())?;
        rx.await.map_err(|e| e.to_string())
    }
}
