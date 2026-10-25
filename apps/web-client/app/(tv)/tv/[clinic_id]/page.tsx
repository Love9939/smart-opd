'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ReconnectingWebSocketClient, useLiveClinicStore } from '@/lib/ws-client';
import { clinicalChime } from '@/lib/audio-chime';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  Sparkles,
  Clock,
  Armchair,
  QrCode,
  Flame,
  Radio,
  Wifi,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface ActiveChairDisplay {
  chair_code: string;
  doctor_name: string;
  specialty: string;
  state: 'OCCUPIED' | 'STERILIZATION_LOCK' | 'ANESTHESIA_HOLD' | 'AVAILABLE';
  active_token?: string;
  patient_name?: string;
  unlocks_in_secs?: number;
  anesthesia_mins_left?: number;
}

interface WaitingItem {
  token_display: string;
  patient_name: string;
  seat_code: string;
  est_wait_mins: number;
  category: 'REGULAR' | 'PRIORITY' | 'EMERGENCY';
}

function WaitingRoomTvContent() {
  const params = useParams();
  const clinicId = (params?.clinic_id as string) || '8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f';

  const { isConnected, lastEvent, activeTtsAnnouncement, clearActiveTts } = useLiveClinicStore();

  const [ttsAudioEnabled, setTtsAudioEnabled] = useState(false);
  const [currentCallBanner, setCurrentCallBanner] = useState<{
    token: string;
    patient: string;
    chair: string;
    seat?: string;
  } | null>({
    token: 'D-07',
    patient: 'Ramesh K.',
    chair: 'DENTAL-CHAIR-2',
    seat: 'P-02',
  });

  // Active Chairs / Cabins State (Left 60% Panel)
  const [activeChairs, setActiveChairs] = useState<ActiveChairDisplay[]>([
    {
      chair_code: 'DENTAL-CHAIR-1',
      doctor_name: 'Dr. Sneha Rao (MDS Endodontics)',
      specialty: 'Root Canal & Crowns',
      state: 'STERILIZATION_LOCK',
      unlocks_in_secs: 480, // 8 mins left
    },
    {
      chair_code: 'DENTAL-CHAIR-2',
      doctor_name: 'Dr. Sneha Rao (MDS Endodontics)',
      specialty: 'Root Canal & Restorations',
      state: 'OCCUPIED',
      active_token: 'D-07',
      patient_name: 'Ramesh K.',
    },
    {
      chair_code: 'GP-CABIN-1',
      doctor_name: 'Dr. Arjun Reddy (MD Internal Medicine)',
      specialty: 'General Physician & Diabetology',
      state: 'OCCUPIED',
      active_token: 'A-12',
      patient_name: 'Priya Verma',
    },
    {
      chair_code: 'NUMBING-LOUNGE-N1',
      doctor_name: 'Supervised Latency Lounge',
      specialty: 'Local Anesthesia Hold',
      state: 'ANESTHESIA_HOLD',
      active_token: 'D-06',
      patient_name: 'Kavita M. (RCT Tooth #46)',
      anesthesia_mins_left: 7,
    },
  ]);

  // Next Waiting Tokens (Right 40% Panel)
  const [waitingTokens, setWaitingTokens] = useState<WaitingItem[]>([
    { token_display: 'E-01', patient_name: 'Manjunath B.', seat_code: 'P-01', est_wait_mins: 2, category: 'EMERGENCY' },
    { token_display: 'D-08', patient_name: 'Suresh Patil', seat_code: 'N-01', est_wait_mins: 8, category: 'REGULAR' },
    { token_display: 'A-14', patient_name: 'Fatima Z.', seat_code: 'A-02', est_wait_mins: 14, category: 'REGULAR' },
    { token_display: 'A-15', patient_name: 'Chennappa G.', seat_code: 'P-02', est_wait_mins: 18, category: 'PRIORITY' },
    { token_display: 'L-02', patient_name: 'Anjali Deshmukh', seat_code: 'A-03', est_wait_mins: 22, category: 'REGULAR' },
    { token_display: 'A-16', patient_name: 'Rahul Hegde', seat_code: 'A-04', est_wait_mins: 26, category: 'REGULAR' },
  ]);

  // Sterilization countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveChairs((prev) =>
        prev.map((chair) => {
          if (chair.state === 'STERILIZATION_LOCK' && chair.unlocks_in_secs) {
            const nextSecs = chair.unlocks_in_secs - 1;
            if (nextSecs <= 0) {
              return { ...chair, state: 'AVAILABLE', unlocks_in_secs: undefined };
            }
            return { ...chair, unlocks_in_secs: nextSecs };
          }
          return chair;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Speech API Multi-Lingual TTS voice announcement with Dual-Tone Chime
  useEffect(() => {
    if (!ttsAudioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (activeTtsAnnouncement) {
      window.speechSynthesis.cancel();
      clinicalChime.playTokenCallChime().then(() => {
        const utterance = new SpeechSynthesisUtterance(activeTtsAnnouncement);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-IN';

        window.speechSynthesis.speak(utterance);
      });
      clearActiveTts();
    }
  }, [activeTtsAnnouncement, ttsAudioEnabled, clearActiveTts]);

  // Connect WebSocket
  useEffect(() => {
    const wsClient = new ReconnectingWebSocketClient(clinicId);
    wsClient.connect();
    return () => wsClient.disconnect();
  }, [clinicId]);

  // Listen for WebSocket Events
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.event_type === 'TOKEN_CALLED') {
      const { token_display, patient_first_name, assigned_chair_code, previous_waiting_seat, tts_announcements } =
        lastEvent.payload;

      setCurrentCallBanner({
        token: token_display,
        patient: patient_first_name,
        chair: assigned_chair_code,
        seat: previous_waiting_seat,
      });

      // Update active chairs
      setActiveChairs((prev) =>
        prev.map((c) =>
          c.chair_code === assigned_chair_code
            ? { ...c, state: 'OCCUPIED', active_token: token_display, patient_name: patient_first_name }
            : c
        )
      );

      // Remove from waiting queue
      setWaitingTokens((prev) => prev.filter((t) => t.token_display !== token_display));

      // Speak if enabled
      if (ttsAudioEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const msg = tts_announcements?.['en-IN'] || `Token ${token_display}, please proceed to ${assigned_chair_code}`;
        const u = new SpeechSynthesisUtterance(msg);
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
      }
    } else if (lastEvent.event_type === 'TOKEN_CHECKED_IN') {
      const { token_display, patient_first_name, assigned_waiting_seat, estimated_wait_secs } = lastEvent.payload;
      setWaitingTokens((prev) => {
        if (prev.some((t) => t.token_display === token_display)) return prev;
        return [
          ...prev,
          {
            token_display,
            patient_name: patient_first_name,
            seat_code: assigned_waiting_seat || 'Lobby Waiting',
            est_wait_mins: Math.round(estimated_wait_secs / 60) || 6,
            category: token_display.startsWith('E') ? 'EMERGENCY' : token_display.startsWith('P') ? 'PRIORITY' : 'REGULAR',
          },
        ];
      });
    } else if (lastEvent.event_type === 'STERILIZATION_STARTED') {
      const { chair_code, duration_mins } = lastEvent.payload;
      setActiveChairs((prev) =>
        prev.map((c) =>
          c.chair_code === chair_code
            ? { ...c, state: 'STERILIZATION_LOCK', unlocks_in_secs: duration_mins * 60, active_token: undefined }
            : c
        )
      );
    } else if (lastEvent.event_type === 'ANESTHESIA_HOLD_STARTED') {
      const { token_display, chair_code, ready_in_mins } = lastEvent.payload;
      setActiveChairs((prev) =>
        prev.map((c) =>
          c.chair_code === chair_code
            ? { ...c, state: 'ANESTHESIA_HOLD', active_token: token_display, anesthesia_mins_left: ready_in_mins }
            : c
        )
      );
    } else if (lastEvent.event_type === 'EMERGENCY_TRIAGE_ALERT') {
      clinicalChime.playTokenCallChime();
    }
  }, [lastEvent, ttsAudioEnabled]);

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 font-sans flex flex-col justify-between overflow-hidden select-none relative">
      {/* Ambient Organic Blurred Refraction Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-amber-500/08 blur-[120px]" />
      </div>

      {/* 1080p Editorial Header Bar */}
      <header className="glass-panel border-x-0 border-t-0 rounded-none backdrop-blur-xl px-8 py-4 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
            SO
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">SmartOPD & DentalFlow</h1>
              <span className="glass-pill px-3 py-1 text-xs font-mono text-emerald-300">
                Waiting Lounge TV
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Multi-Operatory Live Status • Dr. Sneha Rao (Dentistry) & Dr. Arjun Reddy (Physician)
            </p>
          </div>
        </div>

        {/* TTS Audio Toggle & Connection Indicator */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTtsAudioEnabled((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              ttsAudioEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'glass-panel-nested text-slate-400 hover:text-white border-white/[0.08]'
            }`}
          >
            {ttsAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{ttsAudioEnabled ? 'Voice Broadcast ON' : 'Tap to Enable Audio'}</span>
          </button>

          <div className="flex items-center gap-2 text-slate-300 text-xs font-mono glass-panel-nested px-3.5 py-2 rounded-xl border border-white/[0.08] tabular-nums">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>SUB-5MS SYNC</span>
          </div>
        </div>
      </header>

      {/* High-Visibility Tactile Glass Call Banner */}
      {currentCallBanner && (
        <div className="bg-emerald-500/15 border-y border-emerald-500/30 px-8 py-3.5 backdrop-blur-xl flex items-center justify-between relative z-20 shadow-lg">
          <div className="flex items-center gap-5">
            <div className="bg-[#111318] text-emerald-300 font-mono text-3xl font-black px-5 py-2 rounded-2xl border border-emerald-500/40 shadow-md tabular-nums">
              {currentCallBanner.token}
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider block">
                Now Calling Patient
              </span>
              <div className="text-2xl font-bold text-white tracking-tight">{currentCallBanner.patient}</div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">Proceed Directly To</span>
            <div className="text-xl font-extrabold text-amber-200 glass-panel-nested px-4 py-1.5 rounded-xl border border-amber-400/30">
              👉 {currentCallBanner.chair}
            </div>
          </div>
        </div>
      )}

      {/* Main TV Screen: 60% Left Operatories / 40% Right Waiting Queue */}
      <div className="flex-1 p-8 grid grid-cols-12 gap-8 items-stretch relative z-10">
        {/* Left 60% Panel: Active Cabins & Dental Chairs */}
        <div className="col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <h2 className="text-base font-bold text-slate-200 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Active Consultation Cabins & Operatory Chairs</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Hardware Allocation Matrix</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 flex-1">
            {activeChairs.map((chair) => {
              const isSterilizing = chair.state === 'STERILIZATION_LOCK';
              const isAnesthesiaHold = chair.state === 'ANESTHESIA_HOLD';
              const isOccupied = chair.state === 'OCCUPIED';

              return (
                <div
                  key={chair.chair_code}
                  className={`p-5 rounded-[24px] border transition-all duration-300 flex flex-col justify-between ${
                    isSterilizing
                      ? 'glass-panel border-amber-500/30'
                      : isAnesthesiaHold
                      ? 'glass-panel border-cyan-500/30'
                      : isOccupied
                      ? 'glass-panel border-emerald-500/30'
                      : 'glass-panel-nested border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-extrabold text-white tracking-tight">{chair.chair_code}</span>
                        {isSterilizing && (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded-full uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> UV & Autoclave Sterilization
                          </span>
                        )}
                        {isAnesthesiaHold && (
                          <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold text-[10px] rounded-full uppercase tracking-wider border border-cyan-500/30">
                            💉 Anesthesia Latency Hold
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-medium">{chair.doctor_name}</div>
                    </div>

                    {isOccupied && chair.active_token && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Serving Now</span>
                        <div className="text-2xl font-mono font-black text-emerald-300 tabular-nums">
                          {chair.active_token}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sterilization Animated Progress Bar */}
                  {isSterilizing && chair.unlocks_in_secs && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-200 mb-1.5">
                        <span>Autoclave Class B Disinfection Cycle</span>
                        <span className="font-mono tabular-nums">{Math.ceil(chair.unlocks_in_secs / 60)} mins remaining</span>
                      </div>
                      <div className="w-full bg-[#111318] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(5, (chair.unlocks_in_secs / 600) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Anesthesia Hold Latency */}
                  {isAnesthesiaHold && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-cyan-200">
                      <span>Resting in Numbing Lounge (Operatory freed for short visit)</span>
                      <span className="font-mono bg-[#111318] px-3 py-1 rounded-xl border border-cyan-500/30 tabular-nums">
                        Ready in ~{chair.anesthesia_mins_left || 5} mins
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 40% Panel: Next Waiting Tokens */}
        <div className="col-span-5 glass-panel rounded-[28px] p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Next Up in Line</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Allocated Seats</span>
            </div>

            <div className="space-y-2.5">
              {waitingTokens.map((item, idx) => (
                <div
                  key={item.token_display}
                  className={`p-3.5 rounded-[18px] border flex items-center justify-between transition-all ${
                    idx === 0
                      ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                      : 'glass-panel-nested border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-12 h-10 rounded-xl flex items-center justify-center font-mono font-black text-base border tabular-nums ${
                        idx === 0
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-[#111318] text-emerald-300 border-white/[0.08]'
                      }`}
                    >
                      {item.token_display}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{item.patient_name}</span>
                        {item.category === 'EMERGENCY' && (
                          <span className="px-2 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Armchair className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-300">Seat {item.seat_code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Est. Wait</span>
                    <div className="text-sm font-mono font-bold text-amber-300 tabular-nums">~{item.est_wait_mins} mins</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code Check-in Callout Card */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between glass-panel-nested p-4 rounded-[18px] border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Track on your phone (Zero-App)</div>
                <div className="text-[11px] text-slate-400">Scan QR at reception to track live queue sequence</div>
              </div>
            </div>
            <span className="font-mono text-xs text-emerald-300 glass-pill px-3 py-1">
              smartopd.in/q/demo
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Hygiene & Crowd Ticker */}
      <footer className="glass-panel border-x-0 border-b-0 rounded-none backdrop-blur-xl px-8 py-3 flex items-center justify-between text-xs text-slate-300 relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Autoclave Class B Vacuum Sterilization (EN 13060) Active</span>
          </div>
          <div className="flex items-center gap-2 text-teal-300 font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Operatories UV Disinfected Between Procedures</span>
          </div>
        </div>

        <div className="text-slate-400 font-medium">
          Peak Crowd Policy: Kindly limit to 1 attendant per patient in the waiting lobby.
        </div>
      </footer>
    </div>
  );
}

export default function WaitingRoomTvPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0C0E] text-white p-8">Loading Smart TV Display...</div>}>
      <WaitingRoomTvContent />
    </Suspense>
  );
}
