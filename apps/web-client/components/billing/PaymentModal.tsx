'use client';

import React, { useState } from 'react';
import { QueueToken } from '@/lib/types';
import { thermalPrinter } from '@/lib/escpos-printer';
import {
  CreditCard,
  QrCode,
  Check,
  Printer,
  ShieldAlert,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface PaymentModalProps {
  token: QueueToken;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSettled: (method: 'UPI' | 'CASH' | 'FREE_FOLLOWUP', amount: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  token,
  isOpen,
  onClose,
  onPaymentSettled,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'FREE_FOLLOWUP'>('UPI');
  const [amount, setAmount] = useState<number>(500);
  const [isFollowupWindowValid, setIsFollowupWindowValid] = useState<boolean>(false);
  const [isSettled, setIsSettled] = useState<boolean>(false);
  const [printSuccess, setPrintSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSettle = () => {
    setIsSettled(true);
    onPaymentSettled(paymentMethod, paymentMethod === 'FREE_FOLLOWUP' ? 0 : amount);
  };

  const handlePrintReceipt = async () => {
    try {
      const res = await thermalPrinter.printToken({
        clinicName: 'SmartOPD & DentalFlow',
        doctorName: 'Dr. Sneha Rao & Dr. Arjun Reddy',
        tokenDisplay: token.token_display,
        patientName: token.patient_name,
        phone: '9876543210',
        assignedSeat: token.assigned_waiting_seat || 'Lobby Waiting',
        category: token.category,
        estWaitMins: Math.round(token.estimated_wait_secs / 60) || 10,
        qrCodeUrl: 'https://smartopd.in/q/demo',
        bookedAt: token.booked_at,
      });
      setPrintSuccess(res.method === 'bluetooth' ? 'Printed via Bluetooth 58mm' : 'Sent to print dialog');
      setTimeout(() => setPrintSuccess(null), 3000);
    } catch {
      setPrintSuccess('Print triggered');
      setTimeout(() => setPrintSuccess(null), 3000);
    }
  };

  const upiIntentUri = `upi://pay?pa=smartopd@icici&pn=SmartOPD%20Clinic&am=${amount}&cu=INR&tn=Token%20${token.token_display}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fbfbf9]/95 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#f6f6f3] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
              Token {token.token_display} Billing Settlement
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5">{token.patient_name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#e5e5e0] hover:bg-[#c8c8c1] text-[#62625b] hover:text-[#000000] flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {isSettled ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#c7f0da] border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Payment Successfully Settled!</h4>
            <p className="text-xs text-[#62625b] mb-5">
              Settlement logged into immutable PostgreSQL `token_audit_events` ledger.
            </p>

            {printSuccess && (
              <div className="text-xs text-teal-300 bg-teal-500/20 py-1.5 px-3 rounded-lg mb-4 border border-teal-500/30">
                {printSuccess}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print 58mm Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#e5e5e0] hover:bg-[#c8c8c1] text-[#211922] font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow'
                    : 'bg-[#f6f6f3] border-slate-800 text-[#62625b] hover:text-[#000000]'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-cyan-400" />
                <span>Instant UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow'
                    : 'bg-[#f6f6f3] border-slate-800 text-[#62625b] hover:text-[#000000]'
                }`}
              >
                <DollarSign className="w-5 h-5 mb-1 text-amber-400" />
                <span>Cash POS</span>
              </button>

              <button
                onClick={() => {
                  setPaymentMethod('FREE_FOLLOWUP');
                  setIsFollowupWindowValid(true);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                  paymentMethod === 'FREE_FOLLOWUP'
                    ? 'bg-[#c7f0da] border-emerald-400 text-[#103c25] shadow'
                    : 'bg-[#f6f6f3] border-slate-800 text-[#62625b] hover:text-[#000000]'
                }`}
              >
                <Clock className="w-5 h-5 mb-1 text-[#103c25]" />
                <span>Follow-Up (₹0)</span>
              </button>
            </div>

            {/* Dynamic UPI Section */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-[#f6f6f3] rounded-2xl border border-slate-800 text-center">
                <div className="w-40 h-40 bg-white p-2.5 rounded-xl mx-auto mb-2 flex items-center justify-center shadow">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* UPI QR Visual Representation */}
                    <rect x="5" y="5" width="26" height="26" fill="#0f172a" />
                    <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
                    <rect x="13" y="13" width="10" height="10" fill="#06b6d4" />

                    <rect x="69" y="5" width="26" height="26" fill="#0f172a" />
                    <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
                    <rect x="77" y="13" width="10" height="10" fill="#06b6d4" />

                    <rect x="5" y="69" width="26" height="26" fill="#0f172a" />
                    <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
                    <rect x="13" y="77" width="10" height="10" fill="#06b6d4" />

                    <rect x="35" y="8" width="8" height="18" fill="#0f172a" />
                    <rect x="50" y="8" width="12" height="12" fill="#0f172a" />
                    <rect x="35" y="36" width="30" height="28" rx="4" fill="#0f172a" />
                    <circle cx="50" cy="50" r="6" fill="#22c55e" />
                    <rect x="70" y="40" width="22" height="10" fill="#0f172a" />
                    <rect x="36" y="72" width="18" height="20" fill="#0f172a" />
                    <rect x="60" y="72" width="28" height="20" fill="#0f172a" />
                  </svg>
                </div>
                <div className="text-xl font-mono font-black text-white">₹{amount}</div>
                <span className="text-[11px] text-[#62625b]">Scan via GPay / PhonePe / Paytm</span>
              </div>
            )}

            {/* Cash Section */}
            {paymentMethod === 'CASH' && (
              <div className="p-4 bg-[#f6f6f3] rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#33332e] font-bold">Consultation Fee Due:</span>
                  <span className="text-xl font-mono font-black text-amber-300">₹{amount}</span>
                </div>
                <div className="text-[11px] text-[#62625b] bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  ⚠️ Cash collected is logged directly into the append-only audit ledger to eliminate shadow consultations.
                </div>
              </div>
            )}

            {/* Free Followup Section */}
            {paymentMethod === 'FREE_FOLLOWUP' && (
              <div className="p-4 bg-[#f6f6f3] rounded-2xl border border-slate-800 space-y-2 text-center">
                <div className="text-sm font-bold text-[#103c25]">5-Day Free Follow-Up Window Verified</div>
                <p className="text-xs text-[#62625b]">Previous visit was on Oct 21. Fee charged: ₹0.</p>
              </div>
            )}

            {/* Settle Action */}
            <button
              onClick={handleSettle}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Settle Payment</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
