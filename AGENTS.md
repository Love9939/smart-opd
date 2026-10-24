SmartOPD & DentalFlow: Agent-Executable System Specification & High-Level Design (Next.js + Rust)

1. System Context & Agent Execution Directives

This document is an autonomous coding agent specification and High-Level Design (HLD) for SmartOPD & DentalFlow, a unified multi-tenant SaaS platform engineered for General Physician Outpatient Departments (OPDs) and Dental Practices.

1.1 Architectural Mandate

⚬ Frontend Stack: Next.js App Router (TypeScript, Tailwind CSS, TanStack Query, Zustand, IndexedDB via Dexie.js for offline resilience, WebSockets for live state sync, Web Speech API for Waiting Room TV voice announcements).

⚬ Backend Stack: Rust with Axum, Tokio (mpsc actor per active clinic session/chair, broadcast hub for sub-5ms WebSocket fanout), SQLx (compile-time checked PostgreSQL queries), Tower middleware (tenant isolation, JWT verification, rate limiting), and ts-rs (automatic Rust-to-TypeScript type generation).

⚬ Primary Database: PostgreSQL 16 with row-level locking (SELECT ... FOR UPDATE SKIP LOCKED) and append-only financial/token audit logs (token_audit_events).

⚬ Regulatory & Ecosystem Alignment: Built for Ayushman Bharat Digital Mission (ABDM) Scan & Share (M1) compliance and Indian Digital Personal Data Protection (DPDP) Act 2023 consent auditing (Cliniqwise ABDM Guide).

1.2 Monorepo Directory Structure

When scaffolding this project, coding agents must create the following workspace layout:

[text]
smartopd-dentalflow/
├── Cargo.toml                     # Rust Workspace Root
├── crates/
│   ├── api-server/                # Axum HTTP + WebSocket Entrypoint
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── routes/            # REST & WS handlers (queue, dental, billing, abdm)
│   │   │   ├── middleware/        # JWT Auth, RBAC, Tenant Guard
│   │   │   └── ws_hub.rs          # tokio::sync::broadcast fanout per clinic_id
│   ├── core-engine/               # Deterministic State Machines & Actors
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── physician_actor.rs # WRR Queue, Grace Buffer, EMA Wait Calculator
│   │   │   ├── dental_actor.rs    # Multi-Chair Matrix, Anesthesia Swap, Sterilization Lock
│   │   │   ├── seat_allocator.rs  # Waiting Room Physical Seat Graph Allocator
│   │   │   └── fee_policy.rs      # Follow-up window & Multi-sitting installment rules
│   ├── db-schema/                 # SQLx Migrations, Models & Audit Triggers
│   │   ├── migrations/
│   │   └── src/models.rs          # Annotated with #[derive(TS)] for Next.js export
│   └── integrations/              # WhatsApp Cloud API, Razorpay Webhooks, S3, ABDM FHIR
├── apps/
│   └── web-client/                # Next.js App Router Monolithic Frontend
│       ├── app/
│       │   ├── (patient)/q/[clinic_slug]/page.tsx       # Zero-App Patient QR Check-in & Live Tracker
│       │   ├── (reception)/desk/[clinic_id]/page.tsx    # Keyboard-first Receptionist POS & Seat Map
│       │   ├── (doctor)/mobile/[session_id]/page.tsx    # 1-Thumb Doctor/Dentist Mobile App (PWA)
│       │   └── (tv)/tv/[clinic_id]/page.tsx             # Waiting Room Smart TV + Multi-Lingual TTS
│       ├── components/
│       │   ├── odontogram/FdiToothChart.tsx             # Interactive 32-Tooth SVG Adult/Pediatric Chart
│       │   ├── seat-grid/WaitingRoomSeatGrid.tsx        # Real-time physical seat occupancy grid
│       │   └── cam-rx/PrescriptionCameraScanner.tsx     # Auto-crop high-contrast Rx image scanner
│       └── lib/
│           ├── offline-outbox.ts                        # IndexedDB offline mutation queue
│           └── ws-client.ts                             # Reconnecting WebSocket state synchronizer


2. Deep-Dive Domain Research: General Physician OPD vs. Dental Practice

General Physicians and Dentists operate under radically different clinical physics. Trying to force a Dentist into a simple sequential token queue fails because dental procedures block specific hardware (operatory chairs, X-ray rooms) for 30 to 90 minutes and involve multi-sitting treatment plans and external prosthodontic labs (Denzee Dental Software, SmartDentalDesk). Conversely, forcing a General Physician who sees 90 fever/diabetes patients a day into a rigid 15-minute calendar grid fails because consultations take 3 to 6 minutes and walk-ins dominate (Cliniqwise OPD).

Operational Dimension	General Physician (GP / Specialist OPD)	Dental Clinic (Solo & Multi-Chair Operatory)	Unified SmartOPD + DentalFlow Engine Design
Daily Patient Volume	50 to 120 patients per doctor per day	8 to 25 patients per dental chair per day	Dynamic mode switch per doctor profile (OPD_VELOCITY_MODE vs. OPERATORY_CHAIR_MODE)
Primary Resource Bottleneck	Doctor's single consultation cabin & Waiting Room Physical Chairs	Dental Operatory Chairs (Chair 1, Chair 2), Portable/Room X-Ray, and Autoclave Sterilization	Dual-Resource Graph: Allocates Waiting Room Seats (A-01..P-04) AND Clinical Operatory Chairs (CHAIR-1..CHAIR-N)
Intra-Visit Waiting Pause	Blood test, ECG, Nebulization, or Eye Dilation pause (20–40 mins)	Local Anesthesia (LA) Numbing Latency (15–20 mins) or Intraoral Periapical (IOPA) X-ray shoot	ANESTHESIA_HOLD & AWAITING_LAB states that free the active doctor/chair to serve an interleaved short procedure
Sanitization / Turnover Buffer	0–15 seconds between patients	8–12 minutes mandatory chair disinfection & instrument pouch changeover after extractions/surgeries	Automatic STERILIZATION_LOCK state on the Dental Chair upon completing surgical/aerosol procedures
Clinical Documentation (Zero-Typing)	1-Tap CamRx (photo of paper prescription) + Vitals (BP, SpO2, Temp, RBS, Weight)	3-Tap SVG FDI Odontogram (Tooth #11–#48, #51–#85), IOPA X-Ray photo attach, & Consent e-Signature	Shared media capture pipeline + modular clinical card (VitalsCard vs. OdontogramCard)
Billing & Revenue Model	Single-visit fee (₹500) with configurable free follow-up window (e.g., 5 days)	Multi-Sitting Procedure Ledger (e.g., RCT + Zirconia Crown = ₹12,000 split across 3 sittings)	Unified billing_ledgers supporting both instant single-visit settlement and milestone installment plans
External Dependency Blocker	Pathology lab report arrival	Prosthodontic Dental Lab Parcel (Crowns, Bridges, Aligners, Dentures sent to external lab)	Hard Lab-Gate Check: System blocks confirming a "Crown Cementation" appointment unless reception marks the lab case RECEIVED_VERIFIED

3. Exhaustive Edge-Case Matrix (Physician + Dental)

3.1 Shared Clinic & Front-Desk Edge Cases

1. Simultaneous Walk-In and Online Booking Race Condition:

	⚬ Failure Mode: A patient books online via WhatsApp at the exact millisecond the receptionist assigns the last slot or waiting seat to a walk-in.

	⚬ Engine Solution: Every active doctor session runs as a single-threaded Tokio Actor (CabinSessionActor). All HTTP/WebSocket requests send command messages (SessionCommand) over a bounded mpsc::channel(256) and persist inside a serializable PostgreSQL transaction with SELECT ... FOR UPDATE SKIP LOCKED.

2. Physical Waiting Room Seat Overflow & Priority Reallocation:

	⚬ Failure Mode: Waiting lobby has 16 physical seats; 22 people arrive with family attendants, forcing a pregnant woman or 75-year-old cardiac patient to stand.

	⚬ Engine Solution: Physical seats are modeled as a directed state graph (PRIORITY_ELDERLY_PREGNANT, WHEELCHAIR, ISOLATION_FEVER, STANDARD). When lobby occupancy exceeds 80%, the Waiting Room TV and WhatsApp tracker automatically trigger a "Peak Crowd Mode: Kindly limit to 1 attendant per patient" announcement. Priority flags on check-in (age >= 65 or pregnant = true) auto-allocate P-series priority seats.

3. Pre-Booked Patient Arrives 30 Minutes Late:

	⚬ Failure Mode: Punctual walk-ins get angry if a late online booker cuts directly to the front, while the online booker gets angry if their appointment is canceled.

	⚬ Engine Solution: Online booking issues a Reservation ID (status = BOOKED), not a live sequence position. Physical QR scan or receptionist check-in converts it to CHECKED_IN. If now() > slot_time + 15 mins, the patient is placed into the LATE_GRACE sub-queue and interleaved at current_active_token + 2 so the person next in line is never bumped.

4. Receptionist Cash Pilferage ("Shadow Consultations"):

	⚬ Failure Mode: Receptionist accepts ₹500 cash from a walk-in, waves them into the cabin verbally, and deletes or never enters the record.

	⚬ Engine Solution: (a) The doctor's mobile screen displays the active IN_CABIN patient banner; the doctor never consults a patient without tapping Call Next. (b) Every token status or fee modification writes to an immutable PostgreSQL table (token_audit_events) protected by a BEFORE DELETE OR UPDATE database trigger that rejects tampering. Any fee waiver or cancellation after CHECKED_IN sends a high-priority push alert to the doctor's phone.

5. Clinic Wi-Fi Drop or Power Cut:

	⚬ Failure Mode: Broadband router restarts or power goes out for 40 minutes during peak evening OPD.

	⚬ Engine Solution: The Next.js Receptionist and Doctor apps cache the full day's roster and odontogram/patient state in IndexedDB. Offline actions append to a local mutation_outbox with monotonic Lamport clocks (client_seq_id) and print tokens via Web Bluetooth (navigator.bluetooth) to a 58mm battery-backed thermal printer.

3.2 Dental-Specific Edge Cases (Deep Dive)

1. The "Anesthesia Numbing Dead-Time" Chair Swap:

	⚬ Scenario: A dentist administers an Inferior Alveolar Nerve Block (local anesthesia) to Patient A for a lower molar Root Canal (#36). The patient takes 15–20 minutes for complete pulpal anesthesia.

	⚬ Engine Solution: The dentist taps Start Anesthesia Hold (15m) on their mobile app. Patient A transitions to ANESTHESIA_HOLD (either remaining in Chair 1 while the dentist switches to Chair 2, or moving to a dedicated Numbing Lounge Chair N-01). The Rust scheduler immediately pulls in a short 10-minute procedure (e.g., suture removal, crown trial, or quick consultation) and starts a live 15-minute countdown timer on the dentist's phone that chimes when Patient A is numb and ready.

2. Emergency Toothache / Avulsed Tooth Walk-In vs. Scheduled 60-Min RCT:

	⚬ Scenario: Dentist is mid-way through a 60-minute elective cosmetic veneer prep when a child walks in with an acute dental trauma or severe pulpitis pain.

	⚬ Engine Solution: Reception logs an EMERGENCY_PAIN token. The doctor's mobile app displays a discreet Emergency Triage Overlay. The dentist taps Insert 10-Min Pain Relief Slot (to administer local anesthesia or open drainage on the spare chair during the current patient's impression setting time), automatically shifting downstream appointments by +12 minutes and notifying those patients on WhatsApp.

3. Prosthodontic Lab Dependency Failure (The Missing Crown Disaster):

	⚬ Scenario: Patient takes half a day off work and arrives for their 5:00 PM Zirconia Crown Cementation appointment, only for the dentist to discover the courier from the dental lab hasn't delivered the crown yet.

	⚬ Engine Solution: Any appointment tagged with requires_lab_work = true is linked to a dental_lab_orders record (DISPATCHED -> IN_TRANSIT -> RECEIVED_AT_CLINIC -> QC_APPROVED). If a lab order is not marked QC_APPROVED by 4 hours prior to the appointment, the Rust cron worker alerts the receptionist and blocks sending the "Come to Clinic" WhatsApp confirmation until verified, offering a 1-click reschedule link if the lab is delayed.

4. Chair Overrun & Sterilization Buffer Enforcement:

	⚬ Scenario: A simple extraction turns into a complex surgical disimpaction requiring bone guttering, running 25 minutes over schedule and requiring 12 minutes of aerosol sanitization and autoclave turnover.

	⚬ Engine Solution: Dentist taps +20m Surgical Extension on the mobile app. Furthermore, because the procedure code is tagged biohazard_level = HIGH_AEROSOL, completing the visit automatically puts Chair 1 into STERILIZATION_LOCK for 10 minutes. The Waiting Room TV shows "Operatory Chair 1: UV & Autoclave Sterilization in Progress (8 mins remaining)"—turning a frustrating delay into visible proof of clinical hygiene.

5. Multi-Sitting Treatment Plan & Split-Payment Tracking:

	⚬ Scenario: A 3-sitting RCT + Crown costs ₹11,000. Patient pays ₹3,500 on Sitting 1, ₹2,000 on Sitting 2, and forgets how much balance is due on Sitting 3, leading to awkward front-desk disputes.

	⚬ Engine Solution: The treatment_plans table tracks total estimated fee, per-sitting procedure milestones (Access Opening -> Biomechanical Prep -> Obturation -> Crown Prep -> Cementation), and exact running balance (total_fee - sum(paid_installments)), auto-sending an itemized WhatsApp digital receipt after every sitting.

6. Pediatric / Anxious Patient Pre-Medication Hold:

	⚬ Scenario: An anxious pediatric patient requires oral sedation or topical numbing gel for 25 minutes before entering the dental chair.

	⚬ Engine Solution: Dedicated PRE_MED_WAITING status with a countdown timer tracked on both the Reception Console and Dentist Mobile App.

4. Complete PostgreSQL 16 Database Schema (migrations/001_unified_schema.sql)

[sql]
-- Enable UUID and cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE clinic_specialty AS ENUM ('GENERAL_PHYSICIAN', 'DENTAL', 'POLYCLINIC_HYBRID');
CREATE TYPE token_category AS ENUM (
    'REGULAR',
    'EMERGENCY',
    'LAB_RETURN',        -- GP blood test/ECG return or Dental X-Ray return
    'ANESTHESIA_HOLD',   -- Dental 15-min numbing wait
    'LATE_GRACE',        -- Arrived >15m past booked slot
    'CROSS_REFERRAL',    -- Internal polyclinic doctor transfer
    'MR_VENDOR'          -- Pharma / Dental supply representative
);
CREATE TYPE token_status AS ENUM (
    'BOOKED',
    'BLOCKED_LAB_PENDING', -- Dental crown/aligner not yet received from external lab
    'CHECKED_IN',
    'CALLED',
    'IN_CABIN',
    'ANESTHESIA_WAIT',
    'AWAITING_DIAGNOSTIC',
    'COMPLETED',
    'SKIPPED',
    'CANCELLED'
);
CREATE TYPE waiting_seat_type AS ENUM ('STANDARD', 'PRIORITY_ELDERLY_PREGNANT', 'WHEELCHAIR', 'ISOLATION_FEVER', 'NUMBING_LOUNGE');
CREATE TYPE operatory_chair_state AS ENUM ('AVAILABLE', 'OCCUPIED', 'ANESTHESIA_HOLD', 'STERILIZATION_LOCK', 'MAINTENANCE');
CREATE TYPE lab_order_status AS ENUM ('IMPRESSION_TAKEN', 'SENT_TO_LAB', 'IN_TRANSIT', 'RECEIVED_AT_CLINIC', 'QC_VERIFIED', 'FITTED');

CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    specialty clinic_specialty NOT NULL DEFAULT 'POLYCLINIC_HYBRID',
    abha_hfr_id TEXT,
    config JSONB NOT NULL DEFAULT '{
        "free_followup_days": 5,
        "gp_lab_interleave_ratio": 2,
        "late_grace_offset": 2,
        "max_lobby_occupancy_pct": 80,
        "default_sterilization_mins": 10
    }',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waiting Room Physical Chairs (Lobby Seat Allocation)
CREATE TABLE waiting_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    seat_code VARCHAR(12) NOT NULL,   -- e.g., 'A-01', 'P-01', 'N-01'
    zone_name VARCHAR(32) NOT NULL,   -- e.g., 'Main Lobby', 'Priority Zone', 'Numbing Lounge'
    seat_type waiting_seat_type NOT NULL DEFAULT 'STANDARD',
    occupied_by_token UUID,
    UNIQUE(clinic_id, seat_code)
);

-- Dental Operatory Chairs & GP Consultation Cabins
CREATE TABLE clinical_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    resource_code VARCHAR(16) NOT NULL, -- e.g., 'CABIN-1', 'DENTAL-CHAIR-1', 'DENTAL-CHAIR-2'
    resource_type VARCHAR(16) NOT NULL, -- 'GP_CABIN' or 'DENTAL_CHAIR'
    assigned_doctor_id UUID,
    state operatory_chair_state NOT NULL DEFAULT 'AVAILABLE',
    sterilization_unlocks_at TIMESTAMPTZ,
    active_token_id UUID,
    UNIQUE(clinic_id, resource_code)
);

-- Household-Indexed Patient Profiles (Multiple family members can share 1 phone number)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    household_phone VARCHAR(15) NOT NULL,
    full_name TEXT NOT NULL,
    age SMALLINT NOT NULL,
    gender VARCHAR(16) NOT NULL,
    abha_address TEXT,
    priority_flags TEXT[] DEFAULT '{}', -- {'ELDERLY', 'PREGNANT', 'WHEELCHAIR', 'ANXIOUS_PEDIATRIC'}
    medical_alerts TEXT[] DEFAULT '{}', -- {'DIABETIC', 'HYPERTENSIVE', 'PENICILLIN_ALLERGY', 'BLOOD_THINNERS'}
    dpdp_consent_signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patients_phone ON patients(clinic_id, household_phone);

-- Dental Multi-Sitting Treatment Plans & Installment Ledgers
CREATE TABLE dental_treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    procedure_name TEXT NOT NULL,       -- e.g., 'Molar RCT + Zirconia Crown'
    fdi_tooth_numbers SMALLINT[] NOT NULL, -- e.g., '{36}' or '{11, 21}'
    total_estimated_inr INT NOT NULL,
    total_paid_inr INT NOT NULL DEFAULT 0,
    total_sittings_planned SMALLINT NOT NULL DEFAULT 1,
    sittings_completed SMALLINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- External Dental Prosthodontic Lab Tracker (Crowns, Bridges, Aligners)
CREATE TABLE dental_lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    treatment_plan_id UUID NOT NULL REFERENCES dental_treatment_plans(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    lab_vendor_name TEXT NOT NULL,
    prosthesis_type TEXT NOT NULL,      -- e.g., 'Monolithic Zirconia Crown - Shade A2'
    fdi_teeth SMALLINT[] NOT NULL,
    status lab_order_status NOT NULL DEFAULT 'IMPRESSION_TAKEN',
    expected_delivery_at TIMESTAMPTZ NOT NULL,
    received_verified_at TIMESTAMPTZ,
    verified_by_staff_id UUID
);

-- FDI Odontogram Tooth State Snapshot per Patient
CREATE TABLE dental_odontogram_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fdi_tooth SMALLINT NOT NULL CHECK (fdi_tooth BETWEEN 11 AND 85),
    surfaces TEXT[] DEFAULT '{}',       -- {'M', 'O', 'D', 'B', 'L'}
    condition_code VARCHAR(32) NOT NULL,-- 'DEEP_CARIES', 'PULPITIS', 'MISSING', 'RCT_TREATED', 'CROWN_PRESENT'
    notes TEXT,
    iopa_xray_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(patient_id, fdi_tooth)
);

-- Active Daily OPD / Operatory Sessions
CREATE TABLE opd_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_name VARCHAR(16) NOT NULL,    -- 'MORNING', 'EVENING'
    ema_consult_secs INT NOT NULL DEFAULT 360,
    regular_since_last_lab SMALLINT NOT NULL DEFAULT 0,
    cascade_delay_mins SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Unified Queue & Operatory Appointment Tokens
CREATE TABLE queue_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES opd_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    treatment_plan_id UUID REFERENCES dental_treatment_plans(id),
    lab_order_id UUID REFERENCES dental_lab_orders(id),
    family_cluster_id UUID,             -- Groups family members arriving together (#14A, #14B)
    token_display VARCHAR(12) NOT NULL, -- 'A-14', 'D-04', 'E-01'
    category token_category NOT NULL DEFAULT 'REGULAR',
    status token_status NOT NULL DEFAULT 'BOOKED',
    waiting_seat_id UUID REFERENCES waiting_seats(id) ON DELETE SET NULL,
    clinical_resource_id UUID REFERENCES clinical_resources(id) ON DELETE SET NULL,
    planned_duration_mins SMALLINT NOT NULL DEFAULT 6, -- 6m for GP, 15/30/45/60m for Dental
    requires_sterilization_lock BOOLEAN NOT NULL DEFAULT FALSE,
    anesthesia_ready_at TIMESTAMPTZ,
    chief_complaint TEXT,
    vitals JSONB DEFAULT '{}',
    rx_image_url TEXT,
    fee_charged_inr INT NOT NULL DEFAULT 500,
    amount_paid_inr INT NOT NULL DEFAULT 0,
    payment_method VARCHAR(16) DEFAULT 'PENDING', -- 'CASH', 'UPI', 'FREE_FOLLOWUP'
    booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Immutable Audit Ledger (Blocks Receptionist Cash Pilferage)
CREATE TABLE token_audit_events (
    id BIGSERIAL PRIMARY KEY,
    clinic_id UUID NOT NULL,
    token_id UUID NOT NULL REFERENCES queue_tokens(id),
    actor_id UUID NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action_type VARCHAR(32) NOT NULL, -- 'STATUS_CHANGE', 'FEE_MODIFIED', 'EMERGENCY_INSERT', 'LAB_OVERRIDE'
    old_payload JSONB,
    new_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Database Trigger: Prevent UPDATE or DELETE on token_audit_events
CREATE OR REPLACE FUNCTION prevent_audit_tampering() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'token_audit_events is an append-only immutable ledger and cannot be altered or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_token_audit
BEFORE UPDATE OR DELETE ON token_audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();


5. Rust Core Engine Implementation (crates/core-engine/src/lib.rs)

Coding agents should implement the following deterministic state machine supporting both General Physician WRR Interleaving and Dental Multi-Chair Anesthesia Swap & Sterilization Locking:

[rust]
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TokenCategory {
    Emergency,
    AnesthesiaReady, // Dental patient whose 15-min LA numbing timer has completed
    LabReturn,       // GP diagnostic return or Dental X-Ray return
    LateGrace,
    Regular,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WaitingSeatType {
    PriorityElderlyPregnant,
    Wheelchair,
    IsolationFever,
    NumbingLounge,
    Standard,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChairState {
    Available,
    Occupied { token_id: Uuid },
    AnesthesiaHold { token_id: Uuid, ready_at: DateTime<Utc> },
    SterilizationLock { unlocks_at: DateTime<Utc> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatoryChair {
    pub chair_id: Uuid,
    pub chair_code: String,
    pub state: ChairState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WaitingSeat {
    pub seat_id: Uuid,
    pub seat_code: String,
    pub seat_type: WaitingSeatType,
    pub occupied_by_token: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueToken {
    pub token_id: Uuid,
    pub token_display: String,
    pub patient_name: String,
    pub category: TokenCategory,
    pub required_seat_type: WaitingSeatType,
    pub assigned_waiting_seat: Option<String>,
    pub assigned_chair_code: Option<String>,
    pub planned_duration_secs: u32,
    pub requires_sterilization: bool,
    pub lab_qc_verified: bool, // Must be true if appointment requires dental lab crown/bridge
    pub estimated_wait_secs: u32,
}

pub struct UnifiedClinicActor {
    pub session_id: Uuid,
    pub ema_gp_consult_secs: f64,
    pub regular_since_last_lab: u8,
    pub lab_interleave_ratio: u8,
    pub sterilization_duration_mins: i64,
    pub waiting_seats: Vec<WaitingSeat>,
    pub operatory_chairs: Vec<OperatoryChair>,
    pub emergency_q: VecDeque<QueueToken>,
    pub anesthesia_ready_q: VecDeque<QueueToken>,
    pub lab_return_q: VecDeque<QueueToken>,
    pub grace_q: VecDeque<QueueToken>,
    pub regular_q: VecDeque<QueueToken>,
}

impl UnifiedClinicActor {
    /// Checks in a patient, verifies external dental lab readiness, and allocates a physical waiting seat
    pub fn check_in_patient(&mut self, mut token: QueueToken) -> Result<QueueToken, String> {
        if !token.lab_qc_verified {
            return Err(format!(
                "Cannot check in {}: External Dental Lab prosthesis is not marked QC_VERIFIED.",
                token.token_display
            ));
        }

        // Allocate physical waiting room seat with fallback to Standard
        let seat_idx = self
            .waiting_seats
            .iter()
            .position(|s| s.occupied_by_token.is_none() && s.seat_type == token.required_seat_type)
            .or_else(|| {
                self.waiting_seats
                    .iter()
                    .position(|s| s.occupied_by_token.is_none() && s.seat_type == WaitingSeatType::Standard)
            });

        if let Some(idx) = seat_idx {
            self.waiting_seats[idx].occupied_by_token = Some(token.token_id);
            token.assigned_waiting_seat = Some(self.waiting_seats[idx].seat_code.clone());
        }

        match token.category {
            TokenCategory::Emergency => self.emergency_q.push_back(token.clone()),
            TokenCategory::AnesthesiaReady => self.anesthesia_ready_q.push_back(token.clone()),
            TokenCategory::LabReturn => self.lab_return_q.push_back(token.clone()),
            TokenCategory::LateGrace => self.grace_q.push_back(token.clone()),
            TokenCategory::Regular => self.regular_q.push_back(token.clone()),
        }

        self.recompute_ewt();
        Ok(token)
    }

    /// Dental Workflow: Places current patient on a 15-min Local Anesthesia (LA) Numbing Hold
    /// Moves them to a Numbing Lounge seat (or keeps them in Chair 1 while Dentist moves to Chair 2)
    pub fn start_dental_anesthesia_hold(
        &mut self,
        chair_id: Uuid,
        mut token: QueueToken,
        numbing_mins: i64,
        move_to_numbing_lounge: bool,
        now: DateTime<Utc>,
    ) -> QueueToken {
        let ready_at = now + Duration::minutes(numbing_mins);

        if let Some(chair) = self.operatory_chairs.iter_mut().find(|c| c.chair_id == chair_id) {
            if move_to_numbing_lounge {
                chair.state = ChairState::Available;
                // Assign Numbing Lounge Seat
                if let Some(lounge_seat) = self
                    .waiting_seats
                    .iter_mut()
                    .find(|s| s.occupied_by_token.is_none() && s.seat_type == WaitingSeatType::NumbingLounge)
                {
                    lounge_seat.occupied_by_token = Some(token.token_id);
                    token.assigned_waiting_seat = Some(lounge_seat.seat_code.clone());
                }
            } else {
                chair.state = ChairState::AnesthesiaHold {
                    token_id: token.token_id,
                    ready_at,
                };
            }
        }

        token.category = TokenCategory::AnesthesiaReady;
        self.anesthesia_ready_q.push_back(token.clone());
        self.recompute_ewt();
        token
    }

    /// Completes consultation on a specific cabin/chair and triggers Sterilization Lock if required
    pub fn complete_consultation(
        &mut self,
        chair_id: Uuid,
        actual_duration_secs: u32,
        requires_sterilization: bool,
        now: DateTime<Utc>,
    ) {
        let clamped = (actual_duration_secs as f64).clamp(60.0, 5400.0);
        self.ema_gp_consult_secs = (0.25 * clamped) + (0.75 * self.ema_gp_consult_secs);

        if let Some(chair) = self.operatory_chairs.iter_mut().find(|c| c.chair_id == chair_id) {
            if requires_sterilization {
                chair.state = ChairState::SterilizationLock {
                    unlocks_at: now + Duration::minutes(self.sterilization_duration_mins),
                };
            } else {
                chair.state = ChairState::Available;
            }
        }
        self.recompute_ewt();
    }

    /// Calls the next optimal patient into an available Cabin or Dental Operatory Chair
    pub fn call_next_for_chair(&mut self, target_chair_id: Uuid, now: DateTime<Utc>) -> Result<QueueToken, String> {
        // First auto-unlock any chairs whose sterilization timer has expired
        for c in &mut self.operatory_chairs {
            if let ChairState::SterilizationLock { unlocks_at } = c.state {
                if now >= unlocks_at {
                    c.state = ChairState::Available;
                }
            }
        }

        let chair_idx = self
            .operatory_chairs
            .iter()
            .position(|c| c.chair_id == target_chair_id)
            .ok_or("Target clinical chair/cabin not found")?;

        if self.operatory_chairs[chair_idx].state != ChairState::Available {
            return Err("Target chair is currently Occupied or in Sterilization Lock".to_string());
        }

        // Priority Order: 1. Emergency -> 2. Numb Dental Patient -> 3. WRR Lab Return -> 4. Grace -> 5. Regular
        let next = if let Some(t) = self.emergency_q.pop_front() {
            Some(t)
        } else if let Some(t) = self.anesthesia_ready_q.pop_front() {
            Some(t)
        } else if self.regular_since_last_lab >= self.lab_interleave_ratio && !self.lab_return_q.is_empty() {
            self.regular_since_last_lab = 0;
            self.lab_return_q.pop_front()
        } else if let Some(t) = self.grace_q.pop_front() {
            self.regular_since_last_lab += 1;
            Some(t)
        } else if let Some(t) = self.regular_q.pop_front() {
            self.regular_since_last_lab += 1;
            Some(t)
        } else {
            self.lab_return_q.pop_front()
        };

        let mut called_token = next.ok_or("No waiting patients in any queue")?;

        // Free physical waiting room seat
        for seat in &mut self.waiting_seats {
            if seat.occupied_by_token == Some(called_token.token_id) {
                seat.occupied_by_token = None;
            }
        }

        called_token.assigned_waiting_seat = None;
        called_token.assigned_chair_code = Some(self.operatory_chairs[chair_idx].chair_code.clone());
        self.operatory_chairs[chair_idx].state = ChairState::Occupied {
            token_id: called_token.token_id,
        };

        self.recompute_ewt();
        Ok(called_token)
    }

    /// Recomputes live Estimated Wait Time (EWT) factoring in multi-chair parallelism and procedure durations
    pub fn recompute_ewt(&mut self) {
        let active_chairs = self.operatory_chairs.len().max(1) as u32;
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
                cumulative_secs += effective_dur / active_chairs;
                token.estimated_wait_secs = cumulative_secs;
            }
        }
    }
}


6. REST API & Real-Time WebSocket Contract

6.1 Core Axum REST Endpoints

⚬ POST /api/v1/sessions/:session_id/tokens: Create booking or walk-in token (validates family cluster, follow-up fee eligibility, and dental lab order gate).

⚬ POST /api/v1/sessions/:session_id/tokens/:token_id/check-in: Marks arrival, allocates physical waiting seat (A-01, P-01), and inserts into active actor queue.

⚬ POST /api/v1/sessions/:session_id/chairs/:chair_id/call-next: Invokes UnifiedClinicActor::call_next_for_chair, updates PostgreSQL, and broadcasts TOKEN_CALLED event over WebSockets.

⚬ POST /api/v1/sessions/:session_id/chairs/:chair_id/anesthesia-hold: Places active dental patient into ANESTHESIA_WAIT for $N$ minutes and frees the dentist to call the next short-procedure patient.

⚬ POST /api/v1/patients/:patient_id/odontogram: Upserts FDI tooth condition (#11–#85), surface tags (M,O,D,B,L), and links IOPA X-Ray S3 URL.

⚬ POST /api/v1/sessions/:session_id/cascade-delay: Shifts session EWT by $+\Delta$ minutes and triggers WhatsApp Cloud API template notifications.

6.2 Real-Time WebSocket Event Envelope (/ws/clinic/:clinic_id)

All connected clients (Doctor Mobile App, Receptionist Console, Waiting Room Smart TV, and Patient Live Tracker) subscribe to a topic-filtered WebSocket stream emitting this exact JSON discriminated union:

[json]
{
  "event_id": "0192b8d4-7c90-7000-8a12-4b5e6f7a8b9c",
  "clinic_id": "8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f",
  "timestamp": "2026-10-24T10:42:15Z",
  "event_type": "TOKEN_CALLED",
  "payload": {
    "token_display": "D-07",
    "patient_first_name": "Ramesh K.",
    "assigned_chair_code": "DENTAL-CHAIR-2",
    "previous_waiting_seat": "P-02",
    "tts_announcements": {
      "en-IN": "Token D zero seven, Ramesh K, please proceed to Dental Chair Two.",
      "kn-IN": "ಟೋಕನ್ ಡಿ ಸೊನ್ನೆ ಏಳು, ದಯವಿಟ್ಟು ಎರಡನೇ ಕೊಠಡಿಗೆ ಬನ್ನಿ.",
      "hi-IN": "टोकन डी शून्य सात, कृपया डेंटल चेयर दो में जाएं।"
    },
    "chair_states": [
      { "chair_code": "DENTAL-CHAIR-1", "state": "STERILIZATION_LOCK", "unlocks_in_secs": 420 },
      { "chair_code": "DENTAL-CHAIR-2", "state": "OCCUPIED", "active_token": "D-07" }
    ]
  }
}


7. Next.js Frontend Component Specifications for Coding Agents

7.1 Interactive 3-Tap FDI Odontogram (components/odontogram/FdiToothChart.tsx)

⚬ Renders an SVG dental arch displaying Adult Permanent Teeth (Quadrants 1–4: #11–#18, #21–#28, #31–#38, #41–#48) with a toggle switch for Pediatric Deciduous Teeth (Quadrants 5–8: #51–#55, #61–#65, #71–#75, #81–#85).

⚬ 3-Tap Speed Contract:

    1. Tap 1: Select tooth (or swipe across multiple teeth for bridges/scaling).

    2. Tap 2: Select pathology/status badge (Caries, Pulpitis, Root Stump, Missing, Crown).

    3. Tap 3: Select treatment action (RCT, Composite Filling, Extraction, Zirconia Crown, Implant) -> Auto-populates estimated cost into dental_treatment_plans and attaches optional camera X-ray photo.

7.2 Waiting Room Smart TV Display (app/(tv)/tv/[clinic_id]/page.tsx)

⚬ Designed for 32-inch to 55-inch Android TVs running at 1920x1080:

	⚬ Left 60% Panel: Active Cabins / Dental Operatory Chairs showing currently served tokens (IN_CABIN), chairs undergoing UV & Autoclave Sterilization (with live countdown bar), and patients in Anesthesia Numbing Hold.

	⚬ Right 40% Panel: Next 6 waiting tokens with their assigned Physical Waiting Seat Code (Seat A-04, Priority Seat P-01) and live Estimated Wait Time.

	⚬ Bottom Ticker: Clinic hygiene credentials, Wi-Fi/QR check-in code, and peak-crowd attendant policy notice.
