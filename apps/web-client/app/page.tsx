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
  Clock,
  Lock,
  PackageCheck,
  ChevronRight,
  Plus,
} from 'lucide-react';

export default function Home() {
  const clinicId = '8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f';
  const sessionId = 'a1111111-2222-3333-4444-555555555555';

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#33332e] font-sans selection:bg-[#e60023] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation Bar (Pinterest Style: Clean White, 1px Hairline, 24px Radius) */}
        <header className="bg-white border border-[#dadad3] rounded-3xl px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fee2e2] flex items-center justify-center text-[#e60023] font-bold text-base shadow-sm">
              SO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#000000]">SmartOPD & DentalFlow</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f6f6f3] text-[#33332e] border border-[#dadad3] uppercase">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-[#62625b]">Deterministic Next.js App Router &amp; Rust Tokio Core</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#c7f0da] border border-[#a3e6c2] px-3 py-1.5 rounded-full text-xs font-bold text-[#103c25]">
              <span className="w-2 h-2 rounded-full bg-[#103c25] animate-pulse" />
              <span className="font-mono tabular-nums">24/24 Rust Tests Passed</span>
            </div>

            <div className="flex items-center gap-2 bg-[#f6f6f3] border border-[#dadad3] px-3 py-1.5 rounded-full text-xs text-[#33332e] font-medium">
              <Cpu className="w-3.5 h-3.5 text-[#e60023]" />
              <span className="font-mono tabular-nums font-bold text-[#000000]">&lt;5ms WS Fanout</span>
            </div>
          </div>
        </header>

        {/* Hero Section (Pinterest Style 32px Radius Canvas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Hero Left (7 Cols): Editorial Statement & Architectural Mandate */}
          <div className="lg:col-span-7 bg-white border border-[#dadad3] rounded-[32px] p-8 sm:p-10 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fee2e2] text-[#cc001f] text-xs font-bold mb-5 border border-[#fecaca]">
                <Sparkles className="w-3.5 h-3.5 text-[#e60023]" />
                <span>Zero-Typing Clinical Physics Engine</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12] text-[#000000]">
                Clinical Cockpit for General OPD &amp; Dental Practices.
              </h1>

              <p className="mt-5 text-sm sm:text-base text-[#62625b] font-normal leading-relaxed max-w-xl">
                Eliminates waiting room chaos with deterministic queue state machines, physical seat graphs,
                local anesthesia timer holds, autoclave sterilization locks, and Indian ABDM M1 compliance.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#dadad3] grid grid-cols-3 gap-3.5">
              <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-4">
                <div className="text-[11px] text-[#62625b] font-medium mb-1">State Machine</div>
                <div className="text-2xl font-bold tracking-tight text-[#000000] font-mono tabular-nums">0%</div>
                <div className="text-[10px] text-[#103c25] font-bold mt-0.5">Race-Condition Free</div>
              </div>

              <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-4">
                <div className="text-[11px] text-[#62625b] font-medium mb-1">Audit Ledger</div>
                <div className="text-2xl font-bold tracking-tight text-[#000000] font-mono tabular-nums">100%</div>
                <div className="text-[10px] text-[#103c25] font-bold mt-0.5">Append-Only Immutability</div>
              </div>

              <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-4">
                <div className="text-[11px] text-[#62625b] font-medium mb-1">Thermal Printer</div>
                <div className="text-2xl font-bold tracking-tight text-[#000000] font-mono tabular-nums">58mm</div>
                <div className="text-[10px] text-[#e60023] font-bold mt-0.5">Web Bluetooth ESC/POS</div>
              </div>
            </div>
          </div>

          {/* Hero Right (5 Cols): Live Engine Metrics & Circular Progress Gauge */}
          <div className="lg:col-span-5 bg-white border border-[#dadad3] rounded-[32px] p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#62625b]">
                  Live Clinic Simulation
                </span>
                <span className="bg-[#c7f0da] border border-[#a3e6c2] text-[#103c25] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  ACTIVE SESSION
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold tracking-tight text-[#000000] font-mono tabular-nums">
                  94.2%
                </span>
                <span className="text-xs text-[#62625b] font-bold">On-Time Clinic Velocity</span>
              </div>

              <p className="text-xs text-[#62625b] leading-relaxed">
                Dynamically interleaving acute emergencies, 15-minute numbing pauses, and diagnostic lab returns.
              </p>
            </div>

            {/* Circular Gauge and Split Metrics */}
            <div className="my-6 bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div>
                  <div className="text-[11px] text-[#62625b] font-medium">Physical Lobby Seats</div>
                  <div className="text-sm font-bold text-[#000000] font-mono tabular-nums">7 / 8 Occupied (87%)</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#62625b] font-medium">Sterilization Lock</div>
                  <div className="text-sm font-bold text-[#e60023] font-mono tabular-nums">Chair 1 • 08:24 mins</div>
                </div>
              </div>

              {/* Radial SVG Gauge with rounded caps */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#dadad3]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#e60023]"
                    strokeDasharray="87, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute font-mono text-xs font-bold text-[#000000]">87%</div>
              </div>
            </div>

            <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-[#33332e]">
              <span className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#103c25]" />
                <span>ABDM M1 Scan &amp; Share Ready</span>
              </span>
              <span className="font-mono text-[#62625b] text-[11px] font-bold">HFR Verified</span>
            </div>
          </div>
        </div>

        {/* The 4 Role-Based Portals (Asymmetric 60/40 Bento Grid) */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#000000]">Clinical Portals &amp; Live Consoles</h2>
              <p className="text-xs text-[#62625b]">Deep-dive into each specialized operational interface</p>
            </div>
            <span className="bg-[#f6f6f3] border border-[#dadad3] px-3 py-1 rounded-full text-xs text-[#33332e] font-mono font-medium">
              Clinic: {clinicId.slice(0, 8)}...
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Bento Card 1: Reception Desk POS (7 Cols) */}
            <Link
              href={`/desk/${clinicId}`}
              className="md:col-span-7 bg-white border border-[#dadad3] rounded-[32px] p-8 group hover:border-[#000000] transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#e60023] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#f6f6f3] text-[#62625b] border border-[#dadad3]">
                    PORTAL 01 • DESK POS
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#000000] tracking-tight group-hover:text-[#e60023] transition-colors">
                  Front-Desk Reception Console
                </h3>

                <p className="mt-2 text-xs text-[#62625b] leading-relaxed max-w-lg">
                  Keyboard-first fast check-in (F1–F4), real-time physical seat grid allocation (P-01 to A-04), family
                  cluster grouping (#14A, #14B), prosthodontic lab delivery gates, and immutable cash pilferage shields.
                </p>

                {/* Micro Preview Pills */}
                <div className="mt-6 grid grid-cols-3 gap-2.5">
                  <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-[#62625b] font-medium">Seat Map</div>
                    <div className="text-xs font-bold text-[#000000] mt-0.5">8 Live Seats</div>
                  </div>
                  <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-[#62625b] font-medium">Lab Orders</div>
                    <div className="text-xs font-bold text-[#e60023] mt-0.5">QC Gate Active</div>
                  </div>
                  <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-[#62625b] font-medium">Printer</div>
                    <div className="text-xs font-bold text-[#103c25] mt-0.5">58mm Thermal</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#dadad3] flex items-center justify-between text-xs font-bold text-[#e60023]">
                <span>Launch Reception Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Bento Card 2: Waiting Room Smart TV (5 Cols) */}
            <Link
              href={`/tv/${clinicId}`}
              className="md:col-span-5 bg-white border border-[#dadad3] rounded-[32px] p-8 group hover:border-[#000000] transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#e60023] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Tv className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#f6f6f3] text-[#62625b] border border-[#dadad3]">
                    PORTAL 02 • SMART TV
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#000000] tracking-tight group-hover:text-[#e60023] transition-colors">
                  Waiting Room 1080p Smart TV
                </h3>

                <p className="mt-2 text-xs text-[#62625b] leading-relaxed">
                  Lobby broadcast with Web Speech API multi-lingual voice announcements (EN, HI, KN), dual-tone hospital
                  chime, live UV &amp; autoclave sterilization countdowns, and peak-crowd attendant notifications.
                </p>

                <div className="mt-6 bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-3 flex items-center justify-between text-xs">
                  <span className="text-[#62625b] font-medium">Current Calling</span>
                  <span className="font-mono font-bold text-[#000000] bg-white border border-[#dadad3] px-2.5 py-1 rounded-xl">
                    Token D-07 • Ramesh K.
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#dadad3] flex items-center justify-between text-xs font-bold text-[#e60023]">
                <span>Launch Smart TV Display</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Bento Card 3: Doctor Mobile Cockpit (6 Cols) */}
            <Link
              href={`/mobile/${sessionId}`}
              className="md:col-span-6 bg-white border border-[#dadad3] rounded-[32px] p-8 group hover:border-[#000000] transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#e60023] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#f6f6f3] text-[#62625b] border border-[#dadad3]">
                    PORTAL 03 • 1-THUMB PWA
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#000000] tracking-tight group-hover:text-[#e60023] transition-colors">
                  Doctor &amp; Dentist Mobile Cockpit
                </h3>

                <p className="mt-2 text-xs text-[#62625b] leading-relaxed">
                  1-Thumb mobile web application: Dynamic mode toggle between High-Velocity GP and Multi-Chair Dental,
                  interactive 32-tooth SVG FDI odontogram, 1-tap CamRx camera scanner, pediatric pre-med hold, and DPDP
                  e-signatures.
                </p>

                <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-3 py-1 rounded-full bg-[#f6f6f3] border border-[#dadad3] text-[#33332e] font-medium">FDI Odontogram</span>
                  <span className="px-3 py-1 rounded-full bg-[#f6f6f3] border border-[#dadad3] text-[#33332e] font-medium">1-Tap CamRx</span>
                  <span className="px-3 py-1 rounded-full bg-[#f6f6f3] border border-[#dadad3] text-[#33332e] font-medium">LA Numbing Hold (15m)</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#dadad3] flex items-center justify-between text-xs font-bold text-[#e60023]">
                <span>Open Doctor Mobile Cockpit</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Bento Card 4: Zero-App Patient Live Tracker (6 Cols) */}
            <Link
              href="/q/apollo-clinic"
              className="md:col-span-6 bg-white border border-[#dadad3] rounded-[32px] p-8 group hover:border-[#000000] transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#e60023] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#f6f6f3] text-[#62625b] border border-[#dadad3]">
                    PORTAL 04 • ZERO-APP QR
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#000000] tracking-tight group-hover:text-[#e60023] transition-colors">
                  Zero-App Patient Live Tracker
                </h3>

                <p className="mt-2 text-xs text-[#62625b] leading-relaxed">
                  Instant mobile browser check-in without downloading an app. Displays live token countdown, assigned
                  waiting room seat, real-time Estimated Wait Time (EWT), and milestone installment receipts.
                </p>

                <div className="mt-6 bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-3 flex items-center justify-between text-xs">
                  <span className="text-[#62625b] font-medium">Sample Queue</span>
                  <span className="font-mono font-bold text-[#e60023]">Token A-14 • 2 Ahead (~12m wait)</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#dadad3] flex items-center justify-between text-xs font-bold text-[#e60023]">
                <span>Open Patient Live Tracker</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom Technical Architecture Footer */}
        <footer className="bg-white border border-[#dadad3] rounded-3xl px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#62625b] shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#33332e] font-semibold">
              <Lock className="w-3.5 h-3.5 text-[#103c25]" />
              PostgreSQL 16 Append-Only Audit Trigger
            </span>
            <span className="hidden sm:inline text-[#dadad3]">•</span>
            <span className="hidden sm:inline text-[#62625b]">
              ABDM Scan &amp; Share (M1) &amp; DPDP Act 2023 Compliant
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#62625b] font-mono font-medium">Next.js 16 + Rust 1.80 Axum</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
