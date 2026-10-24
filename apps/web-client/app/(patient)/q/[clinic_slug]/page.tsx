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
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-900">
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-teal-400 tracking-wider">
            Patient Live Tracker
          </span>
          <h1 className="text-lg font-black text-white">SmartOPD & DentalFlow</h1>
          <p className="text-xs text-slate-400">Dr. Sneha Rao & Dr. Arjun Reddy</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-full border border-slate-800 text-[11px] font-semibold text-slate-300">
          <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span>{isConnected ? 'Live' : 'Connecting'}</span>
        </div>
      </header>

      {/* Main Patient Card */}
      <main className="p-5 flex-1 space-y-5">
        {/* Called Banner */}
        {currentStatus === 'CALLED' ? (
          <div className="bg-gradient-to-br from-cyan-500 to-teal-400 text-slate-950 p-6 rounded-3xl shadow-2xl text-center animate-bounce">
            <span className="text-xs font-black uppercase tracking-widest text-slate-900 block mb-1">
              IT IS YOUR TURN NOW!
            </span>
            <div className="text-4xl font-mono font-black mb-2">{tokenDisplay}</div>
            <div className="text-sm font-extrabold mb-3">Dear {patientName}, please proceed to:</div>
            <div className="bg-slate-950 text-amber-200 text-xl font-black py-2.5 px-4 rounded-2xl inline-block shadow-lg">
              👉 {assignedCabinOrChair}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md text-center">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              Your OPD Token Number
            </span>
            <div className="my-3 inline-block bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border-2 border-cyan-400 rounded-3xl px-8 py-3 shadow-xl shadow-cyan-500/10">
              <span className="text-5xl font-mono font-black text-cyan-300">{tokenDisplay}</span>
            </div>
            <h2 className="text-base font-bold text-white">{patientName}</h2>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Checked in & Active in Queue</span>
            </div>
          </div>
        )}

        {/* Dynamic Queue Position & Estimated Wait */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">Patients Ahead</span>
            <div className="text-3xl font-extrabold text-cyan-300 font-mono">
              {currentStatus === 'CALLED' ? '0' : patientsAhead}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">In priority sequence</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">Est. Wait Time</span>
            <div className="text-3xl font-extrabold text-amber-300 font-mono">
              ~{currentStatus === 'CALLED' ? '0' : estWaitMins}m
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Auto-updated by AI</span>
          </div>
        </div>

        {/* Assigned Physical Seat Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Lobby Seat</span>
            <div className="text-sm font-extrabold text-white">{assignedSeat}</div>
          </div>
        </div>

        {/* Clinic Hygiene & Attendant Guidance */}
        <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Autoclave Class B Vacuum Sterilization Guaranteed</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Please sit comfortably in your allocated seat. The Waiting Room TV and your phone will notify you
            immediately when the doctor cabin or dental operatory chair is ready.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 bg-slate-900/90 border-t border-slate-800 text-center text-[11px] text-slate-500">
        SmartOPD & DentalFlow • Zero-App QR Patient Experience
      </footer>
    </div>
  );
}

export default function PatientLiveTrackerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-6">Loading Live Patient Tracker...</div>}>
      <PatientLiveTrackerContent />
    </Suspense>
  );
}
