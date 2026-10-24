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

CREATE TABLE IF NOT EXISTS clinics (
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
CREATE TABLE IF NOT EXISTS waiting_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    seat_code VARCHAR(12) NOT NULL,   -- e.g., 'A-01', 'P-01', 'N-01'
    zone_name VARCHAR(32) NOT NULL,   -- e.g., 'Main Lobby', 'Priority Zone', 'Numbing Lounge'
    seat_type waiting_seat_type NOT NULL DEFAULT 'STANDARD',
    occupied_by_token UUID,
    UNIQUE(clinic_id, seat_code)
);

-- Dental Operatory Chairs & GP Consultation Cabins
CREATE TABLE IF NOT EXISTS clinical_resources (
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
CREATE TABLE IF NOT EXISTS patients (
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
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(clinic_id, household_phone);

-- Dental Multi-Sitting Treatment Plans & Installment Ledgers
CREATE TABLE IF NOT EXISTS dental_treatment_plans (
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
CREATE TABLE IF NOT EXISTS dental_lab_orders (
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
CREATE TABLE IF NOT EXISTS dental_odontogram_records (
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
CREATE TABLE IF NOT EXISTS opd_sessions (
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
CREATE TABLE IF NOT EXISTS queue_tokens (
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
CREATE TABLE IF NOT EXISTS token_audit_events (
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

DROP TRIGGER IF EXISTS trg_immutable_token_audit ON token_audit_events;
CREATE TRIGGER trg_immutable_token_audit
BEFORE UPDATE OR DELETE ON token_audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
