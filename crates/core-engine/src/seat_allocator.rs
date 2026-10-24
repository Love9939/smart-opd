use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum WaitingSeatType {
    Standard,
    PriorityElderlyPregnant,
    Wheelchair,
    IsolationFever,
    NumbingLounge,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WaitingSeat {
    pub seat_id: Uuid,
    pub seat_code: String,
    pub zone_name: String,
    pub seat_type: WaitingSeatType,
    pub occupied_by_token: Option<Uuid>,
}

#[derive(Debug, Clone, Default)]
pub struct SeatAllocator {
    pub seats: Vec<WaitingSeat>,
    pub max_lobby_occupancy_pct: u8,
}

impl SeatAllocator {
    pub fn new(seats: Vec<WaitingSeat>, max_lobby_occupancy_pct: u8) -> Self {
        Self {
            seats,
            max_lobby_occupancy_pct: if max_lobby_occupancy_pct == 0 { 80 } else { max_lobby_occupancy_pct },
        }
    }

    /// Allocates an appropriate physical seat based on priority requirements with standard fallback
    pub fn allocate_seat(&mut self, token_id: Uuid, preferred_type: WaitingSeatType) -> Option<String> {
        // First try to find an exact seat type match
        let seat_idx = self
            .seats
            .iter()
            .position(|s| s.occupied_by_token.is_none() && s.seat_type == preferred_type)
            .or_else(|| {
                // If preferred is not standard, fallback to Standard seat
                if preferred_type != WaitingSeatType::Standard {
                    self.seats
                        .iter()
                        .position(|s| s.occupied_by_token.is_none() && s.seat_type == WaitingSeatType::Standard)
                } else {
                    None
                }
            });

        if let Some(idx) = seat_idx {
            self.seats[idx].occupied_by_token = Some(token_id);
            Some(self.seats[idx].seat_code.clone())
        } else {
            None
        }
    }

    /// Allocates specifically a numbing lounge seat for dental anesthesia hold
    pub fn allocate_numbing_seat(&mut self, token_id: Uuid) -> Option<String> {
        let seat_idx = self
            .seats
            .iter()
            .position(|s| s.occupied_by_token.is_none() && s.seat_type == WaitingSeatType::NumbingLounge)
            .or_else(|| {
                self.seats
                    .iter()
                    .position(|s| s.occupied_by_token.is_none() && s.seat_type == WaitingSeatType::Standard)
            });

        if let Some(idx) = seat_idx {
            self.seats[idx].occupied_by_token = Some(token_id);
            Some(self.seats[idx].seat_code.clone())
        } else {
            None
        }
    }

    /// Releases any seat occupied by a specific token
    pub fn release_seat(&mut self, token_id: Uuid) -> Option<String> {
        for seat in &mut self.seats {
            if seat.occupied_by_token == Some(token_id) {
                seat.occupied_by_token = None;
                return Some(seat.seat_code.clone());
            }
        }
        None
    }

    /// Returns current lobby occupancy percentage (0-100)
    pub fn occupancy_pct(&self) -> u8 {
        if self.seats.is_empty() {
            return 0;
        }
        let occupied = self.seats.iter().filter(|s| s.occupied_by_token.is_some()).count();
        ((occupied as f64 / self.seats.len() as f64) * 100.0).round() as u8
    }

    /// Checks if lobby is exceeding peak crowd occupancy (e.g., >80%)
    pub fn is_peak_crowd_mode(&self) -> bool {
        self.occupancy_pct() >= self.max_lobby_occupancy_pct
    }
}
