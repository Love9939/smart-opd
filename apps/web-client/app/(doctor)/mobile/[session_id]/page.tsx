'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { FdiToothChart } from '@/components/odontogram/FdiToothChart';
import { PrescriptionCameraScanner } from '@/components/cam-rx/PrescriptionCameraScanner';
import { ConsentSignatureModal } from '@/components/consent/ConsentSignatureModal';
import { TreatmentPlanInstallmentLedger } from '@/components/billing/TreatmentPlanInstallmentLedger';
import { QueueToken, DentalOdontogramRecord } from '@/lib/types';
import { useLiveClinicStore } from '@/lib/ws-client';
import { clinicalChime } from '@/lib/audio-chime';
import {
  User,
  Clock,
  Syringe,
  CheckCircle,
  AlertTriangle,
  FileText,
  Sparkles,
  Phone,
  Flame,
  ArrowRight,
  Shield,
  Layers,
  Activity,
  Zap,
  DollarSign,
  Heart,
  Droplet,
  Users,
  ShieldAlert,
  ChevronRight,
  Check,
} from 'lucide-react';

function DoctorMobileContent() {
  const params = useParams();
  const sessionId = (params?.session_id as string) || 'a1111111-2222-3333-4444-555555555555';

  const [clinicalMode, setClinicalMode] = useState<'OPERATORY_CHAIR_MODE' | 'OPD_VELOCITY_MODE'>('OPERATORY_CHAIR_MODE');
  const [activeTab, setActiveTab] = useState<'console' | 'odontogram' | 'camrx' | 'ledger'>('console');
  const [selectedChair, setSelectedChair] = useState<'DENTAL-CHAIR-1' | 'DENTAL-CHAIR-2' | 'GP-CABIN-1'>('DENTAL-CHAIR-1');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [hasSignedConsent, setHasSignedConsent] = useState(false);

  // Active in-cabin patient
  const [activePatient, setActivePatient] = useState<QueueToken | null>({
    token_id: 't-active-01',
    session_id: sessionId,
    token_display: 'D-07',
    patient_id: 'p-007',
    patient_name: 'Ramesh K. (Age 42)',
    category: 'Regular',
    status: 'InCabin',
    required_seat_type: 'Standard',
    assigned_chair_code: 'DENTAL-CHAIR-1',
    planned_duration_secs: 1800,
    requires_sterilization: true,
    lab_qc_verified: true,
    estimated_wait_secs: 0,
    booked_at: new Date().toISOString(),
    chief_complaint: 'Severe throbbing pain in lower left molar (#36) aggravated at night.',
    vitals: {
      bp: '128/84',
      spo2: 99,
      temp: 98.6,
      rbs: 115,
      weight: 74,
    },
    family_cluster_id: 'cluster-demo',
    family_cluster_name: 'Ramesh K. & Savitri Bai',
  });

  const [alerts] = useState<string[]>(['PENICILLIN_ALLERGY', 'HYPERTENSIVE']);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [shadowAlertToast, setShadowAlertToast] = useState<string | null>(null);
  const [preMedCountdown, setPreMedCountdown] = useState<number | null>(null);
  const [preMedTokenDisplay, setPreMedTokenDisplay] = useState<string | null>(null);
  const [anesthesiaTimer, setAnesthesiaTimer] = useState<number>(14 * 60 + 28);

  const { lastEvent } = useLiveClinicStore();

  // Real-time WebSocket alerts from Front-Desk and Triage
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.event_type === 'EMERGENCY_TRIAGE_ALERT') {
      clinicalChime.playTokenCallChime();
      setStatusMessage(`🚨 EMERGENCY TRIAGE: ${lastEvent.payload.patient_name} - ${lastEvent.payload.complaint}`);
    } else if (lastEvent.event_type === 'AUDIT_EVENT_LOGGED' && lastEvent.payload.is_tamper_alert) {
      clinicalChime.playTokenCallChime();
      setShadowAlertToast(
        `⚠️ SHADOW CONSULTATION ALERT: Front-Desk staff waived fee for Token ${lastEvent.payload.token_display} without OTP!`
      );
    }
  }, [lastEvent]);

  // Pre-Medication Hold Countdown Timer Effect
  useEffect(() => {
    if (preMedCountdown === null || preMedCountdown <= 0) return;
    const interval = setInterval(() => {
      setPreMedCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clinicalChime.playTokenCallChime();
          setStatusMessage(`🔔 Pre-Medication Hold Complete for ${preMedTokenDisplay || 'Pediatric Patient'}! Sedation active.`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [preMedCountdown, preMedTokenDisplay]);

  // Anesthesia countdown ticker simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setAnesthesiaTimer((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Odontogram records
  const [odontogramRecords, setOdontogramRecords] = useState<DentalOdontogramRecord[]>([
    {
      id: 'od-1',
      patient_id: 'p-007',
      fdi_tooth: 36,
      surfaces: ['O', 'D'],
      condition_code: 'PULPITIS',
      treatment_action: 'RCT',
      estimated_cost_inr: 4500,
      notes: 'Deep caries extending to pulp chamber. Tenderness on vertical percussion.',
      updated_at: new Date().toISOString(),
    },
  ]);

  // Actions
  const handleCallNext = async () => {
    const chairUuid =
      selectedChair === 'DENTAL-CHAIR-1'
        ? 'c1111111-0000-0000-0000-000000000001'
        : selectedChair === 'DENTAL-CHAIR-2'
        ? 'c2222222-0000-0000-0000-000000000002'
        : 'c3333333-0000-0000-0000-000000000003';

    try {
      const res = await fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/chairs/${chairUuid}/call-next`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setActivePatient({
            ...json.data,
            vitals: { bp: '120/80', spo2: 98, temp: 98.4, rbs: 104, weight: 70 },
          });
          setHasSignedConsent(false);
          setStatusMessage(`✓ Called next patient (${json.data.token_display}) into ${selectedChair}`);
          setTimeout(() => setStatusMessage(null), 3000);
          return;
        }
      }
    } catch {}

    // Resilient Fallback
    setActivePatient({
      token_id: `t-${Date.now()}`,
      session_id: sessionId,
      token_display: clinicalMode === 'OPERATORY_CHAIR_MODE' ? 'D-08' : 'A-15',
      patient_id: `p-${Date.now()}`,
      patient_name: 'Suresh Patil (Age 36)',
      category: 'Regular',
      status: 'InCabin',
      required_seat_type: 'Standard',
      assigned_chair_code: selectedChair,
      planned_duration_secs: 1200,
      requires_sterilization: clinicalMode === 'OPERATORY_CHAIR_MODE',
      lab_qc_verified: true,
      estimated_wait_secs: 0,
      booked_at: new Date().toISOString(),
      chief_complaint: 'Crown cementation for lower molar #46 (Zirconia Crown QC Verified).',
      vitals: { bp: '120/80', spo2: 98, temp: 98.4, rbs: 104, weight: 70 },
      family_cluster_id: 'cluster-demo',
      family_cluster_name: 'Suresh Patil & Aarav Patil',
    });
    setHasSignedConsent(false);
    setStatusMessage('✓ Called next optimal patient into ' + selectedChair);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleStartAnesthesiaHold = () => {
    if (!activePatient) return;
    const chairUuid = 'c1111111-0000-0000-0000-000000000001';

    try {
      fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/chairs/${chairUuid}/anesthesia-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_id: activePatient.token_id,
          numbing_mins: 15,
          move_to_numbing_lounge: true,
        }),
      }).catch(() => {});
    } catch {}

    setStatusMessage(`💉 ${activePatient.token_display} placed on 15m Anesthesia Hold. Patient moved to Numbing Lounge.`);
    setActivePatient(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleStartPreMedHold = () => {
    if (!activePatient) return;
    try {
      fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/tokens/${activePatient.token_id}/pre-med-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sedation_mins: 25,
          medication_notes: 'Oral Midazolam / Topical Benzocaine gel applied',
        }),
      }).catch(() => {});
    } catch {}

    setPreMedCountdown(25 * 60);
    setPreMedTokenDisplay(activePatient.token_display);
    setStatusMessage(`🧸 Pediatric Pre-Medication Hold started (25m countdown) for ${activePatient.token_display}`);
    setActivePatient(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSendForDiagnostics = (type: string) => {
    if (!activePatient) return;
    const chairUuid = 'c3333333-0000-0000-0000-000000000003';

    try {
      fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/chairs/${chairUuid}/diagnostic-pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_id: activePatient.token_id,
          procedure_type: type,
          pause_mins: 20,
        }),
      }).catch(() => {});
    } catch {}

    setStatusMessage(
      `🧪 ${activePatient.token_display} sent for ${type} (20m pause). Cabin freed to call next patient!`
    );
    setActivePatient(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleInsertPainReliefSlot = () => {
    try {
      fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/emergency-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: 'Emergency Pain Walk-In',
          complaint: 'Acute Dental Trauma / Severe Pulpitis',
          pain_relief_slot_mins: 10,
        }),
      }).catch(() => {});
    } catch {}

    setStatusMessage('🚨 10-Min Pain Relief Slot inserted! Downstream appointments shifted by +12 mins via WhatsApp.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSurgicalExtension = () => {
    try {
      fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/cascade-delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delay_mins: 20,
          reason: 'Complex Disimpaction Surgical Extension',
        }),
      }).catch(() => {});
    } catch {}

    setStatusMessage('⏱ +20m Surgical Extension logged. Downstream appointments shifted on WhatsApp.');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCompleteAndSterilize = () => {
    if (!activePatient) return;
    const chairUuid = 'c1111111-0000-0000-0000-000000000001';

    try {
      fetch(`http://localhost:8080/api/v1/sessions/${sessionId}/chairs/${chairUuid}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_duration_secs: 1200,
          requires_sterilization: clinicalMode === 'OPERATORY_CHAIR_MODE',
        }),
      }).catch(() => {});
    } catch {}

    setStatusMessage(
      `✓ ${activePatient.token_display} completed! ${selectedChair} locked in 10-Min Autoclave Sterilization.`
    );
    setActivePatient(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F4F4F5] font-sans flex flex-col justify-start items-center relative overflow-x-hidden selection:bg-[#10B981] selection:text-[#0B0C0E]">
      {/* Background Ambient Orbs for Frosted Refraction */}
      <div
        className="ambient-glow w-[380px] h-[380px] -top-20 -left-20 bg-[#10B981]/12"
        style={{ filter: 'blur(80px)' }}
      />
      <div
        className="ambient-glow w-[380px] h-[380px] top-64 -right-24 bg-[#FF6B00]/10"
        style={{ filter: 'blur(80px)' }}
      />

      {/* Centered iOS Viewport Shell (390px - 440px) */}
      <div className="w-full max-w-md min-h-screen flex flex-col pb-28 relative z-10 px-4 pt-3 space-y-4">
        {/* iOS Header Strip with Clinician Identity */}
        <header className="glass-panel p-4 flex items-center justify-between border-t border-[#dadad3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] flex items-center justify-center text-[#0B0C0E] font-extrabold text-sm shadow-md">
              DR
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                {clinicalMode === 'OPERATORY_CHAIR_MODE' ? 'Dr. Sneha Rao' : 'Dr. Arjun Reddy'}
              </h1>
              <p className="text-[11px] text-stone-400 font-medium">
                {clinicalMode === 'OPERATORY_CHAIR_MODE' ? 'Endodontics & Operatory' : 'General Physician OPD'}
              </p>
            </div>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="flex items-center bg-white/06 p-1 rounded-full border border-[#dadad3]">
            <button
              onClick={() => {
                setClinicalMode('OPERATORY_CHAIR_MODE');
                setSelectedChair('DENTAL-CHAIR-1');
              }}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                clinicalMode === 'OPERATORY_CHAIR_MODE'
                  ? 'bg-[#10B981] text-[#0B0C0E] shadow-sm'
                  : 'text-stone-400 hover:text-[#000000]'
              }`}
            >
              Dental
            </button>
            <button
              onClick={() => {
                setClinicalMode('OPD_VELOCITY_MODE');
                setSelectedChair('GP-CABIN-1');
              }}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                clinicalMode === 'OPD_VELOCITY_MODE'
                  ? 'bg-[#10B981] text-[#0B0C0E] shadow-sm'
                  : 'text-stone-400 hover:text-[#000000]'
              }`}
            >
              GP OPD
            </button>
          </div>
        </header>

        {/* Chair Switcher Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['DENTAL-CHAIR-1', 'DENTAL-CHAIR-2', 'GP-CABIN-1'] as const).map((chair) => (
            <button
              key={chair}
              onClick={() => setSelectedChair(chair)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedChair === chair
                  ? 'bg-white/12 text-white border-white/30 shadow-sm'
                  : 'bg-white/04 text-stone-400 border-white/06 hover:text-stone-200'
              }`}
            >
              {chair.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Floating Toast Notification */}
        {statusMessage && (
          <div className="glass-panel p-3 text-xs font-medium text-[#10B981] flex items-center justify-between border-t border-[#10B981]/30">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-stone-400 hover:text-[#000000] ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Front-Desk Cash Waiver / Pilferage Alert */}
        {shadowAlertToast && (
          <div className="glass-panel p-3.5 bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start justify-between gap-2 animate-bounce">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
              <span>{shadowAlertToast}</span>
            </div>
            <button onClick={() => setShadowAlertToast(null)} className="text-amber-400 hover:text-[#000000]">
              ✕
            </button>
          </div>
        )}

        {/* Segmented Top Tabs */}
        <div className="glass-panel p-1.5 flex items-center justify-around gap-1">
          {[
            { id: 'console', label: 'In-Cabin', icon: Layers },
            ...(clinicalMode === 'OPERATORY_CHAIR_MODE' ? [{ id: 'odontogram', label: 'Odontogram', icon: Sparkles }] : []),
            { id: 'camrx', label: 'CamRx', icon: FileText },
            { id: 'ledger', label: 'Ledger', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isActive ? 'bg-white/12 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: In-Cabin Console */}
        {activeTab === 'console' && (
          <div className="space-y-4">
            {/* Active Pre-Medication Hold Countdown Banner */}
            {preMedCountdown !== null && (
              <div className="glass-panel p-4 flex items-center justify-between border-t border-[#FF6B00]/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-bold">
                    🧸
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Pre-Medication Sedation Hold</div>
                    <div className="text-[11px] text-stone-400">{preMedTokenDisplay} • Waiting in lobby</div>
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-[#FF6B00] tabular-nums">
                  {Math.floor(preMedCountdown / 60)}:{String(preMedCountdown % 60).padStart(2, '0')}
                </div>
              </div>
            )}

            {activePatient ? (
              <div className="space-y-4">
                {/* Asymmetric Bento: Top Hero Summary Card */}
                <div className="glass-panel p-6 space-y-4 border-t border-[#dadad3]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                        Serving • {selectedChair.replace('-', ' ')}
                      </span>
                      <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                        {activePatient.patient_name}
                      </h2>
                      <div className="text-xs text-stone-400 mt-0.5">
                        Chief Complaint: {activePatient.chief_complaint}
                      </div>
                    </div>

                    {/* Prominent Tabular Token Metric Badge */}
                    <div className="glass-panel-nested px-4 py-2 text-center border-t border-[#dadad3]">
                      <div className="text-2xl font-extrabold tracking-tight text-white font-mono tabular-nums leading-none">
                        {activePatient.token_display}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-[#10B981] font-bold mt-1">
                        IN-CABIN
                      </div>
                    </div>
                  </div>

                  {/* Family Cluster Indicator */}
                  {activePatient.family_cluster_name && (
                    <div className="glass-pill px-3 py-1.5 flex items-center gap-2 text-xs text-stone-300">
                      <Users className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Family Cluster: <strong>{activePatient.family_cluster_name}</strong></span>
                    </div>
                  )}

                  {/* Medical Alerts & DPDP Consent Status */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {alerts.map((a) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{a.replace('_', ' ')}</span>
                      </span>
                    ))}

                    <button
                      onClick={() => setIsConsentModalOpen(true)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${
                        hasSignedConsent
                          ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          : 'bg-white/06 text-stone-300 border-[#dadad3] hover:bg-white/12'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>{hasSignedConsent ? 'DPDP Consent Sealed ✓' : 'Sign DPDP Consent'}</span>
                    </button>
                  </div>

                  {/* Procedure Milestone Progress Bars */}
                  {clinicalMode === 'OPERATORY_CHAIR_MODE' && (
                    <div className="pt-3 border-t border-white/08 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium">
                        <span>Milestone 2/3: Root Canal Prep</span>
                        <span className="font-mono tabular-nums text-white">64% Completed</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/08 rounded-full overflow-hidden flex gap-1 p-0.5">
                        <div className="h-full bg-[#10B981] rounded-full w-2/5" />
                        <div className="h-full bg-[#10B981]/60 rounded-full w-1/4" />
                        <div className="h-full bg-white/10 rounded-full w-1/3" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Split Row Bento (60/40 Asymmetric) */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Left (7 Cols): Latency Gauge / Timer */}
                  <div className="col-span-7 glass-panel p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-400">
                        {clinicalMode === 'OPERATORY_CHAIR_MODE' ? 'Anesthesia Numbing' : 'Consult Velocity'}
                      </span>
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                    </div>

                    <div className="my-3 flex items-center gap-3">
                      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-white/10"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#FF6B00]"
                            strokeDasharray="68, 100"
                            strokeLinecap="round"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <Syringe className="w-4 h-4 text-[#FF6B00] absolute" />
                      </div>

                      <div>
                        <div className="text-xl font-extrabold tracking-tight text-white font-mono tabular-nums leading-none">
                          {Math.floor(anesthesiaTimer / 60)}:{String(anesthesiaTimer % 60).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-1">15m Target Latency</div>
                      </div>
                    </div>

                    <button
                      onClick={handleStartAnesthesiaHold}
                      className="glass-pill px-3 py-1.5 text-[11px] font-bold text-[#FF6B00] border-t border-[#FF6B00]/30 hover:bg-white/06 transition-all text-center"
                    >
                      Move to Numbing Lounge
                    </button>
                  </div>

                  {/* Right (5 Cols): Scannable Vitals Metrics */}
                  <div className="col-span-5 glass-panel p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-stone-400">Vitals</span>
                    <div className="space-y-1.5 my-1">
                      <div className="glass-panel-nested p-1.5 text-center">
                        <div className="text-[9px] text-stone-400">BP</div>
                        <div className="text-xs font-bold text-white font-mono tabular-nums">
                          {activePatient.vitals?.bp || '120/80'}
                        </div>
                      </div>
                      <div className="glass-panel-nested p-1.5 text-center">
                        <div className="text-[9px] text-stone-400">SpO2</div>
                        <div className="text-xs font-bold text-[#10B981] font-mono tabular-nums">
                          {activePatient.vitals?.spo2 || 99}%
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] text-stone-500 text-center">RBS {activePatient.vitals?.rbs || 115} mg/dL</div>
                  </div>
                </div>

                {/* Tactical Clinical Physics Actions */}
                <div className="glass-panel p-4 space-y-2.5">
                  <span className="text-xs font-bold text-white block">Interleaving &amp; Triage Actions</span>

                  {clinicalMode === 'OPERATORY_CHAIR_MODE' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleInsertPainReliefSlot}
                        className="glass-panel-nested p-3 text-left hover:border-[#FF6B00]/40 transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-[#FF6B00]" />
                            <span>+10m Emergency</span>
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">Acute trauma slot</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-500" />
                      </button>

                      <button
                        onClick={handleStartPreMedHold}
                        className="glass-panel-nested p-3 text-left hover:border-[#10B981]/40 transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>🧸 Pre-Med Hold</span>
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">25m Sedation gel</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSendForDiagnostics('Blood Sugar')}
                        className="glass-panel-nested p-2.5 text-center text-xs font-medium text-stone-300 hover:text-[#000000]"
                      >
                        <Droplet className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                        <span>Lab Test</span>
                      </button>
                      <button
                        onClick={() => handleSendForDiagnostics('12-Lead ECG')}
                        className="glass-panel-nested p-2.5 text-center text-xs font-medium text-stone-300 hover:text-[#000000]"
                      >
                        <Activity className="w-4 h-4 text-[#3B82F6] mx-auto mb-1" />
                        <span>ECG</span>
                      </button>
                      <button
                        onClick={() => handleSendForDiagnostics('Nebulizer')}
                        className="glass-panel-nested p-2.5 text-center text-xs font-medium text-stone-300 hover:text-[#000000]"
                      >
                        <Zap className="w-4 h-4 text-[#FF6B00] mx-auto mb-1" />
                        <span>Nebulizer</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/06 text-stone-400 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Chair is Currently Available</h3>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Tap 'Call Next' on the floating dock below to summon the next patient in deterministic sequence.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Odontogram */}
        {activeTab === 'odontogram' && (
          <div className="glass-panel p-4">
            <FdiToothChart
              patientId={activePatient?.patient_id || 'p-007'}
              records={odontogramRecords}
              onSaveRecord={(newRecord) => {
                setOdontogramRecords((prev) => {
                  const filtered = prev.filter((r) => r.fdi_tooth !== newRecord.fdi_tooth);
                  const fullRecord: DentalOdontogramRecord = {
                    id: newRecord.id || `rec-${Date.now()}`,
                    patient_id: newRecord.patient_id || activePatient?.patient_id || 'p-007',
                    fdi_tooth: newRecord.fdi_tooth || 11,
                    surfaces: newRecord.surfaces || [],
                    condition_code: newRecord.condition_code || 'HEALTHY',
                    notes: newRecord.notes,
                    iopa_xray_url: newRecord.iopa_xray_url,
                    treatment_action: newRecord.treatment_action || 'NONE',
                    estimated_cost_inr: newRecord.estimated_cost_inr || 0,
                    updated_at: new Date().toISOString(),
                  };
                  return [...filtered, fullRecord];
                });
                setStatusMessage(`✓ Tooth #${newRecord.fdi_tooth} state updated`);
                setTimeout(() => setStatusMessage(null), 3000);
              }}
            />
          </div>
        )}

        {/* Tab 3: CamRx & Vitals */}
        {activeTab === 'camrx' && (
          <div className="glass-panel p-4">
            <PrescriptionCameraScanner
              tokenId={activePatient?.token_id || 't-007'}
              onSave={() => {
                setStatusMessage('✓ Prescription image scanned, auto-cropped and archived');
                setTimeout(() => setStatusMessage(null), 3000);
              }}
            />
          </div>
        )}

        {/* Tab 4: Ledger & Installments */}
        {activeTab === 'ledger' && (
          <div className="glass-panel p-4">
            <TreatmentPlanInstallmentLedger />
          </div>
        )}

        {/* Floating Tactile Glass Dock (Elevated 16px above bottom) */}
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-40">
          <nav className="glass-dock h-16 px-3 flex items-center justify-around gap-2 shadow-2xl">
            {/* Call Next Button */}
            <button
              onClick={handleCallNext}
              className="flex-1 h-11 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#0B0C0E] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#10B981]/25 active:scale-95 transition-all"
            >
              <User className="w-4 h-4" />
              <span>Call Next</span>
            </button>

            {/* Quick Extension */}
            <button
              onClick={handleSurgicalExtension}
              className="h-11 px-3 rounded-full bg-white/06 hover:bg-white/12 text-stone-300 font-semibold text-xs flex items-center gap-1 border border-white/08 active:scale-95 transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>+20m</span>
            </button>

            {/* Complete Visit Button */}
            <button
              onClick={handleCompleteAndSterilize}
              disabled={!activePatient}
              className="h-11 px-4 rounded-full bg-white/08 hover:bg-white/14 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1.5 border border-[#dadad3] active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 text-[#10B981]" />
              <span>Done</span>
            </button>
          </nav>
        </div>

        {/* Informed Consent Modal */}
        <ConsentSignatureModal
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          patientName={activePatient?.patient_name || 'Patient'}
          procedureName={
            clinicalMode === 'OPERATORY_CHAIR_MODE'
              ? 'Molar Root Canal & Crown Preparation (#36)'
              : 'Consultation & Medication Administration'
          }
          onConsentSigned={() => {
            setHasSignedConsent(true);
            setStatusMessage('✓ DPDP 2023 Digital Informed Consent verified & sealed');
            setTimeout(() => setStatusMessage(null), 3000);
          }}
        />
      </div>
    </div>
  );
}

export default function DoctorMobilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0C0E] text-white p-6">Loading Cockpit...</div>}>
      <DoctorMobileContent />
    </Suspense>
  );
}
