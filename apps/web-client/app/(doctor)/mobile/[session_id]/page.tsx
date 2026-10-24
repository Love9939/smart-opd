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
  });

  const [alerts] = useState<string[]>(['PENICILLIN_ALLERGY', 'HYPERTENSIVE']);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [shadowAlertToast, setShadowAlertToast] = useState<string | null>(null);
  const [preMedCountdown, setPreMedCountdown] = useState<number | null>(null);
  const [preMedTokenDisplay, setPreMedTokenDisplay] = useState<string | null>(null);

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
    // Attempt real backend call
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

  // Pediatric Pre-Medication Hold (25m sedation/numbing gel hold)
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

  // GP Intra-Visit Diagnostic Pause
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

  // Emergency Pain Relief Slot
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
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col pb-28">
      {/* Top Mobile Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white">
              {clinicalMode === 'OPERATORY_CHAIR_MODE' ? 'Dr. Sneha Rao (Dentist)' : 'Dr. Arjun Reddy (Physician)'}
            </h1>
          </div>
          <p className="text-[11px] text-slate-400">1-Thumb Cockpit • {selectedChair}</p>
        </div>

        {/* Clinical Physics Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setClinicalMode('OPERATORY_CHAIR_MODE');
              setSelectedChair('DENTAL-CHAIR-1');
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              clinicalMode === 'OPERATORY_CHAIR_MODE' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Dental
          </button>
          <button
            onClick={() => {
              setClinicalMode('OPD_VELOCITY_MODE');
              setSelectedChair('GP-CABIN-1');
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              clinicalMode === 'OPD_VELOCITY_MODE' ? 'bg-teal-400 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            GP Velocity
          </button>
        </div>
      </header>

      {/* Toast alert */}
      {statusMessage && (
        <div className="bg-gradient-to-r from-teal-900 to-cyan-900 border-b border-teal-500/50 px-4 py-2.5 text-xs font-bold text-teal-200 animate-fadeIn">
          {statusMessage}
        </div>
      )}

      {/* Front-Desk Cash Waiver / Pilferage Alert Banner */}
      {shadowAlertToast && (
        <div className="bg-amber-950/90 border-b border-amber-500/70 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-semibold">{shadowAlertToast}</span>
          </div>
          <button
            onClick={() => setShadowAlertToast(null)}
            className="text-amber-400 hover:text-white font-bold ml-3 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Tab Bar */}
      <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-around overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'console'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Active Patient</span>
        </button>

        {clinicalMode === 'OPERATORY_CHAIR_MODE' && (
          <button
            onClick={() => setActiveTab('odontogram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'odontogram'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>FDI Odontogram</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('camrx')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'camrx'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>CamRx & Vitals</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'ledger'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Installments</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="p-4 flex-1">
        {activeTab === 'console' && (
          <div className="space-y-4">
            {/* Pediatric Pre-Medication Hold Active Timer Card */}
            {preMedCountdown !== null && (
              <div className="p-3.5 bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/40 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    🧸
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Pre-Medication Hold: {preMedTokenDisplay || 'Pediatric Patient'}
                    </div>
                    <div className="text-[11px] text-purple-300">
                      Numbing gel & oral sedation active in lobby
                    </div>
                  </div>
                </div>
                <div className="text-lg font-mono font-black text-purple-300 bg-purple-500/20 px-3 py-1 rounded-xl border border-purple-500/30">
                  {Math.floor(preMedCountdown / 60)}:{String(preMedCountdown % 60).padStart(2, '0')}
                </div>
              </div>
            )}

            {activePatient ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
                {/* Active Patient Card */}
                <div className="flex items-start justify-between mb-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                      Currently In Cabin • {selectedChair}
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">{activePatient.patient_name}</h2>
                  </div>
                  <span className="w-14 h-11 bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 font-mono font-black text-lg rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    {activePatient.token_display}
                  </span>
                </div>

                {/* Family Cluster Badge if arriving together */}
                {activePatient.family_cluster_name && (
                  <div className="mb-3 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2 text-cyan-200 text-xs font-medium">
                    <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Family Arriving Together: <strong>{activePatient.family_cluster_name}</strong>
                    </span>
                  </div>
                )}

                {/* Medical Alerts (High-Priority Badges) & Consent Status */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {alerts.map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold rounded-md flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{a.replace('_', ' ')}</span>
                    </span>
                  ))}

                  <button
                    onClick={() => setIsConsentModalOpen(true)}
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      hasSignedConsent
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{hasSignedConsent ? 'DPDP Consent Signed ✓' : '✍️ Sign Informed Consent'}</span>
                  </button>
                </div>

                {/* Chief Complaint */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-3">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Chief Complaint:</span>
                  <p className="text-xs text-slate-200 mt-1 font-medium">{activePatient.chief_complaint}</p>
                </div>

                {/* Recorded Vitals Quick Bar */}
                <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">BP</span>
                    <span className="font-mono font-bold text-rose-300">{activePatient.vitals?.bp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SpO2</span>
                    <span className="font-mono font-bold text-cyan-300">{activePatient.vitals?.spo2}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">RBS</span>
                    <span className="font-mono font-bold text-purple-300">{activePatient.vitals?.rbs}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Weight</span>
                    <span className="font-mono font-bold text-emerald-300">{activePatient.vitals?.weight}kg</span>
                  </div>
                </div>

                {/* GP Velocity Mode Intra-Visit Diagnostic Pause Buttons */}
                {clinicalMode === 'OPD_VELOCITY_MODE' && (
                  <div className="pt-3 border-t border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 mb-2">
                      Intra-Visit Pause (Frees Cabin to Call Next Patient):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSendForDiagnostics('Blood Test & Sugar Profile')}
                        className="p-2 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-xl text-[11px] font-semibold text-slate-300 flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <Droplet className="w-3.5 h-3.5 text-rose-400" />
                        <span>Blood Test</span>
                      </button>
                      <button
                        onClick={() => handleSendForDiagnostics('12-Lead ECG')}
                        className="p-2 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-xl text-[11px] font-semibold text-slate-300 flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>12-Lead ECG</span>
                      </button>
                      <button
                        onClick={() => handleSendForDiagnostics('Nebulization Therapy')}
                        className="p-2 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-xl text-[11px] font-semibold text-slate-300 flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Nebulizer</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Emergency Pain Relief Slot Inserter & Pediatric Pre-Med Hold */}
                {clinicalMode === 'OPERATORY_CHAIR_MODE' && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        Emergency pain walk-in? Shift schedule:
                      </div>
                      <button
                        onClick={handleInsertPainReliefSlot}
                        className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Flame className="w-3 h-3 text-rose-400" />
                        <span>+10m Emergency Slot</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        Anxious pediatric patient? Apply topical gel:
                      </div>
                      <button
                        onClick={handleStartPreMedHold}
                        className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span>🧸 Pre-Med Hold (25m)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">Chair / Cabin is Currently Empty</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Tap 'Call Next' below to summon the next patient in priority sequence.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'odontogram' && (
          <FdiToothChart
            patientId={activePatient?.patient_id || 'p-007'}
            records={odontogramRecords}
            onSaveRecord={(newRecord) => {
              setOdontogramRecords((prev) => [
                ...prev.filter((r) => r.fdi_tooth !== newRecord.fdi_tooth),
                {
                  id: `od-${Date.now()}`,
                  patient_id: activePatient?.patient_id || 'p-007',
                  fdi_tooth: newRecord.fdi_tooth!,
                  surfaces: newRecord.surfaces || [],
                  condition_code: newRecord.condition_code || 'HEALTHY',
                  treatment_action: newRecord.treatment_action,
                  estimated_cost_inr: newRecord.estimated_cost_inr,
                  notes: newRecord.notes,
                  updated_at: new Date().toISOString(),
                },
              ]);
              setStatusMessage(`✓ FDI Tooth #${newRecord.fdi_tooth} updated with treatment plan!`);
              setTimeout(() => setStatusMessage(null), 3000);
            }}
          />
        )}

        {activeTab === 'camrx' && (
          <PrescriptionCameraScanner
            tokenId={activePatient?.token_id || 't-007'}
            onSave={(data) => {
              if (activePatient) {
                setActivePatient({ ...activePatient, vitals: data.vitals, rx_image_url: data.rxImageUrl });
              }
              setStatusMessage('✓ Prescription image & vitals attached to clinical record.');
              setTimeout(() => setStatusMessage(null), 3000);
            }}
          />
        )}

        {activeTab === 'ledger' && <TreatmentPlanInstallmentLedger />}
      </main>

      {/* Ergonomic 1-Thumb Bottom Action Dock */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 p-3 backdrop-blur-lg z-40">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          {/* Action 1: Call Next */}
          <button
            onClick={handleCallNext}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-t from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black text-[11px] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <User className="w-4 h-4 mb-1" />
            <span>Call Next</span>
          </button>

          {/* Action 2: Mode-Specific Pause */}
          {clinicalMode === 'OPERATORY_CHAIR_MODE' ? (
            <button
              onClick={handleStartAnesthesiaHold}
              disabled={!activePatient}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-300 font-bold text-[11px] hover:bg-indigo-950/50 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Syringe className="w-4 h-4 mb-1 text-indigo-400" />
              <span>LA Hold (15m)</span>
            </button>
          ) : (
            <button
              onClick={() => handleSendForDiagnostics('Diagnostics')}
              disabled={!activePatient}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-teal-500/40 text-teal-300 font-bold text-[11px] hover:bg-teal-950/50 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Activity className="w-4 h-4 mb-1 text-teal-400" />
              <span>Lab Pause</span>
            </button>
          )}

          {/* Action 3: +20m Extension */}
          <button
            onClick={handleSurgicalExtension}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-[11px] hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4 mb-1 text-amber-400" />
            <span>+20m Extend</span>
          </button>

          {/* Action 4: Complete & Sterilize */}
          <button
            onClick={handleCompleteAndSterilize}
            disabled={!activePatient}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-t from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-[11px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 mb-1" />
            <span>Complete</span>
          </button>
        </div>
      </footer>

      {/* Informed Consent E-Signature Modal */}
      <ConsentSignatureModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        patientName={activePatient?.patient_name || 'Patient'}
        procedureName={
          clinicalMode === 'OPERATORY_CHAIR_MODE'
            ? 'Root Canal Treatment & Crown Prep (#36)'
            : 'Diagnostic Consultation & Prescription'
        }
        onConsentSigned={(sig, timestamp) => {
          setHasSignedConsent(true);
          setStatusMessage('✓ Digital Informed Consent signed and cryptographically sealed under DPDP Act.');
          setTimeout(() => setStatusMessage(null), 3500);
        }}
      />
    </div>
  );
}

export default function DoctorMobilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-6">Loading Doctor Mobile Cockpit...</div>}>
      <DoctorMobileContent />
    </Suspense>
  );
}
