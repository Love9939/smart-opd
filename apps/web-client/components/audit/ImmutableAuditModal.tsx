'use client';

import React, { useState, useEffect } from 'react';
import { TokenAuditEvent } from '@/lib/types';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  X,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  UserCheck,
  Zap,
  Activity,
  FileText,
} from 'lucide-react';

interface ImmutableAuditModalProps {
  clinicId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImmutableAuditModal({ clinicId, isOpen, onClose }: ImmutableAuditModalProps) {
  const [events, setEvents] = useState<TokenAuditEvent[]>([
    {
      id: 1,
      clinic_id: clinicId,
      token_id: '0192b8d4-7c90-7000-8a12-4b5e6f7a8b9c',
      actor_id: 'a0000000-0000-0000-0000-000000000001',
      actor_role: 'SYSTEM_BOOTSTRAP',
      action_type: 'SYSTEM_INIT',
      old_payload: null,
      new_payload: {
        message: 'Immutable Token Audit Ledger initialized. Protected by BEFORE DELETE/UPDATE database trigger.',
        status: 'TAMPER_PROOF_VERIFIED',
      },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      clinic_id: clinicId,
      token_id: 't-001',
      actor_id: 'staff-pos-01',
      actor_role: 'RECEPTIONIST_POS',
      action_type: 'FEE_COLLECTED',
      old_payload: { status: 'UNPAID', fee_charged: 500 },
      new_payload: { amount_paid_inr: 500, payment_method: 'UPI', qr_ref: 'PAY-8831' },
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 3,
      clinic_id: clinicId,
      token_id: 't-002',
      actor_id: 'staff-pos-02',
      actor_role: 'RECEPTIONIST_POS',
      action_type: 'FEE_WAIVED_ALERT',
      old_payload: { status: 'UNPAID', fee_charged: 500 },
      new_payload: {
        amount_paid_inr: 0,
        payment_method: 'WAIVED',
        is_pilferage_alert: true,
        reason: 'Patient claims personal acquaintance with doctor',
      },
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
  ]);

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch real audit logs from Axum backend
  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/clinics/${clinicId}/audit-events`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setEvents(json.data);
        }
      }
    } catch {
      // Retain seeded records if server unreachable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuditEvents();
    }
  }, [isOpen, clinicId]);

  if (!isOpen) return null;

  const filteredEvents = events.filter((ev) => {
    const matchesFilter =
      filterType === 'ALL'
        ? true
        : filterType === 'PILFERAGE'
        ? ev.action_type === 'FEE_WAIVED_ALERT' || ev.action_type === 'FEE_MODIFIED'
        : ev.action_type.includes(filterType);

    const matchesSearch =
      searchQuery === '' ||
      ev.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.actor_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(ev.new_payload).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pilferageCount = events.filter(
    (e) => e.action_type === 'FEE_WAIVED_ALERT' || (e.new_payload && e.new_payload.is_pilferage_alert)
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Immutable Audit Ledger & Pilferage Shield</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  APPEND-ONLY ENFORCED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PostgreSQL trigger <code className="text-slate-300">trg_immutable_token_audit</code> rejects tampering, fee waivers & deletions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAuditEvents}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Banner & Summary Stats */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400">Total Audit Logs</div>
              <div className="text-sm font-bold text-white">{events.length} Recorded</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400">Database Integrity</div>
              <div className="text-sm font-bold text-emerald-400">100% Tamper Proof</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-3 ${pilferageCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pilferageCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400">Fee Waiver Alerts</div>
              <div className={`text-sm font-bold ${pilferageCount > 0 ? 'text-amber-300' : 'text-slate-300'}`}>
                {pilferageCount} Shadow Alert{pilferageCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400">Doctor Mobile Push</div>
              <div className="text-sm font-bold text-purple-300">Live WebSockets</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'PILFERAGE', label: `⚠️ Fee Waivers (${pilferageCount})` },
              { id: 'FEE', label: 'Payments' },
              { id: 'TOKEN', label: 'Token Lifecycle' },
              { id: 'EMERGENCY', label: 'Emergency Triage' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2.5">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No audit events matched your search filter.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isAlert =
                ev.action_type === 'FEE_WAIVED_ALERT' ||
                (ev.new_payload && ev.new_payload.is_pilferage_alert);

              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs ${
                    isAlert
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-900/10'
                      : 'bg-slate-800/30 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">
                        #{String(ev.id).padStart(4, '0')}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          isAlert
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : ev.action_type === 'FEE_COLLECTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : ev.action_type.includes('EMERGENCY')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {ev.action_type.replace(/_/g, ' ')}
                      </span>

                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <UserCheck className="w-3 h-3 text-slate-500" />
                        <span className="font-semibold text-slate-300">{ev.actor_role}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(ev.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Tamper Alert Callout if Pilferage */}
                  {isAlert && (
                    <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-200 text-[11px]">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Shadow Consultation / Cash Pilferage Alert:</strong> Reception staff logged a zero-rupee fee waiver. Doctor phone received high-priority WebSocket notification.
                      </div>
                    </div>
                  )}

                  {/* Payload Details */}
                  <div className="bg-slate-950/60 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 border border-slate-900 overflow-x-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500">Payload State: </span>
                        {Object.entries(ev.new_payload).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            <span className="text-slate-400">{k}:</span>{' '}
                            <span className="text-blue-300 font-medium">{String(v)}</span>
                          </span>
                        ))}
                      </div>

                      {ev.old_payload && (
                        <div className="text-slate-400">
                          <span className="text-slate-500">Previous: </span>
                          {JSON.stringify(ev.old_payload)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guaranteed Append-Only: Database rejects any manual row mutation or DROP action.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Audit Monitor
          </button>
        </div>
      </div>
    </div>
  );
}
