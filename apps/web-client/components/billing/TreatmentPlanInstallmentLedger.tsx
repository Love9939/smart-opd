'use client';

import React, { useState } from 'react';
import { TreatmentPlanLedger } from '@/lib/types';
import { Check, Plus, DollarSign, Clock, CheckCircle2, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

interface SittingMilestone {
  sitting_no: number;
  title: string;
  amount_inr: number;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
  completed_at?: string;
}

export const TreatmentPlanInstallmentLedger: React.FC = () => {
  const [totalEstimated, setTotalEstimated] = useState(11000);
  const [milestones, setMilestones] = useState<SittingMilestone[]>([
    {
      sitting_no: 1,
      title: 'Sitting 1: Access Opening & Pulp Extirpation',
      amount_inr: 3500,
      status: 'COMPLETED',
      completed_at: 'Oct 21, 2026',
    },
    {
      sitting_no: 2,
      title: 'Sitting 2: Rotary Biomechanical Prep & Gutta-Percha Obturation',
      amount_inr: 2000,
      status: 'COMPLETED',
      completed_at: 'Oct 23, 2026',
    },
    {
      sitting_no: 3,
      title: 'Sitting 3: CAD/CAM Monolithic Zirconia Crown Cementation',
      amount_inr: 5500,
      status: 'ACTIVE',
    },
  ]);

  const [receiptSentMessage, setReceiptSentMessage] = useState<string | null>(null);

  const totalPaid = milestones
    .filter((m) => m.status === 'COMPLETED')
    .reduce((sum, m) => sum + m.amount_inr, 0);

  const balanceDue = totalEstimated - totalPaid;

  const handleCompleteSitting = (sittingNo: number) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.sitting_no === sittingNo
          ? { ...m, status: 'COMPLETED', completed_at: new Date().toLocaleDateString() }
          : m
      )
    );
    setReceiptSentMessage(`✓ Sitting #${sittingNo} marked completed and payment recorded.`);
    setTimeout(() => setReceiptSentMessage(null), 3000);
  };

  const handleSendWhatsAppReceipt = () => {
    setReceiptSentMessage(
      `✓ Itemized WhatsApp Digital Receipt sent to +91 9876543210 (Balance Due: ₹${balanceDue.toLocaleString('en-IN')})`
    );
    setTimeout(() => setReceiptSentMessage(null), 3500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold text-teal-400 tracking-wider">
            Multi-Sitting Procedure Ledger
          </span>
          <h3 className="text-lg font-black text-white mt-0.5">Molar Rotary RCT + Zirconia Crown (#36)</h3>
          <p className="text-xs text-slate-400">Split-payment installment tracking eliminating front-desk balance disputes</p>
        </div>

        {/* Running Balance Banner */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Estimated</span>
            <span className="font-mono font-black text-white text-base">₹{totalEstimated.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Paid So Far</span>
            <span className="font-mono font-black text-emerald-400 text-base">₹{totalPaid.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/40 text-right">
            <span className="text-[10px] text-amber-300 block uppercase font-bold">Balance Due</span>
            <span className="font-mono font-black text-amber-300 text-base">₹{balanceDue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {receiptSentMessage && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs font-bold text-emerald-200 animate-fadeIn">
          {receiptSentMessage}
        </div>
      )}

      {/* Sittings Timeline */}
      <div className="space-y-3 mb-6">
        {milestones.map((m) => {
          const isDone = m.status === 'COMPLETED';
          const isActive = m.status === 'ACTIVE';

          return (
            <div
              key={m.sitting_no}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                isDone
                  ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                  : isActive
                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/30 border-slate-900 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isActive
                      ? 'bg-cyan-500 text-slate-950 font-black shadow'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : `#${m.sitting_no}`}
                </span>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{m.title}</span>
                    {isActive && (
                      <span className="text-[10px] font-mono px-2 py-0.2 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                        TODAY'S SITTING
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {isDone ? `Completed on ${m.completed_at}` : 'Scheduled sitting milestone'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono font-extrabold text-base text-white">
                  ₹{m.amount_inr.toLocaleString('en-IN')}
                </span>

                {isActive && (
                  <button
                    onClick={() => handleCompleteSitting(m.sitting_no)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    Mark Paid & Settle
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Every sitting payment auto-updates patient balance in IndexedDB and Axum ledger.</span>
        </div>

        <button
          onClick={handleSendWhatsAppReceipt}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl text-xs border border-teal-500/30 shadow cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <span>Dispatch WhatsApp Digital Receipt</span>
        </button>
      </div>
    </div>
  );
};
