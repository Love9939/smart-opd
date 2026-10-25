'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useLiveClinicStore, ReconnectingWebSocketClient } from '@/lib/ws-client';
import {
  Clock,
  Armchair,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Radio,
  ArrowRight,
  Compass,
  AlertCircle,
  Activity,
  Users,
} from 'lucide-react';

function PatientLiveTrackerContent() {
  const params = useParams();
  const clinicSlug = (params?.clinic_slug as string) || 'smartopd-demo';

  const { isConnected, lastEvent } = useLiveClinicStore();

  const [tokenDisplay, setTokenDisplay] = useState('A-14');
  const [patientName, setPatientName] = useState('Fatima Z.');
  const [assignedSeat, setAssignedSeat] = useState('Seat A-02 (Main Lobby)');
  const [patientsAhead, setPatientsAhead] = useState(2);
  const [estWaitMins, setEstWaitMins] = useState(12);
  const [currentStatus, setCurrentStatus] = useState<'WAITING' | 'CALLED' | 'IN_CABIN' | 'COMPLETED'>('WAITING');
  const [assignedCabinOrChair, setAssignedCabinOrChair] = useState<string | null>(null);

  // Initialize WebSocket connection for patient
  useEffect(() => {
    const wsClient = new ReconnectingWebSocketClient('8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f');
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  // Listen for WebSocket live events
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.event_type === 'TOKEN_CALLED') {
      const { token_display, assigned_chair_code } = lastEvent.payload;
      if (token_display === tokenDisplay) {
        setCurrentStatus('CALLED');
        setAssignedCabinOrChair(assigned_chair_code);
        setPatientsAhead(0);
        setEstWaitMins(0);
      } else {
        // Another patient called, decrement patients ahead
        setPatientsAhead((prev) => Math.max(0, prev - 1));
        setEstWaitMins((prev) => Math.max(3, prev - 6));
      }
    }
  }, [lastEvent, tokenDisplay]);

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 font-sans flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-white/[0.06] relative overflow-hidden">
      {/* Ambient Organic Blurred Refraction Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/12 blur-[90px]" />
        <div className="absolute top-1/2 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-[90px]" />
      </div>

      {/* Top Banner Header */}
      <header className="glass-panel border-x-0 border-t-0 rounded-none p-5 flex items-center justify-between relative z-20 backdrop-blur-xl">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider block">
            Zero-App Live Pass
          </span>
          <h1 className="text-base font-bold text-white tracking-tight">SmartOPD & DentalFlow</h1>
          <p className="text-xs text-[#62625b]">Dr. Sneha Rao & Dr. Arjun Reddy</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-300 border-emerald-500/25">
          <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span>{isConnected ? 'Sub-5ms Live' : 'Connecting'}</span>
        </div>
      </header>

      {/* Main Patient Card */}
      <main className="p-5 flex-1 space-y-4 relative z-10">
        {/* Called Banner */}
        {currentStatus === 'CALLED' ? (
          <div className="glass-panel border-emerald-500/50 p-6 rounded-[28px] shadow-2xl text-center relative overflow-hidden animate-pulse">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
              YOUR TURN IS NOW
            </span>
            <div className="text-4xl font-mono font-black text-white mb-2 tabular-nums">{tokenDisplay}</div>
            <div className="text-sm font-semibold text-[#211922] mb-3">Dear {patientName}, please proceed to:</div>
            <div className="glass-panel-nested text-amber-200 text-lg font-bold py-2.5 px-5 rounded-2xl inline-block border border-amber-400/30 shadow-md">
              👉 {assignedCabinOrChair}
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-[28px] p-6 shadow-2xl text-center relative overflow-hidden">
            <span className="text-xs font-mono uppercase text-[#62625b] font-semibold tracking-wider block">
              Your OPD Queue Token
            </span>
            <div className="my-3.5 inline-block glass-panel-nested border border-emerald-500/30 rounded-[20px] px-8 py-3.5 shadow-lg shadow-emerald-500/10">
              <span className="text-5xl font-mono font-black text-emerald-300 tracking-tight tabular-nums">
                {tokenDisplay}
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">{patientName}</h2>
            <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-[#62625b]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Checked in • Allocated to Priority Flow</span>
            </div>
          </div>
        )}

        {/* Dynamic Queue Position & Estimated Wait (Asymmetric Bento Metric) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel-nested p-4 rounded-[20px] text-center border border-white/[0.06]">
            <span className="text-[10px] text-[#62625b] uppercase font-semibold tracking-wider block mb-1">
              Patients Ahead
            </span>
            <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {currentStatus === 'CALLED' ? '0' : patientsAhead}
            </div>
            <span className="text-[10px] text-[#91918c] mt-1 block font-medium">In live sequence</span>
          </div>

          <div className="glass-panel-nested p-4 rounded-[20px] text-center border border-white/[0.06]">
            <span className="text-[10px] text-[#62625b] uppercase font-semibold tracking-wider block mb-1">
              Estimated Wait
            </span>
            <div className="text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
              ~{currentStatus === 'CALLED' ? '0' : estWaitMins}m
            </div>
            <span className="text-[10px] text-[#91918c] mt-1 block font-medium">EMA calibrated</span>
          </div>
        </div>

        {/* Assigned Physical Seat Card */}
        <div className="glass-panel-nested p-4 rounded-[20px] flex items-center gap-3.5 border border-white/[0.08]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#62625b] tracking-wider block">Your Lobby Seat</span>
            <div className="text-sm font-bold text-white tracking-tight">{assignedSeat}</div>
          </div>
        </div>

        {/* Clinic Hygiene & Attendant Guidance */}
        <div className="p-4 glass-panel-nested rounded-[20px] space-y-2 text-xs border border-white/[0.06]">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Class B Autoclave & UV Sterilization Guaranteed</span>
          </div>
          <p className="text-[11px] text-[#62625b] leading-relaxed">
            Please remain seated in your allocated lobby chair. The Waiting Lounge TV and this screen will chime
            the moment the operatory chair is disinfected and ready.
          </p>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="p-4 glass-panel border-x-0 border-b-0 rounded-none text-center text-[11px] text-[#91918c] relative z-20 backdrop-blur-xl">
        SmartOPD & DentalFlow • Zero-App PWA Live Stream
      </footer>
    </div>
  );
}

export default function PatientLiveTrackerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0C0E] text-white p-6">Loading Live Patient Tracker...</div>}>
      <PatientLiveTrackerContent />
    </Suspense>
  );
}
