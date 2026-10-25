'use client';

import React from 'react';
import { WaitingSeat, WaitingSeatType } from '../../lib/types';
import { Armchair, AlertTriangle, UserCheck, ShieldAlert, Heart, Accessibility } from 'lucide-react';

interface WaitingRoomSeatGridProps {
  seats: WaitingSeat[];
  occupancyPct: number;
  isPeakCrowd: boolean;
  onSeatClick?: (seat: WaitingSeat) => void;
}

export const WaitingRoomSeatGrid: React.FC<WaitingRoomSeatGridProps> = ({
  seats,
  occupancyPct,
  isPeakCrowd,
  onSeatClick,
}) => {
  const getSeatIcon = (type: WaitingSeatType) => {
    switch (type) {
      case 'PriorityElderlyPregnant':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'Wheelchair':
        return <Accessibility className="w-3.5 h-3.5 text-cyan-400" />;
      case 'NumbingLounge':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'IsolationFever':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <Armchair className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSeatStyle = (type: WaitingSeatType, isOccupied: boolean) => {
    if (isOccupied) {
      return 'bg-amber-500/10 text-amber-200 border-amber-500/30 hover:border-amber-400/60 shadow-[0_2px_12px_rgba(245,158,11,0.08)]';
    }
    switch (type) {
      case 'PriorityElderlyPregnant':
        return 'bg-rose-500/10 text-rose-200 border-rose-500/25 hover:border-rose-400/50 hover:bg-rose-500/15';
      case 'Wheelchair':
        return 'bg-cyan-500/10 text-cyan-200 border-cyan-500/25 hover:border-cyan-400/50 hover:bg-cyan-500/15';
      case 'NumbingLounge':
        return 'bg-amber-500/10 text-amber-200 border-amber-500/25 hover:border-amber-400/50 hover:bg-amber-500/15';
      default:
        return 'bg-emerald-500/10 text-emerald-200 border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-500/15';
    }
  };

  return (
    <div className="glass-panel rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
      {/* Header with Occupancy Meter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Armchair className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-tight">Waiting Lobby Physical Graph</h3>
              <p className="text-xs text-slate-400">
                Directed spatial allocator & priority zoning (A-01, P-01, N-01)
              </p>
            </div>
          </div>
        </div>

        {/* Occupancy Indicator with Tabular Metric */}
        <div className="flex items-center gap-3.5 glass-panel-nested rounded-2xl px-4 py-2.5 border border-white/[0.08]">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Lobby Load</span>
            <div className="text-sm font-extrabold text-white flex items-center justify-end gap-1.5 tabular-nums">
              <span>{occupancyPct}%</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isPeakCrowd ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                }`}
              />
            </div>
          </div>
          <div className="w-20 bg-slate-900/80 rounded-full h-2 p-0.5 border border-white/[0.05] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPct > 80 ? 'bg-rose-500' : occupancyPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, occupancyPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Peak Crowd Alert Banner */}
      {isPeakCrowd && (
        <div className="mb-4 flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-[18px] text-rose-200 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <strong className="font-bold text-rose-100">Peak Crowd Mode Active ({occupancyPct}% Occupancy):</strong>{' '}
            Lobby exceeds 80% capacity. Automated guidance: Kindly limit to 1 attendant per patient.
          </div>
        </div>
      )}

      {/* Seat Grid with Concentric 18px Radii */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {seats.map((seat) => {
          const isOccupied = seat.occupied_by_token !== null;
          return (
            <button
              key={seat.seat_id}
              onClick={() => onSeatClick && onSeatClick(seat)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-[18px] border transition-all duration-150 text-center ${getSeatStyle(
                seat.seat_type,
                isOccupied
              )} ${isOccupied ? 'cursor-pointer' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full mb-1 px-0.5">
                {getSeatIcon(seat.seat_type)}
                <span className="text-[10px] font-mono tracking-wider font-semibold opacity-75">
                  {seat.zone_name.split(' ')[0]}
                </span>
              </div>

              <div className="text-sm font-extrabold tracking-tight my-0.5 tabular-nums text-white">
                {seat.seat_code}
              </div>

              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
                {isOccupied ? (
                  <span className="flex items-center gap-1 text-amber-300">
                    <UserCheck className="w-2.5 h-2.5" />
                    <span>Occupied</span>
                  </span>
                ) : (
                  <span className="text-emerald-400/80 group-hover:text-emerald-300">Free</span>
                )}
              </div>

              {seat.seat_type === 'PriorityElderlyPregnant' && (
                <div className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-rose-500 text-[8px] font-bold text-white rounded-full uppercase shadow-sm">
                  Priority
                </div>
              )}
              {seat.seat_type === 'NumbingLounge' && (
                <div className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-amber-500 text-[8px] font-bold text-slate-950 rounded-full uppercase shadow-sm">
                  Dental LA
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend with Glass Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-3.5 border-t border-white/[0.06] text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-300 text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-slate-300 text-[11px]">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-rose-400" />
            <span className="text-slate-300 text-[11px]">P-Zone (Priority)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span className="text-slate-300 text-[11px]">N-Zone (Dental Numbing)</span>
          </div>
        </div>
        <span className="font-mono text-[10px] text-slate-500">Auto-allocated via Tokio Graph</span>
      </div>
    </div>
  );
};
