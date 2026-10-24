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
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'Wheelchair':
        return <Accessibility className="w-4 h-4 text-cyan-400" />;
      case 'NumbingLounge':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'IsolationFever':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Armchair className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSeatBadgeColor = (type: WaitingSeatType, isOccupied: boolean) => {
    if (isOccupied) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10';
    }
    switch (type) {
      case 'PriorityElderlyPregnant':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25';
      case 'Wheelchair':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25';
      case 'NumbingLounge':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header with Occupancy Meter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Armchair className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">Waiting Lobby Physical Seats</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time physical seat graph & priority zoning (A-01, P-01, N-01)
          </p>
        </div>

        {/* Occupancy Indicator */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2">
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-medium">Lobby Occupancy</span>
            <div className="text-base font-extrabold text-white flex items-center justify-end gap-1.5">
              <span>{occupancyPct}%</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isPeakCrowd ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                }`}
              />
            </div>
          </div>
          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                occupancyPct > 80 ? 'bg-rose-500' : occupancyPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, occupancyPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Peak Crowd Alert Banner */}
      {isPeakCrowd && (
        <div className="mb-4 flex items-center gap-3 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-medium animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="font-bold text-rose-100">Peak Crowd Mode Active ({occupancyPct}% Occupancy):</strong>{' '}
            Lobby is exceeding 80% capacity. TV display has instructed patients: Kindly limit to 1 attendant per patient.
          </div>
        </div>
      )}

      {/* Seat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {seats.map((seat) => {
          const isOccupied = seat.occupied_by_token !== null;
          return (
            <button
              key={seat.seat_id}
              onClick={() => onSeatClick && onSeatClick(seat)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 text-center ${getSeatBadgeColor(
                seat.seat_type,
                isOccupied
              )} ${isOccupied ? 'cursor-pointer hover:border-amber-400' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full mb-1.5 px-0.5">
                {getSeatIcon(seat.seat_type)}
                <span className="text-[10px] font-mono tracking-wider font-semibold opacity-75">
                  {seat.zone_name.split(' ')[0]}
                </span>
              </div>

              <div className="text-base font-black tracking-tight my-0.5">{seat.seat_code}</div>

              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium">
                {isOccupied ? (
                  <span className="flex items-center gap-1 text-amber-300">
                    <UserCheck className="w-3 h-3" />
                    <span>Occupied</span>
                  </span>
                ) : (
                  <span className="text-emerald-400/80 group-hover:text-emerald-300">Available</span>
                )}
              </div>

              {seat.seat_type === 'PriorityElderlyPregnant' && (
                <div className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-rose-600 text-[9px] font-bold text-white rounded-full uppercase shadow">
                  Priority
                </div>
              )}
              {seat.seat_type === 'NumbingLounge' && (
                <div className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-purple-600 text-[9px] font-bold text-white rounded-full uppercase shadow">
                  Dental LA
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>P-Zone (Elderly/Pregnant)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>N-Zone (Dental Anesthesia Lounge)</span>
          </div>
        </div>
        <span className="font-mono text-[11px] text-slate-500">Auto-allocated on Check-in</span>
      </div>
    </div>
  );
};
