use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum ChairState {
    Available,
    Occupied {
        token_id: Uuid,
    },
    AnesthesiaHold {
        token_id: Uuid,
        #[ts(type = "string")]
        ready_at: DateTime<Utc>,
    },
    SterilizationLock {
        #[ts(type = "string")]
        unlocks_at: DateTime<Utc>,
    },
    Maintenance,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct OperatoryChair {
    pub chair_id: Uuid,
    pub chair_code: String,
    pub state: ChairState,
}

#[derive(Debug, Clone)]
pub struct DentalOperatoryMatrix {
    pub chairs: Vec<OperatoryChair>,
    pub default_sterilization_mins: i64,
}

impl DentalOperatoryMatrix {
    pub fn new(chairs: Vec<OperatoryChair>, default_sterilization_mins: i64) -> Self {
        Self {
            chairs,
            default_sterilization_mins: if default_sterilization_mins <= 0 { 10 } else { default_sterilization_mins },
        }
    }

    /// Auto-unlocks chairs whose sterilization period has expired
    pub fn refresh_sterilization_status(&mut self, now: DateTime<Utc>) {
        for chair in &mut self.chairs {
            if let ChairState::SterilizationLock { unlocks_at } = chair.state {
                if now >= unlocks_at {
                    chair.state = ChairState::Available;
                }
            }
        }
    }

    /// Checks if a patient on Anesthesia Hold is now numb and ready for procedure
    pub fn check_anesthesia_readiness(&self, token_id: Uuid, now: DateTime<Utc>) -> bool {
        for chair in &self.chairs {
            if let ChairState::AnesthesiaHold {
                token_id: held_id,
                ready_at,
            } = chair.state
            {
                if held_id == token_id && now >= ready_at {
                    return true;
                }
            }
        }
        false
    }

    /// Places current chair on Local Anesthesia (LA) Numbing Hold
    pub fn hold_for_anesthesia(
        &mut self,
        chair_id: Uuid,
        token_id: Uuid,
        numbing_mins: i64,
        now: DateTime<Utc>,
    ) -> Result<DateTime<Utc>, String> {
        let chair = self
            .chairs
            .iter_mut()
            .find(|c| c.chair_id == chair_id)
            .ok_or_else(|| "Operatory chair not found".to_string())?;

        let ready_at = now + Duration::minutes(numbing_mins);
        chair.state = ChairState::AnesthesiaHold {
            token_id,
            ready_at,
        };
        Ok(ready_at)
    }

    /// Frees chair if patient is moved to the Numbing Lounge
    pub fn release_chair_to_numbing_lounge(&mut self, chair_id: Uuid) -> Result<(), String> {
        let chair = self
            .chairs
            .iter_mut()
            .find(|c| c.chair_id == chair_id)
            .ok_or_else(|| "Operatory chair not found".to_string())?;

        chair.state = ChairState::Available;
        Ok(())
    }

    /// Completes consultation or procedure and optionally triggers Sterilization Lock
    pub fn complete_visit(
        &mut self,
        chair_id: Uuid,
        requires_sterilization: bool,
        now: DateTime<Utc>,
    ) -> Result<(), String> {
        let chair = self
            .chairs
            .iter_mut()
            .find(|c| c.chair_id == chair_id)
            .ok_or_else(|| "Operatory chair not found".to_string())?;

        if requires_sterilization {
            chair.state = ChairState::SterilizationLock {
                unlocks_at: now + Duration::minutes(self.default_sterilization_mins),
            };
        } else {
            chair.state = ChairState::Available;
        }
        Ok(())
    }

    /// Assigns a token to an available chair
    pub fn assign_chair(&mut self, chair_id: Uuid, token_id: Uuid) -> Result<String, String> {
        let chair = self
            .chairs
            .iter_mut()
            .find(|c| c.chair_id == chair_id)
            .ok_or_else(|| "Operatory chair not found".to_string())?;

        if chair.state != ChairState::Available {
            return Err(format!(
                "Chair {} is not available (current state: {:?})",
                chair.chair_code, chair.state
            ));
        }

        chair.state = ChairState::Occupied { token_id };
        Ok(chair.chair_code.clone())
    }

    /// Finds any available chair
    pub fn find_available_chair(&self) -> Option<&OperatoryChair> {
        self.chairs.iter().find(|c| c.state == ChairState::Available)
    }
}
