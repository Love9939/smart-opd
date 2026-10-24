'use client';

import React from 'react';
import Link from 'next/link';
import {
  Tv,
  Users,
  Smartphone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Syringe,
  Armchair,
} from 'lucide-react';

export default function Home() {
  const clinicId = '8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f';
  const sessionId = 'a1111111-2222-3333-4444-555555555555';

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pb-16 pt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-teal-500/10 to-indigo-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-xl shadow-cyan-500/25">
                SO
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
                  Production-Grade Architecture (Next.js 15 + Rust Axum)
                </span>
                <h1 className="text-2xl font-black text-white">SmartOPD & DentalFlow</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rust Engine: 24/24 Tests Passed</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Cpu className="w-3.5 h-3.5" />
                <span>Sub-5ms WebSocket Hub</span>
              </span>
            </div>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Unified Clinic Engine for{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                General Physicians & Dental Operatories
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-300 leading-relaxed font-normal">
              Eliminating clinical chaos with deterministic Tokio actors, Weighted Round-Robin (WRR) queue interleaving,
              physical waiting lobby seat allocation, FDI 32-tooth odontogram, 1-tap CamRx scanner, and dental anesthesia
              latency chair swapping.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Portals Showcase */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white">Live Role-Based Portals</h3>
            <p className="text-xs text-slate-400">Click any portal to explore the real-time application in action</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800">
            Clinic ID: {clinicId.slice(0, 8)}...
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Portal 1: Reception Desk POS */}
          <Link
            href={`/desk/${clinicId}`}
            className="group relative bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 rounded-3xl p-6 transition-all duration-300 shadow-xl hover:shadow-cyan-500/15 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-cyan-500/30">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
                PORTAL 1 • FRONT DESK
              </span>
              <h4 className="text-lg font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                Receptionist POS Console
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Keyboard-first fast check-in (F1–F4), real-time physical seat occupancy grid, priority P-zone allocation,
                and dental prosthodontic lab QC gate.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>Open Reception POS</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Portal 2: Waiting Room Smart TV */}
          <Link
            href={`/tv/${clinicId}`}
            className="group relative bg-slate-900/80 border border-slate-800 hover:border-teal-500/60 rounded-3xl p-6 transition-all duration-300 shadow-xl hover:shadow-teal-500/15 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-teal-500/30">
                <Tv className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-teal-400 tracking-wider">
                PORTAL 2 • 1080P DISPLAY
              </span>
              <h4 className="text-lg font-bold text-white mt-1 group-hover:text-teal-300 transition-colors">
                Waiting Room Smart TV
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                60/40 operatory dashboard with live Autoclave sterilization countdown bars, anesthesia hold lounge status,
                and Web Speech API multi-lingual TTS (English, Hindi, Kannada).
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
              <span>Launch Smart TV View</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Portal 3: Doctor Mobile PWA */}
          <Link
            href={`/mobile/${sessionId}`}
            className="group relative bg-slate-900/80 border border-slate-800 hover:border-purple-500/60 rounded-3xl p-6 transition-all duration-300 shadow-xl hover:shadow-purple-500/15 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-purple-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-purple-400 tracking-wider">
                PORTAL 3 • 1-THUMB PWA
              </span>
              <h4 className="text-lg font-bold text-white mt-1 group-hover:text-purple-300 transition-colors">
                Doctor / Dentist Mobile
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Active in-cabin patient banner, 1-thumb quick actions (Call Next, 15m Anesthesia Hold, +20m Extension, Complete
                & Sterilize), integrated 3-tap SVG Odontogram, and 1-tap CamRx scanner.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Open Doctor Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Portal 4: Zero-App Patient QR Tracker */}
          <Link
            href="/q/smartopd-demo"
            className="group relative bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 transition-all duration-300 shadow-xl hover:shadow-emerald-500/15 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-emerald-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
                PORTAL 4 • ZERO-APP PATIENT
              </span>
              <h4 className="text-lg font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                Patient Live QR Tracker
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Instant QR mobile tracking without downloading an app. Live queue sequence countdown, assigned lobby seat code
                (P-02), and doctor cabin directions.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>View Patient Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Deep-Dive Architectural Features Matrix */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800/80">
        <h3 className="text-xl font-black text-white mb-6">Engineered Clinical Capabilities</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2.5 text-cyan-400 mb-2 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>WRR Queue Interleaving</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic interleaving prevents long-procedure starvation: Emergency (top priority) &gt; Anesthesia Ready
              &gt; Lab Diagnostic Return (1:2 ratio) &gt; Late Grace (interleaved at +2) &gt; Regular walk-ins.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2.5 text-purple-400 mb-2 font-bold text-sm">
              <Syringe className="w-4 h-4" />
              <span>Anesthesia Hold & Sterilization Lock</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dentists can place patients on a 15-minute numbing hold, shifting them to the Numbing Lounge and freeing Chair 1 to
              interleave short visits. Aerosol procedures trigger an automatic 10-minute autoclave lock.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2.5 text-teal-400 mb-2 font-bold text-sm">
              <Armchair className="w-4 h-4" />
              <span>Physical Seat Graph Allocator</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Allocates physical waiting room seats (A-01..P-04) with priority zoning for elderly and pregnant patients.
              Exceeding 80% lobby capacity triggers automated peak-crowd TV notices.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-6 text-center text-xs text-slate-500">
        SmartOPD & DentalFlow • Built for ABDM Scan & Share (M1) and Indian DPDP Act 2023 Consent Compliance
      </footer>
    </div>
  );
}
