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
      doctor_name: 'Supervised Hold Area',
      specialty: 'Local Anesthesia Latency',
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
    }
  }, [lastEvent, ttsAudioEnabled]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between overflow-hidden select-none">
      {/* 1080p TV Header Bar */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-cyan-500/25">
            SO
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>SmartOPD & DentalFlow</span>
              <span className="text-xs font-mono font-bold bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/40">
                LOBBY SMART TV
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Multi-Operatory Live Status • Dr. Sneha Rao (Dentistry) & Dr. Arjun Reddy (Physician)
            </p>
          </div>
        </div>

        {/* TTS Sound Toggle & Clock */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setTtsAudioEnabled((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              ttsAudioEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {ttsAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{ttsAudioEnabled ? 'Voice Announcements ON' : 'Tap to Enable TV Audio'}</span>
          </button>

          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>LIVE SYNC</span>
          </div>
        </div>
      </header>

      {/* High-Visibility Live Call Banner (When Token is Called) */}
      {currentCallBanner && (
        <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 px-8 py-3.5 shadow-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-5">
            <div className="bg-slate-950 text-cyan-300 font-mono text-3xl font-black px-4 py-1.5 rounded-xl border-2 border-cyan-400 shadow-xl">
              {currentCallBanner.token}
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold text-cyan-100 tracking-wider">NOW CALLING PATIENT</span>
              <div className="text-2xl font-black text-white">{currentCallBanner.patient}</div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-extrabold text-cyan-100 tracking-wider">PROCEED TO</span>
            <div className="text-2xl font-black text-amber-200 bg-slate-950/60 px-4 py-1 rounded-xl border border-amber-300/40">
              👉 {currentCallBanner.chair}
            </div>
          </div>
        </div>
      )}

      {/* Main TV Screen: 60% Left Operatories / 40% Right Waiting Queue */}
      <div className="flex-1 p-8 grid grid-cols-12 gap-8 items-stretch">
        {/* Left 60% Panel: Active Cabins & Dental Chairs */}
        <div className="col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-lg font-black text-slate-200 tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Active Consultation Cabins & Operatory Chairs</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Real-time Clinical Matrix</span>
          </div>

          <div className="grid grid-cols-1 gap-4 flex-1">
            {activeChairs.map((chair) => {
              const isSterilizing = chair.state === 'STERILIZATION_LOCK';
              const isAnesthesiaHold = chair.state === 'ANESTHESIA_HOLD';
              const isOccupied = chair.state === 'OCCUPIED';

              return (
                <div
                  key={chair.chair_code}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isSterilizing
                      ? 'bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-500/50 shadow-lg shadow-purple-500/10'
                      : isAnesthesiaHold
                      ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : isOccupied
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg font-black text-white">{chair.chair_code}</span>
                        {isSterilizing && (
                          <span className="px-2.5 py-0.5 bg-purple-500 text-white font-black text-[10px] rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> UV & Autoclave Sterilization
                          </span>
                        )}
                        {isAnesthesiaHold && (
                          <span className="px-2.5 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded-full uppercase tracking-wider animate-pulse">
                            💉 Anesthesia Numbing Hold
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{chair.doctor_name}</div>
                    </div>

                    {isOccupied && chair.active_token && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Currently Serving</span>
                        <div className="text-2xl font-mono font-black text-cyan-300">{chair.active_token}</div>
                      </div>
                    )}
                  </div>

                  {/* Sterilization Animated Progress Bar */}
                  {isSterilizing && chair.unlocks_in_secs && (
                    <div className="mt-4 pt-3 border-t border-purple-500/30">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-200 mb-1.5">
                        <span>Autoclave Disinfection Cycle in Progress</span>
                        <span className="font-mono">{Math.ceil(chair.unlocks_in_secs / 60)} mins remaining</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-purple-500/40">
                        <div
                          className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(5, (chair.unlocks_in_secs / 600) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Anesthesia Hold Latency */}
                  {isAnesthesiaHold && (
                    <div className="mt-4 pt-3 border-t border-indigo-500/30 flex items-center justify-between text-xs font-semibold text-indigo-200">
                      <span>Patient resting in Numbing Lounge (Chair freed for short procedures)</span>
                      <span className="font-mono bg-indigo-900/60 px-3 py-1 rounded-lg border border-indigo-500/40">
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
        <div className="col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-black text-white">Next Up in Line</h2>
              </div>
              <span className="text-xs font-mono text-teal-400">Assigned Physical Seats</span>
            </div>

            <div className="space-y-3">
              {waitingTokens.map((item, idx) => (
                <div
                  key={item.token_display}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    idx === 0
                      ? 'bg-teal-500/15 border-teal-500/50 shadow-lg shadow-teal-500/10'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-14 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl border ${
                        idx === 0
                          ? 'bg-teal-500 text-slate-950 border-teal-300 shadow-md'
                          : 'bg-slate-900 text-cyan-300 border-slate-700'
                      }`}
                    >
                      {item.token_display}
                    </span>
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        <span>{item.patient_name}</span>
                        {item.category === 'EMERGENCY' && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-bounce">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Armchair className="w-3.5 h-3.5 text-teal-400" />
                        <span className="font-semibold text-slate-300">Seat {item.seat_code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Est. Wait</span>
                    <div className="text-base font-mono font-bold text-amber-300">~{item.est_wait_mins} mins</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code Check-in callout */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <QrCode className="w-10 h-10 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-white">Track on your phone (Zero-App)</div>
                <div className="text-[11px] text-slate-400">Scan QR at reception to track live queue position</div>
              </div>
            </div>
            <span className="font-mono text-xs text-cyan-300 bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-800">
              smartopd.in/q/demo
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Hygiene & Crowd Ticker */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-8 py-3 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Autoclave Class B (EN 13060) 134°C Vacuum Sterilization Active</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Operatories UV Sanitized Between Procedures</span>
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Loading Smart TV Display...</div>}>
      <WaitingRoomTvContent />
    </Suspense>
  );
}
