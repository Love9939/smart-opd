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
} from 'lucide-react';

export default function Home() {
  const clinicId = '8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f';
  const sessionId = 'a1111111-2222-3333-4444-555555555555';

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F4F4F5] font-sans relative overflow-hidden selection:bg-[#10B981] selection:text-[#0B0C0E]">
      {/* Ambient Depth Orbs (Refracted through translucent frosted glass) */}
      <div
        className="ambient-glow w-[580px] h-[580px] -top-32 -left-24 bg-[#10B981]/12"
        style={{ filter: 'blur(100px)' }}
      />
      <div
        className="ambient-glow w-[640px] h-[640px] top-48 -right-36 bg-[#FF6B00]/10"
        style={{ filter: 'blur(110px)' }}
      />
      <div
        className="ambient-glow w-[500px] h-[500px] bottom-0 left-1/3 bg-[#3B82F6]/08"
        style={{ filter: 'blur(100px)' }}
      />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-8">
        {/* Navigation Bar */}
        <header className="glass-panel px-6 py-4 flex items-center justify-between border-t border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] font-bold text-base shadow-sm">
              SO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">SmartOPD & DentalFlow</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-white/06 text-stone-300 border border-white/10 uppercase">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Deterministic Next.js App Router & Rust Tokio Core</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 glass-pill px-3 py-1.5 text-xs text-stone-300">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono tabular-nums text-stone-200">24/24 Rust Tests</span>
            </div>

            <div className="flex items-center gap-2 glass-pill px-3 py-1.5 text-xs text-stone-300">
              <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="font-mono tabular-nums text-stone-200">&lt;5ms WS Fanout</span>
            </div>
          </div>
        </header>

        {/* Hero Asymmetric Bento Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Hero Left (7 Cols): Editorial Statement & Architectural Mandate */}
          <div className="lg:col-span-7 glass-panel p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="inline-flex items-center gap-2 glass-pill px-3.5 py-1.5 text-xs font-medium text-stone-300 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Zero-Typing Clinical Physics Engine</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-white">
                Human-Crafted Clinical Cockpit for General OPD & Dental Practices.
              </h1>

              <p className="mt-5 text-sm sm:text-base text-stone-400 font-normal leading-relaxed max-w-xl">
                Bridging the gap between 3-minute walk-in physician consultations and 60-minute multi-sitting dental
                operatories. Equipped with physical lobby seat graphs, local anesthesia holds, autoclave turnover locks,
                and Indian DPDP/ABDM compliance.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/08 grid grid-cols-3 gap-4">
              <div className="glass-panel-nested p-4">
                <div className="text-[11px] text-stone-400 font-medium mb-1">State Machine</div>
                <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">0%</div>
                <div className="text-[10px] text-[#10B981] font-medium mt-0.5">Race-Condition Free</div>
              </div>

              <div className="glass-panel-nested p-4">
                <div className="text-[11px] text-stone-400 font-medium mb-1">Audit Ledger</div>
                <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">100%</div>
                <div className="text-[10px] text-[#10B981] font-medium mt-0.5">Append-Only Immutability</div>
              </div>

              <div className="glass-panel-nested p-4">
                <div className="text-[11px] text-stone-400 font-medium mb-1">Offline Cache</div>
                <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">58mm</div>
                <div className="text-[10px] text-[#10B981] font-medium mt-0.5">Web Bluetooth ESC/POS</div>
              </div>
            </div>
          </div>

          {/* Hero Right (5 Cols): Live Engine Metrics & Circular Progress Gauge */}
          <div className="lg:col-span-5 glass-panel p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Live Clinic Simulation
                </span>
                <span className="glass-pill px-2.5 py-0.5 text-[10px] font-mono text-[#10B981] font-bold">
                  ACTIVE SESSION
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold tracking-[-0.03em] text-white font-mono tabular-nums">
                  94.2%
                </span>
                <span className="text-xs text-stone-400 font-medium">On-Time Clinic Velocity</span>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                Dynamically interleaving acute emergencies, 15-minute numbing pauses, and diagnostic lab returns.
              </p>
            </div>

            {/* Circular Gauge and Split Metrics */}
            <div className="my-6 glass-panel-nested p-5 flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div>
                  <div className="text-[11px] text-stone-400">Physical Lobby Seats</div>
                  <div className="text-sm font-bold text-white font-mono tabular-nums">7 / 8 Occupied (87%)</div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-400">Sterilization Lock</div>
                  <div className="text-sm font-bold text-[#FF6B00] font-mono tabular-nums">Chair 1 • 08:24 mins</div>
                </div>
              </div>

              {/* Radial SVG Gauge with rounded caps */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#10B981]"
                    strokeDasharray="87, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute font-mono text-xs font-bold text-white">87%</div>
              </div>
            </div>

            <div className="glass-pill px-4 py-3 flex items-center justify-between text-xs text-stone-300">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>ABDM M1 Scan &amp; Share Ready</span>
              </span>
              <span className="font-mono text-stone-400 text-[11px]">HFR Verified</span>
            </div>
          </div>
        </div>

        {/* The 4 Role-Based Portals (Asymmetric 60/40 Bento Grid) */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Clinical Portals &amp; Live Consoles</h2>
              <p className="text-xs text-stone-400">Deep-dive into each specialized operational interface</p>
            </div>
            <span className="glass-pill px-3 py-1 text-xs text-stone-300 font-mono">
              Clinic: {clinicId.slice(0, 8)}...
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Bento Card 1: Reception Desk POS (Full 7 Cols) */}
            <Link
              href={`/desk/${clinicId}`}
              className="md:col-span-7 glass-panel p-8 group hover:border-[#10B981]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="glass-pill px-3 py-1 text-[10px] font-mono font-bold text-stone-400">
                    PORTAL 01 • DESK POS
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#10B981] transition-colors">
                  Front-Desk Reception Console
                </h3>

                <p className="mt-2 text-xs text-stone-400 leading-relaxed max-w-lg">
                  Keyboard-first fast check-in (F1–F4), real-time physical seat grid allocation (P-01 to A-04), family
                  cluster grouping (#14A, #14B), prosthodontic lab delivery gates, and immutable cash pilferage shields.
                </p>

                {/* Micro Preview Pills */}
                <div className="mt-6 grid grid-cols-3 gap-2.5">
                  <div className="glass-panel-nested p-2.5 text-center">
                    <div className="text-[10px] text-stone-400">Seat Map</div>
                    <div className="text-xs font-bold text-white mt-0.5">8 Live Seats</div>
                  </div>
                  <div className="glass-panel-nested p-2.5 text-center">
                    <div className="text-[10px] text-stone-400">Lab Orders</div>
                    <div className="text-xs font-bold text-[#FF6B00] mt-0.5">QC Gate Active</div>
                  </div>
                  <div className="glass-panel-nested p-2.5 text-center">
                    <div className="text-[10px] text-stone-400">Printer</div>
                    <div className="text-xs font-bold text-[#10B981] mt-0.5">58mm Thermal</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/08 flex items-center justify-between text-xs font-semibold text-[#10B981]">
                <span>Launch Reception Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Bento Card 2: Waiting Room Smart TV (5 Cols) */}
            <Link
              href={`/tv/${clinicId}`}
              className="md:col-span-5 glass-panel p-8 group hover:border-[#3B82F6]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Tv className="w-6 h-6" />
                  </div>
                  <span className="glass-pill px-3 py-1 text-[10px] font-mono font-bold text-stone-400">
                    PORTAL 02 • SMART TV
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#3B82F6] transition-colors">
                  Waiting Room 1080p Smart TV
                </h3>

                <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                  Lobby broadcast with Web Speech API multi-lingual voice announcements (EN, HI, KN), dual-tone hospital
                  chime, live UV &amp; autoclave sterilization countdowns, and peak-crowd attendant notifications.
                </p>

                <div className="mt-6 glass-panel-nested p-3 flex items-center justify-between text-xs">
                  <span className="text-stone-400">Current Calling</span>
                  <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                    Token D-07 • Ramesh K.
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/08 flex items-center justify-between text-xs font-semibold text-[#3B82F6]">
                <span>Launch Smart TV Display</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Bento Card 3: Doctor Mobile Cockpit (6 Cols) */}
            <Link
              href={`/mobile/${sessionId}`}
              className="md:col-span-6 glass-panel p-8 group hover:border-[#10B981]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="glass-pill px-3 py-1 text-[10px] font-mono font-bold text-stone-400">
                    PORTAL 03 • 1-THUMB PWA
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#10B981] transition-colors">
                  Doctor &amp; Dentist Mobile Cockpit
                </h3>

                <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                  1-Thumb mobile web application: Dynamic mode toggle between High-Velocity GP and Multi-Chair Dental,
                  interactive 32-tooth SVG FDI odontogram, 1-tap CamRx camera scanner, pediatric pre-med hold, and DPDP
                  e-signatures.
                </p>

                <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
                  <span className="glass-pill px-2.5 py-1 text-stone-300">FDI Odontogram</span>
                  <span className="glass-pill px-2.5 py-1 text-stone-300">1-Tap CamRx</span>
                  <span className="glass-pill px-2.5 py-1 text-stone-300">LA Numbing Hold (15m)</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/08 flex items-center justify-between text-xs font-semibold text-[#10B981]">
                <span>Open Doctor Mobile Cockpit</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>

            {/* Bento Card 4: Zero-App Patient Live Tracker (6 Cols) */}
            <Link
              href="/q/apollo-clinic"
              className="md:col-span-6 glass-panel p-8 group hover:border-[#FF6B00]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="glass-pill px-3 py-1 text-[10px] font-mono font-bold text-stone-400">
                    PORTAL 04 • ZERO-APP QR
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#FF6B00] transition-colors">
                  Zero-App Patient Live Tracker
                </h3>

                <p className="mt-2 text-xs text-stone-400 leading-relaxed">
                  Instant mobile browser check-in without downloading an app. Displays live token countdown, assigned
                  waiting room seat, real-time Estimated Wait Time (EWT), and milestone installment receipts.
                </p>

                <div className="mt-6 glass-panel-nested p-3 flex items-center justify-between text-xs">
                  <span className="text-stone-400">Sample Queue</span>
                  <span className="font-mono font-bold text-[#FF6B00]">Token A-14 • 2 Ahead (~12m wait)</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/08 flex items-center justify-between text-xs font-semibold text-[#FF6B00]">
                <span>Open Patient Live Tracker</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom Technical Architecture Footer */}
        <footer className="glass-panel px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-400 border-t border-white/10">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-stone-300 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#10B981]" />
              PostgreSQL 16 Append-Only Audit Trigger
            </span>
            <span className="hidden sm:inline text-stone-600">•</span>
            <span className="hidden sm:inline text-stone-400">
              ABDM Scan &amp; Share (M1) &amp; DPDP Act 2023 Compliant
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-stone-500 font-mono">Next.js 16 + Rust 1.80 Axum</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
