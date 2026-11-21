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
import { resolveStationDisplayName, formatIndianStandardTime } from '../lib/api';

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

  // Initialize selected class accurately according to train archetype
  const isVandeBharatOrShatabdi = /vande|shatabdi/i.test(offer.operator_name || '') || /vande|shatabdi/i.test(offer.service_number || '');
  const isRajdhani = /rajdhani/i.test(offer.operator_name || '') || /rajdhani/i.test(offer.service_number || '');

  const defaultClasses: ClassOption[] = offer.classes && offer.classes.length > 0
    ? offer.classes
    : isVandeBharatOrShatabdi
    ? [
        { code: 'CC', name: 'AC Chair Car', fare: offer.price, status: offer.status, seats: offer.available_seats || 14 },
        { code: 'EC', name: 'Exec Chair Car', fare: Math.round(offer.price * 1.85), status: 'AVAILABLE', seats: 4 },
      ]
    : isRajdhani
    ? [
        { code: '3A', name: 'AC 3 Tier', fare: offer.price, status: offer.status, seats: offer.available_seats || 8 },
        { code: '2A', name: 'AC 2 Tier', fare: Math.round(offer.price * 1.35), status: 'AVAILABLE', seats: 6 },
        { code: '1A', name: 'AC First Class', fare: Math.round(offer.price * 1.8), status: 'AVAILABLE', seats: 2 },
      ]
    : [
        { code: '3A', name: 'AC 3 Tier', fare: offer.price, status: offer.status, seats: offer.available_seats || 8 },
        { code: '2A', name: 'AC 2 Tier', fare: Math.round(offer.price * 1.35), status: 'AVAILABLE', seats: 6 },
        { code: '1A', name: 'AC First Class', fare: Math.round(offer.price * 1.8), status: 'AVAILABLE', seats: 2 },
        { code: 'SL', name: 'Sleeper Class', fare: Math.round(offer.price * 0.42), status: 'WAITLIST', seats: 18 },
      ];

  const [selectedClass, setSelectedClass] = useState<string>(
    defaultClasses.find((c) => c.code === '3A')?.code || defaultClasses[0]?.code || '3A'
  );

  const currentClasses = offer.classes && offer.classes.length > 0 ? offer.classes : defaultClasses;
  const activeClassObj = currentClasses.find((c) => c.code === selectedClass) || currentClasses[0];
  const activeFare = activeClassObj.fare;
  const activeStatus = activeClassObj.status;
  const activeSeats = activeClassObj.seats;

  const isWaitlist = activeStatus === 'WAITLIST' || offer.status === 'WAITLIST';

  const getModeIcon = () => {
    switch (offer.mode) {
      case 'BUS':
        return <Bus className="w-5 h-5 text-orange-600" />;
      case 'FLIGHT':
        return <Plane className="w-5 h-5 text-blue-600" />;
      default:
        return <Train className="w-5 h-5 text-[#1a365d]" />;
    }
  };

  const allDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const runDays = offer.days_of_run || allDays;

  return (
    <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all text-slate-900">
      {/* Top Header: Train / Flight / Bus Operator & Value Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0">
            {getModeIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-base sm:text-lg text-slate-900">
                {offer.operator_name}
              </span>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                {offer.service_number}
              </span>
            </div>

            {/* Days of Run & Punctuality */}
            {offer.mode === 'RAIL' && (
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span className="text-slate-400 mr-0.5">Runs:</span>
                  {allDays.map((d) => {
                    const runs = runDays.some((rd) => rd.toUpperCase().startsWith(d));
                    return (
                      <span
                        key={d}
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono ${
                          runs
                            ? 'bg-emerald-100 text-emerald-800 font-black'
                            : 'bg-slate-100 text-slate-300'
                        }`}
                      >
                        {d[0]}
                      </span>
                    );
                  })}
                </div>
                {offer.punctuality_rating && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" /> {offer.punctuality_rating}% On-Time
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Journey Score Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Value Index
            </span>
            <span className="text-xs text-slate-500 font-medium">Fast & Direct</span>
          </div>
          <div
            className={`px-3 py-1 rounded-xl text-xs font-black border shadow-sm ${
              offer.score >= 85
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : offer.score >= 70
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {offer.score} / 100
          </div>
        </div>
      </div>

      {/* Main Timings, Duration & Fare Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Origin -> Duration -> Destination */}
        <div className="sm:col-span-8 flex items-center justify-between gap-3">
          {/* Departure */}
          <div className="text-left max-w-[210px]">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {formatIndianStandardTime(offer.departure_at)}
            </span>
            <div className="text-sm text-slate-900 font-black uppercase mt-0.5">{offer.origin_code}</div>
            <div className="text-xs text-slate-500 font-semibold truncate" title={resolveStationDisplayName(offer.origin_code, offer.mode)}>
              {resolveStationDisplayName(offer.origin_code, offer.mode)}
            </div>
            {offer.departure_platform && (
              <span className="text-[11px] text-[#1a365d] font-bold block mt-0.5">
                {offer.departure_platform}
              </span>
            )}
          </div>

          {/* Duration Graphic */}
          <div className="flex-1 flex flex-col items-center px-3 min-w-[120px]">
            <span className="text-xs font-extrabold text-slate-700 font-mono mb-2.5 tracking-tight">
              {Math.floor(offer.duration_minutes / 60)}h {offer.duration_minutes % 60}m
            </span>
            <div className="w-full flex items-center gap-1 relative py-0.5">
              <div className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
              <div className="h-0.5 flex-1 bg-slate-300 relative flex items-center justify-center">
                {offer.transfers === 0 && (
                  <span className="text-[10px] uppercase font-black text-slate-600 tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
                    Direct
                  </span>
                )}
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
            </div>

            {/* Halts Button */}
            {offer.stops && offer.stops.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHalts(!showHalts)}
                className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 transition-colors bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full"
              >
                {offer.stops.length} Halts
                {showHalts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Arrival */}
          <div className="text-right max-w-[210px]">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {formatIndianStandardTime(offer.arrival_at)}
            </span>
            <div className="text-sm text-slate-900 font-black uppercase mt-0.5">{offer.dest_code}</div>
            <div className="text-xs text-slate-500 font-semibold truncate text-right" title={resolveStationDisplayName(offer.dest_code, offer.mode)}>
              {resolveStationDisplayName(offer.dest_code, offer.mode)}
            </div>
            {offer.arrival_platform && (
              <span className="text-[11px] text-[#1a365d] font-bold block mt-0.5">
                {offer.arrival_platform}
              </span>
            )}
          </div>
        </div>

        {/* Fare and Status Action */}
        <div className="sm:col-span-4 flex sm:flex-col sm:items-end justify-between items-center gap-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{Math.round(activeFare).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {offer.mode === 'FLIGHT'
                ? 'Economy Non-stop · Taxes & baggage incl.'
                : offer.mode === 'BUS'
                ? 'AC Sleeper · Tolls & GST incl.'
                : `Class ${selectedClass} · All taxes incl.`}
            </div>
          </div>

          <div>
            {activeStatus === 'AVAILABLE' ? (
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Available ({activeSeats})
              </span>
            ) : (
              <span className="text-xs font-black text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg">
                Waitlist {activeSeats || 18}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Class Fare Breakdown Selector Strip */}
      {offer.mode === 'RAIL' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Class:</span>
          {currentClasses.map((cls) => {
            const isSelected = selectedClass === cls.code;
            return (
              <button
                key={cls.code}
                type="button"
                onClick={() => setSelectedClass(cls.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-blue-600 text-blue-900 shadow-sm ring-2 ring-blue-100 font-extrabold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800 font-semibold'
                }`}
              >
                <span className="font-black text-sm">{cls.code}</span>
                <span className="font-mono text-xs font-bold">₹{Math.round(cls.fare).toLocaleString('en-IN')}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    cls.status === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
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
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs flex flex-col gap-2">
          <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5 text-sm font-black text-[#1a365d]">
              <MapPin className="w-4 h-4 text-orange-600" /> Complete Route Timetable & Halts
            </span>
            <span className="text-slate-500 text-xs font-mono">{offer.stops.length} stations scheduled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-700">
              <thead>
                <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-100">
                  <th className="py-2 px-3">Station</th>
                  <th className="py-2 px-3">Arrive</th>
                  <th className="py-2 px-3">Depart</th>
                  <th className="py-2 px-3">Halt</th>
                  <th className="py-2 px-3">Platform</th>
                  <th className="py-2 px-3 text-right">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono text-xs">
                {offer.stops.map((stop, i) => (
                  <tr key={i} className="hover:bg-slate-100/70">
                    <td className="py-2 px-3 font-sans font-bold text-slate-900">
                      {stop.station_name} ({stop.station_code})
                    </td>
                    <td className="py-2 px-3 text-slate-600">{stop.scheduled_arrive || '--:--'}</td>
                    <td className="py-2 px-3 text-slate-600">{stop.scheduled_depart || '--:--'}</td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">
                      {stop.halt_minutes ? `${stop.halt_minutes}m` : '--'}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{stop.platform_number ? `PF ${stop.platform_number}` : '-'}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{stop.distance_km} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer: Amenities & Booking Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Amenities Badges based on mode */}
        {offer.mode === 'FLIGHT' ? (
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" /> 15 kg Check-in
            </span>
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <Plane className="w-3.5 h-3.5 text-blue-600" /> Non-stop Flight
            </span>
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" /> In-flight Meals
            </span>
          </div>
        ) : offer.mode === 'BUS' ? (
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <Bus className="w-3.5 h-3.5 text-orange-600" /> AC Sleeper (2+1)
            </span>
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <PlugZap className="w-3.5 h-3.5 text-blue-600" /> Charging Sockets
            </span>
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Live GPS Tracking
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {offer.pantry_available && (
              <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
                <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" /> Pantry Car
              </span>
            )}
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> e-Catering Available
            </span>
            <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <PlugZap className="w-3.5 h-3.5 text-blue-600" /> Charging Sockets
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {offer.mode === 'RAIL' && (
            <button
              type="button"
              onClick={() => onOpenCoachModal?.(offer)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#1a365d] font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-sm"
              title="Inspect interactive coach berth diagram"
            >
              <LayoutGrid className="w-4 h-4 text-blue-700" />
              <span>Coach Layout</span>
            </button>
          )}

          {isWaitlist && (
            <button
              onClick={() => onOpenAlertModal(offer)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 transition-colors shadow-sm"
            >
              <Bell className="w-4 h-4 text-amber-700" />
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Select Flight <Plane className="w-4 h-4" />
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Select Bus Seat <Bus className="w-4 h-4" />
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Book Ticket <Ticket className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
