export type WaitingSeatType =
  | 'Standard'
  | 'PriorityElderlyPregnant'
  | 'Wheelchair'
  | 'IsolationFever'
  | 'NumbingLounge';

export type TokenCategory =
  | 'Emergency'
  | 'AnesthesiaReady'
  | 'LabReturn'
  | 'LateGrace'
  | 'Regular';

export type TokenStatus =
  | 'Booked'
  | 'BlockedLabPending'
  | 'CheckedIn'
  | 'Called'
  | 'InCabin'
  | 'AnesthesiaWait'
  | 'AwaitingDiagnostic'
  | 'Completed'
  | 'Skipped'
  | 'Cancelled';

export type ChairState =
  | { type: 'Available' }
  | { type: 'Occupied'; token_id: string }
  | { type: 'AnesthesiaHold'; token_id: string; ready_at: string }
  | { type: 'SterilizationLock'; unlocks_at: string }
  | { type: 'Maintenance' };

export interface WaitingSeat {
  seat_id: string;
  seat_code: string;
  zone_name: string;
  seat_type: WaitingSeatType;
  occupied_by_token: string | null;
}

export interface OperatoryChair {
  chair_id: string;
  chair_code: string;
  state: ChairState;
}

export interface QueueToken {
  token_id: string;
  session_id: string;
  token_display: string;
  patient_id: string;
  patient_name: string;
  category: TokenCategory;
  status: TokenStatus;
  required_seat_type: WaitingSeatType;
  assigned_waiting_seat?: string | null;
  assigned_chair_code?: string | null;
  planned_duration_secs: number;
  requires_sterilization: boolean;
  lab_qc_verified: boolean;
  estimated_wait_secs: number;
  anesthesia_ready_at?: string | null;
  booked_at: string;
  checked_in_at?: string | null;
  called_at?: string | null;
  completed_at?: string | null;
  vitals?: {
    bp?: string;
    spo2?: number;
    temp?: number;
    rbs?: number;
    weight?: number;
  };
  chief_complaint?: string;
  rx_image_url?: string;
}

export interface DentalOdontogramRecord {
  id: string;
  patient_id: string;
  fdi_tooth: number;
  surfaces: ('M' | 'O' | 'D' | 'B' | 'L')[];
  condition_code: 'HEALTHY' | 'DEEP_CARIES' | 'PULPITIS' | 'MISSING' | 'RCT_TREATED' | 'CROWN_PRESENT' | 'ROOT_STUMP';
  treatment_action?: 'NONE' | 'COMPOSITE_FILLING' | 'RCT' | 'ZIRCONIA_CROWN' | 'EXTRACTION' | 'IMPLANT';
  estimated_cost_inr?: number;
  notes?: string;
  iopa_xray_url?: string;
  updated_at: string;
}

export interface DentalLabOrder {
  id: string;
  clinic_id: string;
  treatment_plan_id: string;
  patient_id: string;
  lab_vendor_name: string;
  prosthesis_type: string;
  fdi_teeth: number[];
  status: 'ImpressionTaken' | 'SentToLab' | 'InTransit' | 'ReceivedAtClinic' | 'QcVerified' | 'Fitted';
  expected_delivery_at: string;
  received_verified_at: string | null;
}

export interface SessionSnapshot {
  session_id: string;
  ema_gp_consult_secs: number;
  total_waiting: number;
  waiting_seats: WaitingSeat[];
  operatory_chairs: OperatoryChair[];
  lobby_occupancy_pct: number;
  is_peak_crowd: boolean;
}

export interface TtsAnnouncements {
  'en-IN': string;
  'kn-IN': string;
  'hi-IN': string;
}

export interface WebSocketEvent {
  event_id: string;
  clinic_id: string;
  timestamp: string;
  event_type: 'TOKEN_CALLED' | 'TOKEN_CHECKED_IN' | 'ANESTHESIA_HOLD_STARTED' | 'STERILIZATION_STARTED' | 'STERILIZATION_COMPLETED' | 'CROWD_ALERT';
  payload: any;
}
