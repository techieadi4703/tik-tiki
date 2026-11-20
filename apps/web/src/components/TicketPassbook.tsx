'use client';

import React, { useState } from 'react';
import { Train, ShieldCheck, QrCode, Copy, Check, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Booking } from '../types';

interface TicketPassbookProps {
  booking: Booking;
}

export function TicketPassbook({ booking }: TicketPassbookProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPNR = () => {
    navigator.clipboard.writeText(booking.pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const depDate = new Date(booking.departure_at);
  const arrDate = new Date(booking.arrival_at);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col transition-all hover:border-slate-700">
      {/* Top Header Strip */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              Official Indian Railways e-Ticket
            </span>
            <h3 className="text-white font-bold text-sm sm:text-base leading-tight">
              {booking.train_number} · {booking.train_name}
            </h3>
          </div>
        </div>

        {/* PNR Badge */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">PNR Number</span>
            <span className="text-sm font-mono font-black text-emerald-400 tracking-wider">
              {booking.pnr}
            </span>
          </div>
          <button
            onClick={handleCopyPNR}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy PNR"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Timeline / Route Info */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            {/* Origin */}
            <div className="text-left">
              <span className="text-2xl font-black text-white block">
                {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <span className="text-sm font-bold text-slate-300 block">{booking.origin_code}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {depDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Travel Duration */}
            <div className="flex-1 flex flex-col items-center px-4">
              <span className="text-xs text-slate-400 font-mono mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {booking.class_code} Class
              </span>
              <div className="w-full flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <div className="h-0.5 flex-1 bg-slate-700" />
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* Destination */}
            <div className="text-right">
              <span className="text-2xl font-black text-white block">
                {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <span className="text-sm font-bold text-slate-300 block">{booking.dest_code}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 justify-end">
                <Calendar className="w-3 h-3" />
                {arrDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Seat & Berth Allocation Highlight */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Confirmed Seat Allocation</span>
              <div className="text-white font-bold text-base flex items-center gap-2 mt-0.5">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-md font-mono text-sm">
                  Coach {booking.coach_number || 'B2'}
                </span>
                <span className="bg-slate-800 text-white border border-slate-700 px-2 py-0.5 rounded-md font-mono text-sm">
                  Berth {booking.berth_number || 24} ({booking.berth_type || 'LOWER'})
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Booking Status</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> CONFIRMED (CNF)
              </span>
            </div>
          </div>

          {/* Passenger Manifest */}
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5 block">
              Passenger Manifest
            </span>
            <div className="flex flex-col gap-1.5">
              {booking.passengers.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {p.full_name} ({p.age}y, {p.gender})
                  </span>
                  <span className="text-slate-400 font-mono">
                    Pref: {p.berth_preference || 'Lower'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code & IRCTC Attribution Side */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-md">
            <QrCode className="w-24 h-24 text-slate-950" />
          </div>

          <div className="text-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-mono">IRCTC Account</span>
            <span className="text-slate-300 font-bold font-mono">{booking.irctc_username}</span>
          </div>

          <div className="text-xs border-t border-slate-800 w-full pt-2 flex items-center justify-between">
            <span className="text-slate-400">Total Paid</span>
            <span className="text-white font-black font-mono">₹{booking.total_fare.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
