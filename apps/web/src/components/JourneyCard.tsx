'use client';

import React from 'react';
import { Train, Bus, Plane, Bell, Ticket, ShieldCheck } from 'lucide-react';
import { NormalizedOffer } from '../types';

interface JourneyCardProps {
  offer: NormalizedOffer;
  onOpenAlertModal: (offer: NormalizedOffer) => void;
  onOpenBookingModal?: (offer: NormalizedOffer) => void;
}

export function JourneyCard({ offer, onOpenAlertModal, onOpenBookingModal }: JourneyCardProps) {
  const getModeIcon = () => {
    switch (offer.mode) {
      case 'RAIL':
        return <Train className="w-4 h-4 text-sky-400" />;
      case 'BUS':
        return <Bus className="w-4 h-4 text-emerald-400" />;
      case 'FLIGHT':
        return <Plane className="w-4 h-4 text-violet-400" />;
      default:
        return <Train className="w-4 h-4 text-slate-400" />;
    }
  };

  const isWaitlist = offer.status === 'WAITLIST' || offer.status === 'SOLD_OUT';

  return (
    <div className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
            {getModeIcon()}
          </div>
          <div>
            <h4 className="text-white font-bold text-sm sm:text-base leading-tight">
              {offer.operator_name}
            </h4>
            <span className="text-xs text-slate-400 font-mono">{offer.service_number}</span>
          </div>
        </div>

        {/* Journey Utility Score */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs text-slate-400 font-medium">Journey Score</span>
          <div className={`px-2.5 py-1 rounded-lg font-black text-xs border ${
            offer.score >= 85
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
              : offer.score >= 70
              ? 'bg-sky-950/80 text-sky-400 border-sky-800/60'
              : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
          }`}>
            {offer.score} / 100
          </div>
        </div>
      </div>

      {/* Timeline & Price */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-8 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-xl sm:text-2xl font-black text-white">
              {new Date(offer.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <div className="text-xs text-slate-400 font-semibold uppercase">{offer.origin_code}</div>
          </div>

          <div className="flex-1 flex flex-col items-center px-2">
            <span className="text-[11px] font-medium text-slate-400 mb-1">
              {Math.floor(offer.duration_minutes / 60)}h {offer.duration_minutes % 60}m
            </span>
            <div className="w-full flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              <div className="h-0.5 flex-1 bg-slate-700 relative">
                {offer.transfers === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center -top-2">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Direct</span>
                  </span>
                )}
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-white">
              {new Date(offer.arrival_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <div className="text-xs text-slate-400 font-semibold uppercase">{offer.dest_code}</div>
          </div>
        </div>

        {/* Fare and Status Action */}
        <div className="sm:col-span-4 flex sm:flex-col sm:items-end justify-between items-center gap-2 border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
          <div className="text-left sm:text-right">
            <div className="text-xl font-black text-white">
              ₹{offer.price.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400">Total payable</div>
          </div>

          <div className="flex items-center gap-2">
            {offer.status === 'AVAILABLE' ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Available ({offer.available_seats || 4})
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-md">
                Waitlist 42
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/50">
        <span className="text-[11px] text-slate-500 font-medium self-start sm:self-center">
          Official partner booking via {offer.operator_name}
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isWaitlist && (
            <button
              onClick={() => onOpenAlertModal(offer)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              Set Free WhatsApp Seat Alert
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenBookingModal?.(offer)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            Book Ticket <Ticket className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
