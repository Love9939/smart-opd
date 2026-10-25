'use client';

import React, { useState } from 'react';
import { DentalLabOrder } from '@/lib/types';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Phone,
  Shield,
  X,
  Sparkles,
  Send,
} from 'lucide-react';

interface DentalLabGateModalProps {
  orders: DentalLabOrder[];
  isOpen: boolean;
  onClose: () => void;
  onVerifyOrder: (orderId: string) => void;
}

export function DentalLabGateModal({
  orders,
  isOpen,
  onClose,
  onVerifyOrder,
}: DentalLabGateModalProps) {
  const [courierAlertSent, setCourierAlertSent] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleWhatsAppFollowup = (order: DentalLabOrder) => {
    setCourierAlertSent(order.id);
    setTimeout(() => setCourierAlertSent(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#f6f6f3] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#f6f6f3]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Prosthodontic Lab Dependency Gate</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  CROWN & BRIDGE QC GATE
                </span>
              </div>
              <p className="text-xs text-[#62625b]">
                System prevents checking in Crown Cementation appointments until prosthesis is marked <code className="text-[#103c25]">QC_VERIFIED</code>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#62625b] hover:text-[#000000] hover:bg-[#e5e5e0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Courier Followup Toast */}
        {courierAlertSent && (
          <div className="p-3 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-medium">
            <Send className="w-4 h-4 text-[#103c25]" />
            <span>✓ WhatsApp alert dispatched to courier rider: "URGENT: Deliver Crown parcel for today's 5:00 PM sitting."</span>
          </div>
        )}

        {/* Orders List */}
        <div className="p-5 overflow-y-auto space-y-4">
          {orders.map((order) => {
            const isVerified = order.status === 'QcVerified';
            const isReceived = order.status === 'ReceivedAtClinic';

            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border transition-all ${
                  isVerified
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isReceived
                    ? 'bg-blue-950/20 border-blue-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{order.prosthesis_type}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isVerified
                            ? 'bg-[#c7f0da] text-emerald-300 border border-[#a3e6c2]'
                            : isReceived
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isVerified ? '✓ QC VERIFIED' : isReceived ? '📦 RECEIVED AT CLINIC' : '🚚 IN TRANSIT'}
                      </span>
                    </div>

                    <div className="text-xs text-[#62625b] mt-1 flex items-center gap-2">
                      <span className="font-semibold text-[#33332e]">Lab Vendor:</span> {order.lab_vendor_name}
                      <span>•</span>
                      <span className="font-semibold text-[#33332e]">Teeth:</span> #{order.fdi_teeth.join(', #')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isVerified ? (
                      <>
                        <button
                          onClick={() => onVerifyOrder(order.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Staff Inspect & QC Verify
                        </button>

                        <button
                          onClick={() => handleWhatsAppFollowup(order)}
                          className="px-3 py-1.5 rounded-lg bg-[#e5e5e0] hover:bg-[#c8c8c1] text-[#33332e] text-xs font-medium flex items-center gap-1.5 transition-all"
                        >
                          <Truck className="w-3.5 h-3.5 text-blue-400" />
                          WhatsApp Courier
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-[#103c25] font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-[#103c25]" />
                        <span>Ready for Cementation Check-In</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#f6f6f3]/60 p-2.5 rounded-lg border border-slate-900 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#91918c]">Expected Delivery: </span>
                    <span className="text-[#33332e] font-mono">Today, 2:00 PM</span>
                  </div>
                  <div>
                    <span className="text-[#91918c]">Shade & Material: </span>
                    <span className="text-purple-300 font-medium">Zirconia Multi-Layer (A2)</span>
                  </div>
                  <div>
                    <span className="text-[#91918c]">Safety Check: </span>
                    <span className={isVerified ? 'text-[#103c25] font-semibold' : 'text-amber-400 font-semibold'}>
                      {isVerified ? '✓ Check-in Unlocked' : '🛑 Check-in Gated'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#fbfbf9]/95 flex items-center justify-between text-xs text-[#62625b]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Eliminates the "Missing Crown Disaster" by blocking appointments before patients take half-day off.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#e5e5e0] hover:bg-[#c8c8c1] text-[#211922] text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
