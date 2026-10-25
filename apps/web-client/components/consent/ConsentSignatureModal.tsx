'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, Check, RotateCcw, X, FileText, Lock } from 'lucide-react';

interface ConsentSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  procedureName: string;
  onConsentSigned: (signatureDataUrl: string, timestamp: string) => void;
}

export const ConsentSignatureModal: React.FC<ConsentSignatureModalProps> = ({
  isOpen,
  onClose,
  patientName,
  procedureName,
  onConsentSigned,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [dpdpConsentChecked, setDpdpConsentChecked] = useState(true);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!hasSignature || !dpdpConsentChecked) {
      alert('Please sign on the canvas and accept the DPDP Act consent terms.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const timestamp = new Date().toISOString();
    onConsentSigned(dataUrl, timestamp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f6f6f3]/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#f6f6f3] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Clinical Informed Consent</h3>
              <p className="text-xs text-[#62625b]">Indian DPDP Act 2023 Digital Audit Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#e5e5e0] hover:bg-[#c8c8c1] text-[#62625b] hover:text-[#000000] flex items-center justify-center text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Procedure & Patient Info */}
        <div className="bg-[#f6f6f3] p-3.5 rounded-2xl border border-slate-800 mb-4 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#62625b]">Patient Name:</span>
            <span className="font-bold text-white">{patientName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#62625b]">Procedure:</span>
            <span className="font-bold text-cyan-300 font-mono">{procedureName}</span>
          </div>
        </div>

        {/* Consent Declaration */}
        <div className="p-3.5 bg-[#f6f6f3]/60 rounded-2xl border border-slate-800/80 mb-4 text-[11px] text-[#33332e] leading-relaxed max-h-24 overflow-y-auto">
          I hereby give my informed digital consent for the clinical consultation, local anesthesia administration, and
          dental/medical procedures at SmartOPD & DentalFlow. I have been informed of the clinical objectives, potential
          risks, and alternative treatment options under Section 6 of the Indian Digital Personal Data Protection (DPDP) Act
          2023.
        </div>

        {/* E-Signature Canvas */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#33332e]">Patient / Guardian E-Signature:</label>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] text-[#62625b] hover:text-[#000000]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="border border-cyan-500/40 rounded-2xl bg-[#f6f6f3] overflow-hidden shadow-inner relative">
            <canvas
              ref={canvasRef}
              width={450}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 cursor-crosshair touch-none"
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#dadad3] text-xs font-mono">
                ✍️ Sign here with stylus, finger, or mouse
              </div>
            )}
          </div>
        </div>

        {/* DPDP Consent Acceptance Checkbox */}
        <div className="flex items-center gap-2 mb-5 p-2 bg-[#f6f6f3] rounded-xl border border-slate-800 text-[11px] text-[#62625b]">
          <input
            type="checkbox"
            id="dpdp-check"
            checked={dpdpConsentChecked}
            onChange={(e) => setDpdpConsentChecked(e.target.checked)}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
          <label htmlFor="dpdp-check" className="cursor-pointer">
            I confirm that I am authorized to provide informed consent for this visit.
          </label>
        </div>

        {/* Confirm Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#e5e5e0] hover:bg-[#c8c8c1] text-[#33332e] font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Digitally Seal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
