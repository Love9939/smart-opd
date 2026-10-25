'use client';

import React, { useState } from 'react';
import { DentalOdontogramRecord } from '../../lib/types';
import { Sparkles, DollarSign, Activity, Check, Baby, User } from 'lucide-react';

interface FdiToothChartProps {
  patientId: string;
  records: DentalOdontogramRecord[];
  onSaveRecord?: (record: Partial<DentalOdontogramRecord>) => void;
}

const ADULT_QUADRANTS = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

const PEDIATRIC_QUADRANTS = {
  upperRight: [55, 54, 53, 52, 51],
  upperLeft: [61, 62, 63, 64, 65],
  lowerRight: [85, 84, 83, 82, 81],
  lowerLeft: [71, 72, 73, 74, 75],
};

const PATHOLOGY_OPTIONS: { code: DentalOdontogramRecord['condition_code']; label: string; color: string }[] = [
  { code: 'HEALTHY', label: 'Healthy', color: 'bg-[#c7f0da] text-emerald-300 border-[#a3e6c2]' },
  { code: 'DEEP_CARIES', label: 'Deep Caries', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { code: 'PULPITIS', label: 'Acute Pulpitis', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { code: 'ROOT_STUMP', label: 'Gross Root Stump', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { code: 'MISSING', label: 'Missing Tooth', color: 'bg-[#c8c8c1]/40 text-[#62625b] border-slate-600' },
  { code: 'RCT_TREATED', label: 'RCT Treated', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { code: 'CROWN_PRESENT', label: 'Crown Present', color: 'bg-amber-400/20 text-amber-200 border-amber-400/40' },
];

const TREATMENT_PRICING: Record<NonNullable<DentalOdontogramRecord['treatment_action']>, { label: string; cost: number }> = {
  NONE: { label: 'Observation Only', cost: 0 },
  COMPOSITE_FILLING: { label: 'Class II Composite Filling', cost: 1200 },
  RCT: { label: 'Molar Rotary RCT (3 Sittings)', cost: 4500 },
  ZIRCONIA_CROWN: { label: 'CAD/CAM Monolithic Zirconia Crown', cost: 7500 },
  EXTRACTION: { label: 'Surgical Disimpaction / Extraction', cost: 2500 },
  IMPLANT: { label: 'Titanium Dental Implant Fixture', cost: 28000 },
};

export const FdiToothChart: React.FC<FdiToothChartProps> = ({
  records,
  onSaveRecord,
}) => {
  const [isPediatric, setIsPediatric] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(36);
  const [selectedSurfaces, setSelectedSurfaces] = useState<('M' | 'O' | 'D' | 'B' | 'L')[]>(['O', 'D']);
  const [selectedCondition, setSelectedCondition] = useState<DentalOdontogramRecord['condition_code']>('PULPITIS');
  const [selectedTreatment, setSelectedTreatment] = useState<NonNullable<DentalOdontogramRecord['treatment_action']>>('RCT');
  const [notes, setNotes] = useState('Deep occlusal decay with symptomatic apical periodontitis');

  const currentToothRecord = records.find((r) => r.fdi_tooth === selectedTooth);

  const handleToothClick = (tooth: number) => {
    setSelectedTooth(tooth);
    const existing = records.find((r) => r.fdi_tooth === tooth);
    if (existing) {
      setSelectedCondition(existing.condition_code);
      setSelectedSurfaces(existing.surfaces);
      if (existing.treatment_action) setSelectedTreatment(existing.treatment_action);
      if (existing.notes) setNotes(existing.notes);
    }
  };

  const toggleSurface = (surface: 'M' | 'O' | 'D' | 'B' | 'L') => {
    setSelectedSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface]
    );
  };

  const handleSave = () => {
    if (!selectedTooth) return;
    const estCost = TREATMENT_PRICING[selectedTreatment]?.cost || 0;
    if (onSaveRecord) {
      onSaveRecord({
        fdi_tooth: selectedTooth,
        condition_code: selectedCondition,
        surfaces: selectedSurfaces,
        treatment_action: selectedTreatment,
        estimated_cost_inr: estCost,
        notes,
      });
    }
  };

  const quadrants = isPediatric ? PEDIATRIC_QUADRANTS : ADULT_QUADRANTS;

  const renderToothVisual = (tooth: number) => {
    const isSelected = selectedTooth === tooth;
    const record = records.find((r) => r.fdi_tooth === tooth);
    const hasPathology = record && record.condition_code !== 'HEALTHY';

    return (
      <button
        key={tooth}
        onClick={() => handleToothClick(tooth)}
        className={`group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 border ${
          isSelected
            ? 'bg-cyan-500/25 border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20'
            : hasPathology
            ? 'bg-rose-500/15 border-rose-500/40 hover:bg-rose-500/25'
            : 'bg-[#f6f6f3]/60 border-slate-800 hover:border-slate-700 hover:bg-[#e5e5e0]/50'
        }`}
      >
        <div className="w-7 h-9 flex items-center justify-center relative">
          {/* Anatomical Tooth SVG Outline */}
          <svg viewBox="0 0 40 50" className="w-full h-full">
            <path
              d="M 10 12 C 10 6, 30 6, 30 12 C 32 20, 34 32, 28 46 C 24 48, 22 36, 20 36 C 18 36, 16 48, 12 46 C 6 32, 8 20, 10 12 Z"
              fill={
                isSelected
                  ? '#06b6d4'
                  : hasPathology
                  ? '#f43f5e'
                  : record?.condition_code === 'CROWN_PRESENT'
                  ? '#f59e0b'
                  : '#94a3b8'
              }
              fillOpacity={isSelected ? '0.9' : hasPathology ? '0.7' : '0.4'}
              stroke={isSelected ? '#22d3ee' : hasPathology ? '#fb7185' : '#64748b'}
              strokeWidth="2"
            />
            {/* Occlusal / Incisal center marking */}
            <circle cx="20" cy="18" r="3" fill="#ffffff" fillOpacity="0.4" />
          </svg>
        </div>
        <span
          className={`text-[11px] font-mono font-bold mt-1 ${
            isSelected ? 'text-cyan-300' : hasPathology ? 'text-rose-300' : 'text-[#33332e]'
          }`}
        >
          #{tooth}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-[#f6f6f3] border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header and Adult/Pediatric Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Interactive 3-Tap FDI Odontogram</h3>
          </div>
          <p className="text-xs text-[#62625b] mt-0.5">
            Standard ISO 3950 two-digit FDI notation for 32 permanent & 20 deciduous teeth
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center bg-[#f6f6f3] p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setIsPediatric(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isPediatric ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-[#62625b] hover:text-[#000000]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Adult (32 Teeth)</span>
          </button>
          <button
            onClick={() => setIsPediatric(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPediatric ? 'bg-purple-500 text-white shadow-md font-bold' : 'text-[#62625b] hover:text-[#000000]'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Pediatric (20 Teeth)</span>
          </button>
        </div>
      </div>

      {/* Dental Arch Layout */}
      <div className="bg-[#fbfbf9]/95 p-4 rounded-xl border border-slate-800/80 mb-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#91918c] text-center mb-2">
          Maxillary Arch (Upper Jaw)
        </div>
        {/* Upper Row: Q1 (Right) & Q2 (Left) */}
        <div className="flex items-center justify-center gap-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5">
            {quadrants.upperRight.map((t) => renderToothVisual(t))}
          </div>
          <div className="w-px h-12 bg-cyan-500/30 shrink-0" />
          <div className="flex items-center gap-1.5">
            {quadrants.upperLeft.map((t) => renderToothVisual(t))}
          </div>
        </div>

        <div className="my-3 border-t border-slate-800 flex items-center justify-center">
          <span className="bg-[#f6f6f3] px-3 text-[10px] font-mono text-[#91918c] uppercase tracking-widest -mt-2">
            Midline Dental Occlusion
          </span>
        </div>

        {/* Lower Row: Q4 (Right) & Q3 (Left) */}
        <div className="flex items-center justify-center gap-6 overflow-x-auto pt-1">
          <div className="flex items-center gap-1.5">
            {quadrants.lowerRight.map((t) => renderToothVisual(t))}
          </div>
          <div className="w-px h-12 bg-cyan-500/30 shrink-0" />
          <div className="flex items-center gap-1.5">
            {quadrants.lowerLeft.map((t) => renderToothVisual(t))}
          </div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#91918c] text-center mt-2">
          Mandibular Arch (Lower Jaw)
        </div>
      </div>

      {/* 3-Tap Clinical Action Panel for Selected Tooth */}
      {selectedTooth && (
        <div className="bg-[#f6f6f3] border border-cyan-500/30 rounded-xl p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 font-mono text-base font-black rounded-lg border border-cyan-500/40">
                Tooth #{selectedTooth}
              </span>
              <div>
                <span className="text-xs font-bold text-white">
                  {selectedTooth >= 31 && selectedTooth <= 48
                    ? 'Mandibular'
                    : selectedTooth >= 11 && selectedTooth <= 28
                    ? 'Maxillary'
                    : 'Pediatric'}{' '}
                  Tooth Diagnostics
                </span>
                <p className="text-[11px] text-[#62625b]">Tap 1: Surfaces • Tap 2: Pathology • Tap 3: Treatment Plan</p>
              </div>
            </div>

            {/* Surface Selector (M, O, D, B, L) */}
            <div className="flex items-center gap-1 bg-[#f6f6f3] p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] font-semibold text-[#62625b] px-1.5 uppercase">Surfaces:</span>
              {(['M', 'O', 'D', 'B', 'L'] as const).map((s) => {
                const active = selectedSurfaces.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSurface(s)}
                    className={`w-6 h-6 rounded text-[11px] font-black transition-all ${
                      active ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-[#e5e5e0] text-[#62625b] hover:text-[#000000]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tap 2: Pathology Selection */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-[#33332e] mb-2">Tap 2: Diagnosed Pathology</label>
            <div className="flex flex-wrap gap-2">
              {PATHOLOGY_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setSelectedCondition(opt.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedCondition === opt.code
                      ? `${opt.color} ring-1 ring-white/30 font-bold scale-102`
                      : 'bg-[#f6f6f3] border-slate-800 text-[#62625b] hover:text-[#000000]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tap 3: Treatment Action & Auto-pricing */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#33332e]">Tap 3: Recommended Treatment Action</label>
              <div className="flex items-center gap-1 text-[#103c25] font-mono text-sm font-extrabold">
                <DollarSign className="w-4 h-4" />
                <span>₹{TREATMENT_PRICING[selectedTreatment]?.cost.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.keys(TREATMENT_PRICING) as NonNullable<DentalOdontogramRecord['treatment_action']>[]).map(
                (act) => (
                  <button
                    key={act}
                    onClick={() => setSelectedTreatment(act)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      selectedTreatment === act
                        ? 'bg-[#c7f0da] border-emerald-500/50 text-[#103c25]'
                        : 'bg-[#f6f6f3] border-slate-800 text-[#62625b] hover:text-[#000000]'
                    }`}
                  >
                    <span className="text-xs font-medium">{TREATMENT_PRICING[act].label}</span>
                    <span className="text-[11px] font-mono font-bold text-[#103c25] ml-2">
                      ₹{TREATMENT_PRICING[act].cost.toLocaleString('en-IN')}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Clinical Notes & Save */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical observation notes or pulp vitality test..."
              className="flex-1 bg-[#f6f6f3] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Update Odontogram</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
