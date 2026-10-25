'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { WaitingRoomSeatGrid } from '@/components/seat-grid/WaitingRoomSeatGrid';
import { AbdmScanShareModal } from '@/components/abdm/AbdmScanShareModal';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { ImmutableAuditModal } from '@/components/audit/ImmutableAuditModal';
import { DentalLabGateModal } from '@/components/lab/DentalLabGateModal';
import { QueueToken, WaitingSeat, DentalLabOrder } from '@/lib/types';
import { ReconnectingWebSocketClient, useLiveClinicStore } from '@/lib/ws-client';
import { queueOfflineMutation, syncOfflineOutbox } from '@/lib/offline-outbox';
import { thermalPrinter } from '@/lib/escpos-printer';
import { clinicalChime } from '@/lib/audio-chime';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  CreditCard,
  Wifi,
  WifiOff,
  Search,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Printer,
  QrCode,
  DollarSign,
  Smartphone,
  Users,
  ShieldCheck,
  Clock,
  Activity,
} from 'lucide-react';

function ReceptionistDeskContent() {
  const params = useParams();
  const clinicId = (params?.clinic_id as string) || '8e14c2a0-4f1a-4b9e-9c12-1a2b3c4d5e6f';
  const defaultSessionId = 'a1111111-2222-3333-4444-555555555555';

  const { isConnected, isOfflineMode, lastEvent } = useLiveClinicStore();

  // State
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [abhaAddress, setAbhaAddress] = useState<string | null>(null);
  const [category, setCategory] = useState<'Regular' | 'Emergency' | 'LabReturn' | 'LateGrace'>('Regular');
  const [isElderlyOrPregnant, setIsElderlyOrPregnant] = useState(false);
  const [requiresLabWork, setRequiresLabWork] = useState(false);
  const [selectedLabOrderId, setSelectedLabOrderId] = useState<string>('b1111111-0000-0000-0000-000000000001');

  // Modals
  const [isAbdmModalOpen, setIsAbdmModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [activePaymentToken, setActivePaymentToken] = useState<QueueToken | null>(null);

  // Family Cluster & Late Grace States
  const [isFamilyCluster, setIsFamilyCluster] = useState(false);
  const [familyMemberName, setFamilyMemberName] = useState('');
  const [isLateArrival, setIsLateArrival] = useState(false);

  // Active Tokens Roster
  const [tokens, setTokens] = useState<QueueToken[]>([
    {
      token_id: 't-001',
      session_id: defaultSessionId,
      token_display: 'A-01',
      patient_id: 'p-001',
      patient_name: 'Anita Sharma',
      category: 'Regular',
      status: 'CheckedIn',
      required_seat_type: 'Standard',
      assigned_waiting_seat: 'A-01',
      planned_duration_secs: 360,
      requires_sterilization: false,
      lab_qc_verified: true,
      estimated_wait_secs: 360,
      booked_at: new Date().toISOString(),
    },
    {
      token_id: 't-002',
      session_id: defaultSessionId,
      token_display: 'P-01',
      patient_id: 'p-002',
      patient_name: 'Savitri Bai (Age 72)',
      category: 'Regular',
      status: 'CheckedIn',
      required_seat_type: 'PriorityElderlyPregnant',
      assigned_waiting_seat: 'P-01',
      planned_duration_secs: 360,
      requires_sterilization: false,
      lab_qc_verified: true,
      estimated_wait_secs: 720,
      booked_at: new Date().toISOString(),
    },
  ]);

  // Physical Seats
  const [seats, setSeats] = useState<WaitingSeat[]>([
    { seat_id: 's-1', seat_code: 'P-01', zone_name: 'Priority Zone', seat_type: 'PriorityElderlyPregnant', occupied_by_token: 't-002' },
    { seat_id: 's-2', seat_code: 'P-02', zone_name: 'Priority Zone', seat_type: 'PriorityElderlyPregnant', occupied_by_token: null },
    { seat_id: 's-3', seat_code: 'N-01', zone_name: 'Numbing Lounge', seat_type: 'NumbingLounge', occupied_by_token: null },
    { seat_id: 's-4', seat_code: 'W-01', zone_name: 'Wheelchair Bay', seat_type: 'Wheelchair', occupied_by_token: null },
    { seat_id: 's-5', seat_code: 'A-01', zone_name: 'Main Lobby', seat_type: 'Standard', occupied_by_token: 't-001' },
    { seat_id: 's-6', seat_code: 'A-02', zone_name: 'Main Lobby', seat_type: 'Standard', occupied_by_token: null },
    { seat_id: 's-7', seat_code: 'A-03', zone_name: 'Main Lobby', seat_type: 'Standard', occupied_by_token: null },
    { seat_id: 's-8', seat_code: 'A-04', zone_name: 'Main Lobby', seat_type: 'Standard', occupied_by_token: null },
  ]);

  // Dental Lab Orders
  const [labOrders, setLabOrders] = useState<DentalLabOrder[]>([
    {
      id: 'b1111111-0000-0000-0000-000000000001',
      clinic_id: clinicId,
      treatment_plan_id: 'tp-1',
      patient_id: 'p-003',
      lab_vendor_name: 'Apex Precision Dental Lab',
      prosthesis_type: 'Monolithic Zirconia Crown - Tooth #36 (Shade A2)',
      fdi_teeth: [36],
      status: 'ReceivedAtClinic',
      expected_delivery_at: new Date().toISOString(),
      received_verified_at: null,
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsClient = new ReconnectingWebSocketClient(clinicId);
    wsClient.connect();

    // Listen for online sync
    const handleOnline = () => {
      syncOfflineOutbox().then(({ synced }) => {
        if (synced > 0) setNotification(`Back online: Synced ${synced} offline mutations.`);
      });
    };
    window.addEventListener('online', handleOnline);

    return () => {
      wsClient.disconnect();
      window.removeEventListener('online', handleOnline);
    };
  }, [clinicId]);

  // Handle incoming WebSocket events
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.event_type === 'TOKEN_CALLED') {
      const { token_display, assigned_chair_code } = lastEvent.payload;
      setNotification(`📢 Token ${token_display} called into ${assigned_chair_code}`);
      setTokens((prev) =>
        prev.map((t) =>
          t.token_display === token_display
            ? { ...t, status: 'Called', assigned_chair_code, assigned_waiting_seat: null }
            : t
        )
      );
      // Free seat
      setSeats((prev) =>
        prev.map((s) => (s.occupied_by_token === token_display ? { ...s, occupied_by_token: null } : s))
      );
    }
  }, [lastEvent]);

  // Keyboard Shortcuts (F1: Focus name, F2: Toggle Emergency, F3: ABDM Scan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('patient-name-input')?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCategory((prev) => (prev === 'Emergency' ? 'Regular' : 'Emergency'));
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsAbdmModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Occupancy
  const occupiedCount = seats.filter((s) => s.occupied_by_token !== null).length;
  const occupancyPct = Math.round((occupiedCount / seats.length) * 100);
  const isPeakCrowd = occupancyPct >= 80;

  // Handle Check-in Submission
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    // External Lab Gate Check
    if (requiresLabWork) {
      const labOrder = labOrders.find((l) => l.id === selectedLabOrderId);
      if (labOrder && labOrder.status !== 'QcVerified') {
        alert(
          `🛑 Cannot Check In: Prosthodontic Lab order (${labOrder.prosthesis_type}) is not marked QC_VERIFIED by reception staff!`
        );
        return;
      }
    }

    const preferredSeatType = isElderlyOrPregnant ? 'PriorityElderlyPregnant' : 'Standard';
    const effectiveCategory = isLateArrival ? 'LateGrace' : category;

    // Allocate physical seat
    let allocatedSeatCode: string | null = null;
    let seatIdx = seats.findIndex((s) => s.occupied_by_token === null && s.seat_type === preferredSeatType);
    if (seatIdx === -1 && preferredSeatType !== 'Standard') {
      seatIdx = seats.findIndex((s) => s.occupied_by_token === null && s.seat_type === 'Standard');
    }

    const prefix = effectiveCategory === 'Emergency' ? 'E' : isElderlyOrPregnant ? 'P' : effectiveCategory === 'LateGrace' ? 'G' : 'A';
    const count = tokens.length + 1;
    const hasFamily = isFamilyCluster && familyMemberName.trim().length > 0;
    const clusterId = hasFamily ? `cluster-${Date.now()}` : undefined;

    const newTokenDisplay = `${prefix}-${String(count).padStart(2, '0')}${hasFamily ? 'A' : ''}`;
    const newTokenId = `t-${Date.now()}`;

    let updatedSeats = [...seats];

    if (seatIdx !== -1) {
      allocatedSeatCode = seats[seatIdx].seat_code;
      updatedSeats[seatIdx].occupied_by_token = newTokenId;
    }

    const primaryToken: QueueToken = {
      token_id: newTokenId,
      session_id: defaultSessionId,
      token_display: newTokenDisplay,
      patient_id: `p-${Date.now()}`,
      patient_name: patientName,
      category: effectiveCategory,
      status: 'CheckedIn',
      required_seat_type: preferredSeatType,
      assigned_waiting_seat: allocatedSeatCode,
      planned_duration_secs: effectiveCategory === 'Emergency' ? 600 : 360,
      requires_sterilization: false,
      lab_qc_verified: true,
      estimated_wait_secs: (tokens.length + 1) * 360,
      booked_at: new Date().toISOString(),
      checked_in_at: new Date().toISOString(),
      family_cluster_id: clusterId,
      family_cluster_name: hasFamily ? `${patientName} & ${familyMemberName}` : undefined,
    };

    let newTokensList = [primaryToken];

    // Secondary Family Member
    let secondarySeatCode: string | null = null;
    if (hasFamily) {
      const secondarySeatIdx = updatedSeats.findIndex((s) => s.occupied_by_token === null && s.seat_type === 'Standard');
      const secondaryTokenId = `t-${Date.now() + 1}`;
      const secondaryTokenDisplay = `${prefix}-${String(count).padStart(2, '0')}B`;

      if (secondarySeatIdx !== -1) {
        secondarySeatCode = updatedSeats[secondarySeatIdx].seat_code;
        updatedSeats[secondarySeatIdx].occupied_by_token = secondaryTokenId;
      }

      const secondaryToken: QueueToken = {
        token_id: secondaryTokenId,
        session_id: defaultSessionId,
        token_display: secondaryTokenDisplay,
        patient_id: `p-${Date.now() + 1}`,
        patient_name: `${familyMemberName} (Family)`,
        category: effectiveCategory,
        status: 'CheckedIn',
        required_seat_type: 'Standard',
        assigned_waiting_seat: secondarySeatCode,
        planned_duration_secs: 360,
        requires_sterilization: false,
        lab_qc_verified: true,
        estimated_wait_secs: (tokens.length + 2) * 360,
        booked_at: new Date().toISOString(),
        checked_in_at: new Date().toISOString(),
        family_cluster_id: clusterId,
        family_cluster_name: `${patientName} & ${familyMemberName}`,
      };
      newTokensList.push(secondaryToken);
    }

    setSeats(updatedSeats);
    setTokens((prev) => [...newTokensList, ...prev]);

    // Play clinical audio chime for emergencies
    if (effectiveCategory === 'Emergency') {
      clinicalChime.playTokenCallChime();
    }

    // Try posting to real backend
    try {
      fetch(`http://localhost:8080/api/v1/sessions/${defaultSessionId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          category: effectiveCategory,
          required_seat_type: preferredSeatType,
          lab_qc_verified: true,
          cluster_suffix: hasFamily ? 'A' : undefined,
        }),
      }).catch(() => {});

      if (hasFamily) {
        fetch(`http://localhost:8080/api/v1/sessions/${defaultSessionId}/tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_name: `${familyMemberName} (Family)`,
            category: effectiveCategory,
            required_seat_type: 'Standard',
            lab_qc_verified: true,
            cluster_suffix: 'B',
          }),
        }).catch(() => {});
      }
    } catch {}

    // Save mutation to offline outbox for resilience
    await queueOfflineMutation('CHECK_IN', `/api/v1/sessions/${defaultSessionId}/tokens`, primaryToken);

    // Auto-print thermal token receipt
    thermalPrinter
      .printToken({
        clinicName: 'SmartOPD & DentalFlow',
        doctorName: 'Dr. Sneha Rao & Dr. Arjun Reddy',
        tokenDisplay: newTokenDisplay,
        patientName,
        phone,
        assignedSeat: allocatedSeatCode || 'Lobby Waiting',
        category: effectiveCategory,
        estWaitMins: Math.round(primaryToken.estimated_wait_secs / 60) || 6,
        qrCodeUrl: 'https://smartopd.in/q/demo',
        bookedAt: primaryToken.booked_at,
      })
      .catch(() => {});

    setNotification(
      hasFamily
        ? `✓ Family Cluster Checked-in: ${newTokenDisplay} & ${prefix}-${String(count).padStart(2, '0')}B (Seats: ${allocatedSeatCode}, ${secondarySeatCode})`
        : `✓ Token ${newTokenDisplay} printed! Assigned Seat: ${allocatedSeatCode || 'Lobby Waiting'}`
    );
    setPatientName('');
    setFamilyMemberName('');
    setIsFamilyCluster(false);
    setIsLateArrival(false);
    setAbhaAddress(null);
    setIsElderlyOrPregnant(false);
    setRequiresLabWork(false);
  };

  // 1-Click QC Verify Lab Order
  const handleVerifyLab = (orderId: string) => {
    setLabOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'QcVerified', received_verified_at: new Date().toISOString() } : o
      )
    );
    setNotification('✓ Dental Lab Parcel QC_VERIFIED & Approved for Patient Check-in');
  };

  // Handle ABDM Scan & Share Profile Data
  const handleAbdmProfileScanned = (profile: {
    fullName: string;
    abhaAddress: string;
    age: number;
    gender: string;
    phone: string;
  }) => {
    setPatientName(profile.fullName);
    setPhone(profile.phone);
    setAbhaAddress(profile.abhaAddress);
    if (profile.age >= 65) {
      setIsElderlyOrPregnant(true);
    }
    setNotification(`✓ ABHA Profile Synced: ${profile.fullName} (${profile.abhaAddress})`);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Organic Blurred Refraction Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[110px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-amber-500/08 blur-[110px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-cyan-500/08 blur-[110px]" />
      </div>

      {/* Top Navbar Header with Frosted Glass */}
      <header className="glass-panel border-x-0 border-t-0 rounded-none backdrop-blur-xl px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 text-sm">
            SO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">Front-Desk Command Console</h1>
              <span className="glass-pill px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                POS Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Dr. Sneha Rao & Dr. Arjun Reddy • Session Active</p>
          </div>
        </div>

        {/* Connectivity, Bluetooth Printer, Audit, Lab Gate & ABDM Actions */}
        <div className="flex items-center gap-2">
          {/* Audit Ledger & Pilferage Shield Modal Button */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Ledger</span>
          </button>

          {/* Dental Lab Gate Modal Button */}
          <button
            onClick={() => setIsLabModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums">Lab Gate ({labOrders.filter((o) => o.status !== 'QcVerified').length})</span>
          </button>

          {/* ABDM Scan & Share M1 Button */}
          <button
            onClick={() => setIsAbdmModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-400" />
            <span>ABHA M1 (F3)</span>
          </button>

          {/* Web Bluetooth Thermal Printer Connect */}
          <button
            onClick={() => {
              thermalPrinter
                .connectBluetoothPrinter()
                .then((name) => setNotification(`✓ Connected to ${name}`))
                .catch(() => alert('Web Bluetooth: Make sure printer is powered ON and paired.'));
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 glass-panel-nested hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] rounded-xl text-xs font-medium transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>58mm ESC/POS</span>
          </button>

          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
            }`}
          >
            {isConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span className="tabular-nums">
              {isConnected ? '<5ms Live Fanout' : isOfflineMode ? 'IndexedDB Offline' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Floating Notification Banner */}
      {notification && (
        <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-6 py-2.5 text-xs font-medium text-emerald-200 flex items-center justify-between backdrop-blur-md relative z-30">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </span>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Main Asymmetric Bento Grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Walk-in Check-in POS & Dental Lab Gate (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Check-in POS Card */}
          <div className="glass-panel rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Walk-In Patient Check-In</h2>
                  <p className="text-[11px] text-slate-400">Direct admission & thermal ticket issuance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAbdmModalOpen(true)}
                className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                ⚡ ABHA Scan
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Patient Full Name <span className="text-emerald-400 font-mono">(F1) *</span>
                </label>
                <input
                  id="patient-name-input"
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#111318]/90 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all font-medium"
                />
                {abhaAddress && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Linked ABHA: {abhaAddress}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Household Mobile</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#111318]/90 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#111318]/90 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Regular">Regular Walk-In</option>
                    <option value="Emergency">🚨 Acute Emergency (F2)</option>
                    <option value="LabReturn">Lab / X-Ray Return</option>
                    <option value="LateGrace">Late Grace Arrival</option>
                  </select>
                </div>
              </div>

              {/* Priority Checkbox (Elderly/Pregnant -> Priority Zone) */}
              <div className="flex items-center justify-between p-3.5 glass-panel-nested rounded-[18px] border border-white/[0.06]">
                <div>
                  <div className="text-xs font-bold text-white">Priority Elderly / Pregnant / Wheelchair</div>
                  <div className="text-[11px] text-slate-400">Allocates designated P-Zone physical seating</div>
                </div>
                <input
                  type="checkbox"
                  checked={isElderlyOrPregnant}
                  onChange={(e) => setIsElderlyOrPregnant(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              {/* Family Cluster Registration (Arriving Together) */}
              <div className="p-3.5 glass-panel-nested rounded-[18px] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Family Cluster (Arriving Together)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Generates linked #14A & #14B tokens & adjacent seats</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFamilyCluster}
                    onChange={(e) => setIsFamilyCluster(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {isFamilyCluster && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-2 animate-fadeIn">
                    <label className="block text-[11px] font-semibold text-emerald-300">
                      Secondary Family Member (Spouse / Child):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Meera Kumar (Spouse, Age 34)"
                      value={familyMemberName}
                      onChange={(e) => setFamilyMemberName(e.target.value)}
                      className="w-full bg-[#111318] border border-emerald-500/30 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}
              </div>

              {/* Late Grace Interleaving Checkbox */}
              <div className="flex items-center justify-between p-3.5 glass-panel-nested rounded-[18px] border border-white/[0.06]">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Late Grace Arrival (&gt;15m past slot)</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Interleaves at active + 2 (punctual patients not bumped)</div>
                </div>
                <input
                  type="checkbox"
                  checked={isLateArrival}
                  onChange={(e) => setIsLateArrival(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Dental Prosthodontic Lab Gate Check */}
              <div className="p-3.5 glass-panel-nested rounded-[18px] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-amber-400" />
                      <span>Prosthodontic Lab Dependency Gate</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Check if visit requires crown/bridge delivery</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiresLabWork}
                    onChange={(e) => setRequiresLabWork(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {requiresLabWork && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                      Link Verified External Lab Case:
                    </label>
                    <select
                      value={selectedLabOrderId}
                      onChange={(e) => setSelectedLabOrderId(e.target.value)}
                      className="w-full bg-[#111318] border border-amber-500/30 rounded-xl p-2 text-xs text-white focus:outline-none"
                    >
                      {labOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.prosthesis_type} ({o.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-[18px] shadow-lg shadow-emerald-500/20 text-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Check-In & Print 58mm Token</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Dental Lab Orders Inspection & QC Verification Widget */}
          <div className="glass-panel rounded-[28px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">External Lab Parcel QC Gate</h3>
                  <p className="text-[11px] text-slate-400">Hard verification prior to patient entry</p>
                </div>
              </div>
              <span className="glass-pill px-2.5 py-0.5 text-[10px] font-mono text-amber-300">
                Lab-Gate Active
              </span>
            </div>

            <div className="space-y-3">
              {labOrders.map((order) => {
                const isVerified = order.status === 'QcVerified';
                return (
                  <div key={order.id} className="p-3.5 glass-panel-nested rounded-[18px] border border-white/[0.06]">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-white">{order.prosthesis_type}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isVerified
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isVerified ? 'QC_VERIFIED' : 'PENDING_VERIFICATION'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mb-2.5">Vendor: {order.lab_vendor_name}</div>
                    {!isVerified && (
                      <button
                        onClick={() => handleVerifyLab(order.id)}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow cursor-pointer"
                      >
                        ✓ Mark Parcel Received & QC Verified
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Physical Seat Grid & Active Patient Roster (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Waiting Room Physical Seat Grid Component */}
          <WaitingRoomSeatGrid seats={seats} occupancyPct={occupancyPct} isPeakCrowd={isPeakCrowd} />

          {/* Active Queue Tokens Roster */}
          <div className="glass-panel rounded-[28px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Active Queue Tokens Roster</h3>
                  <p className="text-[11px] text-slate-400">Live sequential & priority interleaved roster</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">{tokens.length} Active in Flow</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {tokens.map((token) => (
                <div
                  key={token.token_id}
                  className="p-3.5 glass-panel-nested rounded-[18px] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-10 rounded-xl bg-[#111318] border border-emerald-500/30 flex items-center justify-center font-mono font-black text-emerald-300 text-sm tabular-nums">
                      {token.token_display}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{token.patient_name}</span>
                        {token.category === 'Emergency' && (
                          <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-500/30">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-400 font-medium">● {token.status}</span>
                        <span>•</span>
                        <span className="tabular-nums">Est. Wait: ~{Math.round(token.estimated_wait_secs / 60)}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {token.assigned_waiting_seat && (
                      <span className="bg-[#111318] text-slate-300 font-mono text-xs px-2.5 py-1 rounded-xl border border-white/[0.08] tabular-nums">
                        Seat {token.assigned_waiting_seat}
                      </span>
                    )}

                    {/* Settle Payment Action */}
                    <button
                      onClick={() => setActivePaymentToken(token)}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Billing</span>
                    </button>

                    {/* Print 58mm Receipt */}
                    <button
                      onClick={() =>
                        thermalPrinter.printToken({
                          clinicName: 'SmartOPD & DentalFlow',
                          doctorName: 'Dr. Sneha Rao & Dr. Arjun Reddy',
                          tokenDisplay: token.token_display,
                          patientName: token.patient_name,
                          phone: '9876543210',
                          assignedSeat: token.assigned_waiting_seat || 'Lobby Waiting',
                          category: token.category,
                          estWaitMins: Math.round(token.estimated_wait_secs / 60) || 6,
                          qrCodeUrl: 'https://smartopd.in/q/demo',
                          bookedAt: token.booked_at,
                        })
                      }
                      title="Print 58mm Thermal Token"
                      className="p-1.5 glass-panel-nested hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] rounded-xl text-xs cursor-pointer transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ABDM Scan & Share M1 Modal */}
      <AbdmScanShareModal
        isOpen={isAbdmModalOpen}
        onClose={() => setIsAbdmModalOpen(false)}
        onProfileScanned={handleAbdmProfileScanned}
      />

      {/* Payment Settlement Modal */}
      {activePaymentToken && (
        <PaymentModal
          token={activePaymentToken}
          isOpen={true}
          onClose={() => setActivePaymentToken(null)}
          onPaymentSettled={(method, amt) => {
            setNotification(`✓ Payment of ₹${amt} via ${method} confirmed for ${activePaymentToken.token_display}`);
            setActivePaymentToken(null);
          }}
        />
      )}

      {/* Immutable Audit Ledger Modal */}
      <ImmutableAuditModal
        clinicId={clinicId}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Dental Lab Gate Modal */}
      <DentalLabGateModal
        orders={labOrders}
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        onVerifyOrder={handleVerifyLab}
      />
    </div>
  );
}

export default function ReceptionistDeskPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0C0E] text-white p-8">Loading Reception Console...</div>}>
      <ReceptionistDeskContent />
    </Suspense>
  );
}
