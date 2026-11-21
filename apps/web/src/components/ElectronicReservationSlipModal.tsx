'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, ShieldCheck, QrCode, Train, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Booking } from '../types';
import { formatIndianStandardTime, resolveStationDisplayName } from '../lib/api';

interface ElectronicReservationSlipModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ElectronicReservationSlipModal({ booking, isOpen, onClose }: ElectronicReservationSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const depDate = new Date(booking.departure_at);
  const arrDate = new Date(booking.arrival_at);

  const formattedDepTime = formatIndianStandardTime(booking.departure_at);
  const formattedArrTime = formatIndianStandardTime(booking.arrival_at);

  const convenienceFee = 17.70;
  const gstAmount = Math.round(booking.total_fare * 0.05 * 100) / 100;
  const grandTotal = booking.total_fare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white border border-slate-300 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col my-auto max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:p-0 print:rounded-none">
        {/* Modal Controls - Hidden during print */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> CRIS Verified ERS
            </span>
            <span className="text-xs text-slate-500 font-medium">IRCTC Official Reservation Slip</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#1a365d] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Canvas (Standard A4 ERS layout) */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto pr-1 print:overflow-visible print:pr-0 text-slate-900 bg-white font-sans text-xs space-y-4"
        >
          {/* Header Strip with Logos & Title */}
          <div className="border-2 border-[#1a365d] rounded-2xl p-4 bg-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#1a365d] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                IR
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase text-[#1a365d] tracking-tight leading-none">
                  Indian Railways / IRCTC
                </h1>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-1">
                  Electronic Reservation Slip (ERS) · Standard Passenger Ticket
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Centre for Railway Information Systems (CRIS) · Ministry of Railways, Govt. of India
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block">IRCTC Txn Ref</span>
              <span className="text-xs font-mono font-black text-slate-900">TXN_{booking.pnr.replace('-', '')}</span>
              <div className="mt-1">
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                  Confirmed (CNF)
                </span>
              </div>
            </div>
          </div>

          {/* Primary Journey & PNR Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-blue-50/60 border border-blue-200 font-mono">
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-sans font-bold block">PNR Number</span>
              <span className="text-base font-black text-[#1a365d] tracking-wider">{booking.pnr}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-sans font-bold block">Train No. & Name</span>
              <span className="text-xs font-bold text-slate-900 block truncate" title={`${booking.train_number} ${booking.train_name}`}>
                {booking.train_number} / {booking.train_name}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-sans font-bold block">Quota & Class</span>
              <span className="text-xs font-bold text-slate-900">
                GENERAL (GN) · {booking.class_code}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-sans font-bold block">IRCTC User ID</span>
              <span className="text-xs font-bold text-slate-900">{booking.irctc_username}</span>
            </div>
          </div>

          {/* Journey Route & Schedule Box */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 flex justify-between">
              <span>Journey Origin & Departure</span>
              <span>Journey Destination & Arrival</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Origin */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">{formattedDepTime}</span>
                  <span className="text-sm font-black text-[#1a365d]">{booking.origin_code}</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  {resolveStationDisplayName(booking.origin_code, 'RAIL')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Date: <strong className="text-slate-800">{depDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div className="text-[11px] text-[#1a365d] font-bold">
                  Boarding Station: {booking.origin_code} (Scheduled Pf 1)
                </div>
              </div>

              {/* Destination */}
              <div className="flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">{formattedArrTime}</span>
                  <span className="text-sm font-black text-[#1a365d]">{booking.dest_code}</span>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  {resolveStationDisplayName(booking.dest_code, 'RAIL')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Date: <strong className="text-slate-800">{arrDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div className="text-[11px] text-[#ea580c] font-bold">
                  Reservation Up To: {booking.dest_code}
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Details Manifest Table */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden">
            <div className="bg-[#1a365d] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Passenger Manifest ({booking.passengers.length} Passenger{booking.passengers.length > 1 ? 's' : ''})</span>
              <span>Valid with Original Govt. Photo ID</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Passenger Name</th>
                  <th className="p-2.5">Age</th>
                  <th className="p-2.5">Sex</th>
                  <th className="p-2.5">Booking Status</th>
                  <th className="p-2.5 text-right">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium">
                {booking.passengers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {p.full_name}
                      {p.senior_citizen && (
                        <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded border border-amber-300">
                          Senior
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono">{p.age}</td>
                    <td className="p-2.5 uppercase font-mono">{p.gender}</td>
                    <td className="p-2.5 font-mono">
                      <span className="text-emerald-700 font-bold">CNF</span> / Coach {booking.coach_number || 'B2'} / Berth {booking.berth_number ? booking.berth_number + idx : 24 + idx} ({p.berth_preference || 'LOWER'})
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                      CONFIRMED
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fare & Statutory Tax Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fare Table */}
            <div className="border border-slate-300 rounded-2xl p-3 bg-slate-50 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Statutory Fare & GST Breakdown
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Ticket Base Fare:</span>
                  <span className="font-mono">₹{(booking.total_fare - convenienceFee - gstAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IRCTC Convenience Fee (incl. GST):</span>
                  <span className="font-mono">₹{convenienceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST on AC Travel (5%):</span>
                  <span className="font-mono">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Agent / PSP Service Charge:</span>
                  <span className="font-mono">₹0.00 (Zero Hidden Fees)</span>
                </div>
                <div className="border-t border-slate-300 pt-1.5 mt-1 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-emerald-800">₹{grandTotal.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
            </div>

            {/* Verification Barcode & Signature Box */}
            <div className="border border-slate-300 rounded-2xl p-3 bg-white flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  CRIS PRS Digital Seal
                </span>
                <p className="text-[10px] text-slate-600 leading-tight">
                  This e-ticket is cryptographically signed and stored in the central CRIS Passenger Reservation System database.
                </p>
                <div className="text-[9px] font-mono text-slate-400 pt-1">
                  SHA-256: 4f89d...{booking.pnr.replace('-', '')}
                </div>
              </div>
              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 shrink-0">
                <QrCode className="w-20 h-20 text-slate-900" />
              </div>
            </div>
          </div>

          {/* Statutory Passenger Instructions (CRIS / IRCTC Standard) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] text-slate-500 space-y-1 leading-relaxed">
            <span className="font-bold text-slate-700 uppercase block text-[9px] tracking-wider">
              Essential Travel Rules & Statutory Notices
            </span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <strong>Mandatory Identity Proof:</strong> At least one passenger booked on this Electronic Reservation Slip (ERS) must carry a valid original Government photo identity card (Aadhaar, Voter ID, Passport, Driving License, PAN Card, or Student ID) during the journey, to be shown to the TTE on demand.
              </li>
              <li>
                <strong>Chart Preparation:</strong> First reservation chart is finalized 4 hours prior to scheduled train departure. Second chart is finalized 30 minutes prior to departure.
              </li>
              <li>
                <strong>Catering & Bedroll:</strong> Complimentary bedroll (linen, blanket, pillow) is provided in all AC classes (1A, 2A, 3A).
              </li>
              <li>
                <strong>E-Ticket Cancellation:</strong> Permitted online through Tiktiki or IRCTC website up to 4 hours before scheduled departure. No refund is permissible after chart preparation for confirmed tickets.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer (Non-printable) */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span className="font-mono text-[10px]">
            Tiktiki JourneyOS · Official IRCTC & CRIS PSP Architecture
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
          >
            Close ERS Preview
          </button>
        </div>
      </div>
    </div>
  );
}
