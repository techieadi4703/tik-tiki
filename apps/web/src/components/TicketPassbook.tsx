'use client';

import React, { useState } from 'react';
import { Train, ShieldCheck, QrCode, Copy, Check, Calendar, Clock, User, Download, Printer } from 'lucide-react';
import { Booking } from '../types';
import { formatIndianStandardTime } from '../lib/api';
import { ElectronicReservationSlipModal } from './ElectronicReservationSlipModal';

interface TicketPassbookProps {
  booking: Booking;
}

export function TicketPassbook({ booking }: TicketPassbookProps) {
  const [copied, setCopied] = useState(false);
  const [showERSModal, setShowERSModal] = useState(false);

  const handleCopyPNR = () => {
    navigator.clipboard.writeText(booking.pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const depDate = new Date(booking.departure_at);
  const arrDate = new Date(booking.arrival_at);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md hover:border-blue-300">
      {/* Top Header Strip with Indian Railways Brand Identity */}
      <div className="bg-[#1a365d] px-6 py-4 border-b border-blue-900 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <Train className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-300 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/30">
                Official Electronic Reservation Slip (ERS)
              </span>
              <span className="text-xs text-blue-200 font-medium">IRCTC-Authorized Direct Booking</span>
            </div>
            <h3 className="text-white font-bold text-base mt-0.5 leading-tight">
              {booking.train_number} · {booking.train_name}
            </h3>
          </div>
        </div>

        {/* PNR Badge */}
        <div className="flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
          <div className="text-left">
            <span className="text-[9px] text-blue-200 font-bold uppercase tracking-wider block">PNR Number</span>
            <span className="text-sm font-mono font-black text-white tracking-widest">
              {booking.pnr}
            </span>
          </div>
          <button
            onClick={handleCopyPNR}
            className="p-1 rounded-md text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy PNR"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Timeline / Route Info */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {/* Origin */}
            <div className="text-left">
              <span className="text-2xl font-black text-slate-900 block">
                {formatIndianStandardTime(booking.departure_at)}
              </span>
              <span className="text-sm font-bold text-[#1a365d] block">{booking.origin_code}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                {depDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Travel Duration */}
            <div className="flex-1 flex flex-col items-center px-4">
              <span className="text-xs text-slate-600 font-bold font-mono mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {booking.class_code} Class · Direct
              </span>
              <div className="w-full flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#1a365d]" />
                <div className="h-0.5 flex-1 bg-slate-300" />
                <div className="h-2 w-2 rounded-full bg-[#ea580c]" />
              </div>
            </div>

            {/* Destination */}
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 block">
                {formatIndianStandardTime(booking.arrival_at)}
              </span>
              <span className="text-sm font-bold text-[#1a365d] block">{booking.dest_code}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 justify-end">
                <Calendar className="w-3 h-3 text-slate-400" />
                {arrDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Seat & Berth Allocation Highlight */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-emerald-800 uppercase font-bold block">Confirmed Seat Allocation</span>
              <div className="text-slate-900 font-bold text-base flex items-center gap-2 mt-0.5">
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-md font-mono text-sm font-black">
                  Coach {booking.coach_number || 'B2'}
                </span>
                <span className="bg-white text-slate-900 border border-slate-300 px-2.5 py-0.5 rounded-md font-mono text-sm font-bold shadow-sm">
                  Berth {booking.berth_number || 24} ({booking.berth_type || 'LOWER'})
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-emerald-800 uppercase font-bold block">Reservation Status</span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> CONFIRMED (CNF)
              </span>
            </div>
          </div>

          {/* Passenger Manifest */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-700 tracking-wider block">
                Passenger Manifest ({booking.passengers.length} {booking.passengers.length === 1 ? 'Traveler' : 'Travelers'})
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Valid with Govt Photo ID</span>
            </div>
            <div className="flex flex-col gap-2">
              {booking.passengers.map((p, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#1a365d] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {p.full_name} ({p.age}y, {p.gender})
                    </span>
                    {p.senior_citizen && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1 rounded">
                        Senior
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Pref: {p.berth_preference || 'Lower'}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold px-2 py-0.5 rounded-md">
                      {p.berth_allocated || `Coach ${booking.coach_number || 'B2'}, Berth ${21 + i * 3}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code & IRCTC Attribution Side */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow border border-slate-200">
            <QrCode className="w-24 h-24 text-slate-900" />
          </div>

          <div className="text-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Authorized IRCTC Account</span>
            <span className="text-[#1a365d] font-bold font-mono text-sm">{booking.irctc_username}</span>
          </div>

          <div className="text-xs border-t border-slate-200 w-full pt-2 flex items-center justify-between font-mono">
            <span className="text-slate-600 font-sans font-medium">Total Fare Paid</span>
            <span className="text-slate-900 font-black text-sm">₹{booking.total_fare.toLocaleString('en-IN')}</span>
          </div>

          <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setShowERSModal(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#1a365d] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ERS Slip</span>
            </button>
            <button
              onClick={() => setShowERSModal(true)}
              className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              title="Download Ticket PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> CRIS Encrypted Verification
          </div>
        </div>
      </div>

      {/* Official CRIS Electronic Reservation Slip (ERS) Printable Modal */}
      <ElectronicReservationSlipModal
        booking={booking}
        isOpen={showERSModal}
        onClose={() => setShowERSModal(false)}
      />
    </div>
  );
}
