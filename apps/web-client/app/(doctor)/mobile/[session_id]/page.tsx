'use client';

import React, { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { FdiToothChart } from '@/components/odontogram/FdiToothChart';
import { PrescriptionCameraScanner } from '@/components/cam-rx/PrescriptionCameraScanner';
import { QueueToken, DentalOdontogramRecord } from '@/lib/types';
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
} from 'lucide-react';

function DoctorMobileContent() {
  const params = useParams();
  const sessionId = (params?.session_id as string) || 'a1111111-2222-3333-4444-555555555555';

  const [activeTab, setActiveTab] = useState<'console' | 'odontogram' | 'camrx'>('console');
  const [selectedChair, setSelectedChair] = useState<'DENTAL-CHAIR-1' | 'DENTAL-CHAIR-2'>('DENTAL-CHAIR-1');

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

  // 1-Thumb Chair Actions
  const handleCallNext = () => {
    setActivePatient({
      token_id: `t-${Date.now()}`,
      session_id: sessionId,
      token_display: 'D-08',
      patient_id: `p-${Date.now()}`,
      patient_name: 'Suresh Patil (Age 36)',
      category: 'Regular',
      status: 'InCabin',
      required_seat_type: 'Standard',
      assigned_chair_code: selectedChair,
      planned_duration_secs: 1200,
      requires_sterilization: true,
      lab_qc_verified: true,
      estimated_wait_secs: 0,
      booked_at: new Date().toISOString(),
      chief_complaint: 'Crown cementation for lower molar #46 (Zirconia Crown QC Verified).',
      vitals: { bp: '120/80', spo2: 98, temp: 98.4, rbs: 104, weight: 70 },
    });
    setStatusMessage('✓ Called next optimal patient into ' + selectedChair);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleStartAnesthesiaHold = () => {
    if (!activePatient) return;
    setStatusMessage(`💉 ${activePatient.token_display} placed on 15m Anesthesia Hold. Patient moved to Numbing Lounge.`);
    setActivePatient(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSurgicalExtension = () => {
    setStatusMessage('⏱ +20m Surgical Extension logged. Downstream appointments shifted on WhatsApp.');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCompleteAndSterilize = () => {
    if (!activePatient) return;
    setStatusMessage(`✓ ${activePatient.token_display} visit completed! ${selectedChair} locked in 10-Min Autoclave Sterilization.`);
    setActivePatient(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col pb-24">
      {/* Top Mobile Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div>
          <h1 className="text-base font-extrabold text-white">Dr. Sneha Rao (Dentist Mobile)</h1>
          <p className="text-[11px] text-slate-400">1-Thumb Clinical Cockpit • {selectedChair}</p>
        </div>

        {/* Chair Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSelectedChair('DENTAL-CHAIR-1')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              selectedChair === 'DENTAL-CHAIR-1' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Chair 1
          </button>
          <button
            onClick={() => setSelectedChair('DENTAL-CHAIR-2')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              selectedChair === 'DENTAL-CHAIR-2' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400'
            }`}
          >
            Chair 2
          </button>
        </div>
      </header>

      {/* Toast alert */}
      {statusMessage && (
        <div className="bg-gradient-to-r from-teal-900 to-cyan-900 border-b border-teal-500/50 px-4 py-2.5 text-xs font-bold text-teal-200 animate-fadeIn">
          {statusMessage}
        </div>
      )}

      {/* Top Tab Bar: Clinical Flow / Odontogram / CamRx */}
      <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'console'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Active Patient</span>
        </button>

        <button
          onClick={() => setActiveTab('odontogram')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'odontogram'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>FDI Odontogram</span>
        </button>

        <button
          onClick={() => setActiveTab('camrx')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'camrx'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>CamRx & Vitals</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="p-4 flex-1">
        {activeTab === 'console' && (
          <div className="space-y-4">
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

                {/* Medical Alerts (High-Priority Badges) */}
                {alerts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {alerts.map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold rounded-md flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>{a.replace('_', ' ')}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Chief Complaint */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-3">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Chief Complaint:</span>
                  <p className="text-xs text-slate-200 mt-1 font-medium">{activePatient.chief_complaint}</p>
                </div>

                {/* Recorded Vitals Quick Bar */}
                <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs">
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
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">Chair is Currently Empty</h3>
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
      </main>

      {/* Ergonomic 1-Thumb Bottom Action Dock */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 p-3 backdrop-blur-lg z-50">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          {/* Action 1: Call Next */}
          <button
            onClick={handleCallNext}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-t from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black text-[11px] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <User className="w-4 h-4 mb-1" />
            <span>Call Next</span>
          </button>

          {/* Action 2: Anesthesia Hold */}
          <button
            onClick={handleStartAnesthesiaHold}
            disabled={!activePatient}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-300 font-bold text-[11px] hover:bg-indigo-950/50 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Syringe className="w-4 h-4 mb-1 text-indigo-400" />
            <span>LA Hold (15m)</span>
          </button>

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
