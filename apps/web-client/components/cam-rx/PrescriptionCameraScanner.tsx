'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, Activity, Heart, Thermometer, Droplet, Scale, RefreshCw } from 'lucide-react';

interface PrescriptionCameraScannerProps {
  tokenId: string;
  onSave?: (data: { vitals: any; rxImageUrl: string }) => void;
}

export const PrescriptionCameraScanner: React.FC<PrescriptionCameraScannerProps> = ({
  onSave,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'normal' | 'high-contrast' | 'document-bw'>('high-contrast');
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vitals State
  const [bp, setBp] = useState('120/80');
  const [spo2, setSpo2] = useState('98');
  const [temp, setTemp] = useState('98.4');
  const [rbs, setRbs] = useState('110');
  const [weight, setWeight] = useState('68');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateCapture = () => {
    setIsCapturing(true);
    // Simulate high-res prescription document scan
    setTimeout(() => {
      setImagePreview('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="%23f8fafc"/><text x="40" y="60" font-family="monospace" font-size="20" fill="%230f172a" font-weight="bold">DR. ARJUN REDDY, MBBS, MD</text><text x="40" y="85" font-family="sans-serif" font-size="12" fill="%2364748b">Reg No: KMC-74892 • SmartOPD Clinic</text><line x1="40" y1="105" x2="560" y2="105" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="140" font-family="sans-serif" font-size="16" fill="%230284c7" font-weight="bold">Rx Prescription</text><text x="40" y="180" font-family="monospace" font-size="14" fill="%231e293b">1. Tab. Amoxicillin + Clav 625mg -- 1-0-1 x 5 days (After food)</text><text x="40" y="210" font-family="monospace" font-size="14" fill="%231e293b">2. Tab. Zerodol-SP -- 1-0-1 x 3 days (SOS Pain)</text><text x="40" y="240" font-family="monospace" font-size="14" fill="%231e293b">3. Cap. Pantoprazole 40mg -- 1-0-0 x 5 days (Empty stomach)</text><text x="40" y="300" font-family="sans-serif" font-size="13" fill="%23475569">Advice: Warm saline gargles. Return in 5 days for follow-up evaluation.</text><path d="M 420 700 Q 460 670 520 720" stroke="%230284c7" stroke-width="3" fill="none"/><text x="440" y="740" font-family="sans-serif" font-size="12" fill="%2364748b">Doctor Signature</text></svg>');
      setIsCapturing(false);
    }, 600);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    if (onSave) {
      onSave({
        vitals: {
          bp,
          spo2: Number(spo2),
          temp: Number(temp),
          rbs: Number(rbs),
          weight: Number(weight),
        },
        rxImageUrl: imagePreview || '',
      });
    }
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-bold text-white">1-Tap CamRx Scanner & Vitals Card</h3>
        </div>
        <span className="text-[11px] font-mono text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/30">
          Zero-Typing Clinical Card
        </span>
      </div>

      {/* Vitals Quick Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
        {/* Blood Pressure */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold mb-1">
            <Heart className="w-3.5 h-3.5" />
            <span>BP (mmHg)</span>
          </div>
          <input
            type="text"
            value={bp}
            onChange={(e) => setBp(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* SpO2 */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>SpO2 (%)</span>
          </div>
          <input
            type="number"
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Temperature */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold mb-1">
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp (°F)</span>
          </div>
          <input
            type="number"
            step="0.1"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* RBS */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-semibold mb-1">
            <Droplet className="w-3.5 h-3.5" />
            <span>RBS (mg/dL)</span>
          </div>
          <input
            type="number"
            value={rbs}
            onChange={(e) => setRbs(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Weight */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Weight (kg)</span>
          </div>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* CamRx Document Scanner Area */}
      <div className="border border-dashed border-slate-700 rounded-xl p-4 bg-slate-950/50 flex flex-col items-center justify-center min-h-[220px]">
        {imagePreview ? (
          <div className="w-full flex flex-col items-center">
            {/* Filter Toggle */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-400">Enhance:</span>
              <button
                onClick={() => setFilterMode('high-contrast')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                  filterMode === 'high-contrast' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                High-Contrast Rx
              </button>
              <button
                onClick={() => setFilterMode('document-bw')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                  filterMode === 'document-bw' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                B&W Document
              </button>
              <button
                onClick={() => setFilterMode('normal')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                  filterMode === 'normal' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Normal
              </button>
            </div>

            <div
              className={`max-w-md w-full rounded-lg overflow-hidden border border-slate-700 shadow-xl transition-all ${
                filterMode === 'high-contrast'
                  ? 'contrast-125 brightness-105'
                  : filterMode === 'document-bw'
                  ? 'grayscale contrast-150'
                  : ''
              }`}
            >
              <img src={imagePreview} alt="Rx Prescription Scan" className="w-full h-auto object-contain max-h-[300px]" />
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => setImagePreview(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">1-Tap Prescription Scan</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Capture or upload handwritten doctor prescription. Auto-cropped & enhanced with high contrast.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSimulateCapture}
                disabled={isCapturing}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{isCapturing ? 'Scanning...' : 'Simulate Camera Scan'}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Action */}
      <div className="mt-4 flex items-center justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            savedSuccess
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{savedSuccess ? 'Clinical Vitals & Rx Saved!' : 'Save Vitals & Rx Record'}</span>
        </button>
      </div>
    </div>
  );
};
