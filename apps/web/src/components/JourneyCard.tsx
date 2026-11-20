'use client';

import React, { useState } from 'react';
import {
  Train,
  Bus,
  Plane,
  Bell,
  Ticket,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  UtensilsCrossed,
  Zap,
  Clock,
  MapPin,
  PlugZap,
  Briefcase,
} from 'lucide-react';
import { NormalizedOffer, ClassOption } from '../types';

interface JourneyCardProps {
  offer: NormalizedOffer;
  onOpenAlertModal: (offer: NormalizedOffer) => void;
  onOpenBookingModal?: (offer: NormalizedOffer) => void;
  onOpenCoachModal?: (offer: NormalizedOffer) => void;
}

export function JourneyCard({
  offer,
  onOpenAlertModal,
  onOpenBookingModal,
  onOpenCoachModal,
}: JourneyCardProps) {
  const [showHalts, setShowHalts] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('3A');

  const currentClasses: ClassOption[] = offer.classes && offer.classes.length > 0
    ? offer.classes
    : [
        { code: '3A', name: 'AC 3 Tier', fare: offer.price, status: offer.status, seats: offer.available_seats || 8 },
        { code: '2A', name: 'AC 2 Tier', fare: Math.round(offer.price * 1.35), status: 'AVAILABLE', seats: 6 },
        { code: '1A', name: 'AC First Class', fare: Math.round(offer.price * 1.8), status: 'AVAILABLE', seats: 2 },
        { code: 'SL', name: 'Sleeper Class', fare: Math.round(offer.price * 0.42), status: 'WAITLIST', seats: 18 },
      ];

  const activeClassObj = currentClasses.find((c) => c.code === selectedClass) || currentClasses[0];
  const activeFare = activeClassObj.fare;
  const activeStatus = activeClassObj.status;
  const activeSeats = activeClassObj.seats;

  const getModeIcon = () => {
    switch (offer.mode) {
      case 'RAIL':
        return <Train className="w-4 h-4 text-emerald-400" />;
      case 'BUS':
        return <Bus className="w-4 h-4 text-emerald-400" />;
      case 'FLIGHT':
        return <Plane className="w-4 h-4 text-violet-400" />;
      default:
        return <Train className="w-4 h-4 text-zinc-400" />;
    }
  };

  const isWaitlist = activeStatus === 'WAITLIST' || activeStatus === 'SOLD_OUT';
  const allWeekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayNameMap: Record<string, number> = {
    MON: 0,
    TUE: 1,
    WED: 2,
    THU: 3,
    FRI: 4,
    SAT: 5,
    SUN: 6,
  };

  const activeDaysSet = new Set(
    (offer.days_of_run || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).map(
      (d) => dayNameMap[d] ?? 0
    )
  );

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-750 rounded-2xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-lg flex flex-col gap-4">
      {/* Top Header: Train Name, Service Number, Days of Run & Value Index */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-850 border border-zinc-750 shrink-0">
            {getModeIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-white font-bold text-sm sm:text-base leading-tight">
                {offer.operator_name}
              </h4>
              <span className="text-xs text-zinc-400 font-mono font-semibold bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50">
                {offer.service_number}
              </span>
            </div>

            {/* Days of Run Calendar & Punctuality */}
            {offer.mode === 'RAIL' && (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-medium mr-0.5">Runs:</span>
                  {allWeekDays.map((day, idx) => (
                    <span
                      key={idx}
                      className={`h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center font-mono ${
                        activeDaysSet.has(idx)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-zinc-850 text-zinc-600'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>

                <span className="text-zinc-600">•</span>

                <div className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{offer.punctuality_rating || 94}% On-Time</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Travel Value Index */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Value Index</div>
            <div className="text-xs font-semibold text-zinc-300">Fast & Direct</div>
          </div>
          <div
            className={`px-2.5 py-1 rounded-xl font-black text-xs border ${
              offer.score >= 85
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                : offer.score >= 70
                ? 'bg-sky-950/80 text-sky-400 border-sky-800/60'
                : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
            }`}
          >
            {offer.score} / 100
          </div>
        </div>
      </div>

      {/* Timeline, Platform & Fare Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Origin -> Duration -> Destination */}
        <div className="sm:col-span-8 flex items-center justify-between gap-3">
          {/* Departure */}
          <div className="text-left">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {new Date(offer.departure_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
            <div className="text-xs text-zinc-300 font-bold uppercase mt-0.5">{offer.origin_code}</div>
            {offer.departure_platform && (
              <span className="text-[10px] text-zinc-500 font-mono block">
                {offer.departure_platform}
              </span>
            )}
          </div>

          {/* Duration Graphic */}
          <div className="flex-1 flex flex-col items-center px-2">
            <span className="text-[11px] font-semibold text-zinc-400 mb-1 font-mono">
              {Math.floor(offer.duration_minutes / 60)}h {offer.duration_minutes % 60}m
            </span>
            <div className="w-full flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <div className="h-0.5 flex-1 bg-zinc-700 relative">
                {offer.transfers === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center -top-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider bg-zinc-900 px-1">
                      Direct
                    </span>
                  </span>
                )}
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>

            {/* Halts Button */}
            {offer.stops && offer.stops.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHalts(!showHalts)}
                className="mt-1.5 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 transition-colors"
              >
                {offer.stops.length} Halts
                {showHalts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Arrival */}
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {new Date(offer.arrival_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
            <div className="text-xs text-zinc-300 font-bold uppercase mt-0.5">{offer.dest_code}</div>
            {offer.arrival_platform && (
              <span className="text-[10px] text-zinc-500 font-mono block">
                {offer.arrival_platform}
              </span>
            )}
          </div>
        </div>

        {/* Fare and Status Action */}
        <div className="sm:col-span-4 flex sm:flex-col sm:items-end justify-between items-center gap-2 border-t sm:border-t-0 border-zinc-800/60 pt-3 sm:pt-0">
          <div className="text-left sm:text-right">
            <div className="text-2xl font-black text-white">
              ₹{Math.round(activeFare).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-zinc-400 font-medium">
              {offer.mode === 'FLIGHT'
                ? 'Economy Non-stop · Taxes & baggage incl.'
                : offer.mode === 'BUS'
                ? 'AC Sleeper · Tolls & GST incl.'
                : `Class ${selectedClass} · All taxes incl.`}
            </div>
          </div>

          <div>
            {activeStatus === 'AVAILABLE' ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Available ({activeSeats})
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2.5 py-1 rounded-lg">
                Waitlist {activeSeats || 18}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Class Fare Breakdown Selector Strip */}
      {offer.mode === 'RAIL' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-zinc-800/50 pt-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1 shrink-0">Class:</span>
          {currentClasses.map((cls) => {
            const isSelected = selectedClass === cls.code;
            return (
              <button
                key={cls.code}
                type="button"
                onClick={() => setSelectedClass(cls.code)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
                }`}
              >
                <span className="font-bold">{cls.code}</span>
                <span className="text-zinc-400 font-mono text-[11px]">₹{Math.round(cls.fare).toLocaleString('en-IN')}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    cls.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {cls.status === 'AVAILABLE' ? `CNF ${cls.seats}` : `WL ${cls.seats}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Expandable Route Halts Drawer */}
      {showHalts && offer.stops && offer.stops.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 sm:p-4 text-xs flex flex-col gap-2">
          <div className="font-bold text-zinc-300 flex items-center justify-between border-b border-zinc-850 pb-2">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Complete Route Timetable & Halts
            </span>
            <span className="text-zinc-500 text-[11px] font-mono">{offer.stops.length} stations scheduled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-zinc-300">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-850">
                  <th className="py-1">Station</th>
                  <th className="py-1">Arrive</th>
                  <th className="py-1">Depart</th>
                  <th className="py-1">Halt</th>
                  <th className="py-1">Platform</th>
                  <th className="py-1 text-right">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 font-mono text-[11px]">
                {offer.stops.map((stop, i) => (
                  <tr key={i} className="hover:bg-zinc-900/50">
                    <td className="py-1.5 font-sans font-medium text-white">
                      {stop.station_name} ({stop.station_code})
                    </td>
                    <td className="py-1.5 text-zinc-400">{stop.scheduled_arrive || '--:--'}</td>
                    <td className="py-1.5 text-zinc-400">{stop.scheduled_depart || '--:--'}</td>
                    <td className="py-1.5 text-emerald-400 font-bold">
                      {stop.halt_minutes ? `${stop.halt_minutes}m` : '--'}
                    </td>
                    <td className="py-1.5 text-zinc-400">{stop.platform_number ? `PF ${stop.platform_number}` : '-'}</td>
                    <td className="py-1.5 text-right text-zinc-500">{stop.distance_km} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer: Amenities & Booking Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
        {/* Amenities Badges based on mode */}
        {offer.mode === 'FLIGHT' ? (
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-emerald-400" /> 15 kg Check-in
            </span>
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Plane className="w-3 h-3 text-sky-400" /> Non-stop Flight
            </span>
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3 text-amber-400" /> In-flight Meals
            </span>
          </div>
        ) : offer.mode === 'BUS' ? (
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Bus className="w-3 h-3 text-amber-400" /> AC Sleeper (2+1)
            </span>
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <PlugZap className="w-3 h-3 text-sky-400" /> Charging Sockets
            </span>
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" /> Live GPS Tracking
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {offer.pantry_available && (
              <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3 text-amber-400" /> Pantry Car
              </span>
            )}
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" /> e-Catering Available
            </span>
            <span className="text-[11px] text-zinc-400 bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded-md flex items-center gap-1">
              <PlugZap className="w-3 h-3 text-sky-400" /> Charging Sockets
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {offer.mode === 'RAIL' && (
            <button
              type="button"
              onClick={() => onOpenCoachModal?.(offer)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-700 transition-colors shadow-sm"
              title="Inspect interactive coach berth diagram"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coach Layout</span>
            </button>
          )}

          {isWaitlist && (
            <button
              onClick={() => onOpenAlertModal(offer)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              Set WhatsApp Alert
            </button>
          )}

          {offer.mode === 'FLIGHT' ? (
            <button
              type="button"
              onClick={() => {
                if (offer.booking_url) {
                  window.open(offer.booking_url, '_blank');
                } else {
                  onOpenBookingModal?.(offer);
                }
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Select Flight <Plane className="w-3.5 h-3.5" />
            </button>
          ) : offer.mode === 'BUS' ? (
            <button
              type="button"
              onClick={() => {
                if (offer.booking_url) {
                  window.open(offer.booking_url, '_blank');
                } else {
                  onOpenBookingModal?.(offer);
                }
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Select Bus Seat <Bus className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onOpenBookingModal?.({
                  ...offer,
                  price: activeFare,
                  status: activeStatus as 'AVAILABLE' | 'WAITLIST',
                  available_seats: activeSeats,
                })
              }
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Book Ticket <Ticket className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
