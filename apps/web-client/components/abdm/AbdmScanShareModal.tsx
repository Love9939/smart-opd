'use client';

import React, { useState } from 'react';
import { QrCode, ShieldCheck, Check, Sparkles, User, RefreshCw, Smartphone } from 'lucide-react';

interface AbdmScanShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileScanned: (profile: {
    fullName: string;
    abhaAddress: string;
    age: number;
    gender: string;
    phone: string;
    dpdpConsentTimestamp: string;
  }) => void;
}

export const AbdmScanShareModal: React.FC<AbdmScanShareModalProps> = ({
  isOpen,
  onClose,
  onProfileScanned,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDemoProfile, setSelectedDemoProfile] = useState<'senior' | 'pediatric' | 'general'>('senior');

  if (!isOpen) return null;

  const demoProfiles = {
    senior: {
      fullName: 'Savitri Bai Deshmukh',
      abhaAddress: 'savitri.deshmukh@abdm',
      age: 72,
      gender: 'Female',
      phone: '9845012345',
      dpdpConsentTimestamp: new Date().toISOString(),
    },
    pediatric: {
      fullName: 'Aarav Patel (Child of Neha Patel)',
      abhaAddress: 'aarav.patel@abdm',
      age: 8,
      gender: 'Male',
      phone: '9822098765',
      dpdpConsentTimestamp: new Date().toISOString(),
    },
    general: {
      fullName: 'Dr. Vikramaditya Seth',
      abhaAddress: 'vikram.seth@abdm',
      age: 46,
      gender: 'Male',
      phone: '9876543210',
      dpdpConsentTimestamp: new Date().toISOString(),
    },
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const profile = demoProfiles[selectedDemoProfile];
      onProfileScanned(profile);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between mb-5 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-emerald-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-xs text-white">
                ABHA
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>ABDM Scan & Share (M1)</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Government Certified
                </span>
              </h3>
              <p className="text-xs text-slate-400">Scan QR via ABHA / Aarogya Setu for Instant Demographic Sync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* Dynamic ABDM QR Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center mb-5">
          {/* SVG Representation of Counter QR */}
          <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center relative mb-3">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Corner position markers */}
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="13" y="13" width="10" height="10" fill="#06b6d4" />

              <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="77" y="13" width="10" height="10" fill="#06b6d4" />

              <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="13" y="77" width="10" height="10" fill="#06b6d4" />

              {/* Data blocks */}
              <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="46" y="8" width="8" height="6" fill="#0f172a" />
              <rect x="58" y="14" width="6" height="8" fill="#0f172a" />
              <rect x="36" y="24" width="14" height="6" fill="#0f172a" />
              <rect x="8" y="36" width="6" height="12" fill="#0f172a" />
              <rect x="20" y="44" width="8" height="8" fill="#0f172a" />
              <rect x="34" y="38" width="28" height="28" rx="4" fill="#0f172a" />
              <circle cx="48" cy="52" r="6" fill="#14b8a6" />
              <rect x="70" y="40" width="14" height="8" fill="#0f172a" />
              <rect x="80" y="56" width="12" height="6" fill="#0f172a" />
              <rect x="38" y="74" width="8" height="16" fill="#0f172a" />
              <rect x="52" y="70" width="14" height="8" fill="#0f172a" />
              <rect x="72" y="74" width="18" height="18" fill="#0f172a" />
            </svg>
          </div>

          <span className="font-mono text-xs font-bold text-cyan-300">HIP ID: IN291000129 • SmartOPD Counter 01</span>
          <p className="text-[11px] text-slate-400 mt-1">
            Patients open ABHA or Aarogya Setu app &gt; Tap 'Scan QR' &gt; Share Profile
          </p>
        </div>

        {/* Demo Fast-Switch Profile Selector */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-300 mb-2">Simulate Patient Scan With Profile:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedDemoProfile('senior')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedDemoProfile === 'senior'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">Savitri Bai (72y)</div>
              <div className="text-[10px] opacity-75">Elderly Priority P-01</div>
            </button>
            <button
              onClick={() => setSelectedDemoProfile('general')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedDemoProfile === 'general'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">Dr. Vikram (46y)</div>
              <div className="text-[10px] opacity-75">Standard Walk-In</div>
            </button>
            <button
              onClick={() => setSelectedDemoProfile('pediatric')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedDemoProfile === 'pediatric'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">Aarav (8y)</div>
              <div className="text-[10px] opacity-75">Pediatric Dental</div>
            </button>
          </div>
        </div>

        {/* DPDP Act 2023 Digital Consent Notice */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 mb-5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Indian DPDP Act 2023 Compliant: Demographic data shared under explicit patient consent audit.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            <span>{isScanning ? 'Syncing ABHA Profile...' : 'Simulate ABHA Scan & Sync'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
