'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Train,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Printer,
  Copy,
  Check,
  Compass,
} from 'lucide-react';
import { PNRStatusResponse } from '../types';
import { fetchPNRStatus } from '../lib/api';

interface PNRStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPNR?: string;
}

export function PNRStatusModal({ isOpen, onClose, initialPNR = '' }: PNRStatusModalProps) {
  const [pnrInput, setPnrInput] = useState(initialPNR || '284-9182741');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pnrData, setPnrData] = useState<PNRStatusResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (targetPNR?: string) => {
    const query = (targetPNR || pnrInput).trim();
    if (!query) {
      setError('Please enter a 10-digit Indian Railways PNR.');
      return;
    }
    const clean = query.replace(/-/g, '');
    if (clean.length !== 10 || isNaN(Number(clean))) {
      setError('Invalid PNR format: Please enter exactly 10 digits (e.g. 284-9182741 or 2849182741).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPNRStatus(query);
      setPnrData(data);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch PNR status from CRIS PRS database.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPNR = () => {
    if (pnrData) {
      navigator.clipboard.writeText(pnrData.pnr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1a365d] px-6 py-4 border-b border-blue-900 flex items-center justify-between text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-orange-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-300 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/30">
                  CRIS PRS Live Gateway
                </span>
                <span className="text-xs text-blue-200 font-medium">Indian Railways PNR Tracker</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">Live PNR Status Inquiry</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter 10-digit Indian Railways PNR (e.g. 284-9182741)"
                value={pnrInput}
                onChange={(e) => {
                  setPnrInput(e.target.value);
                  setError(null);
                }}
                maxLength={11}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a365d] shadow-sm uppercase tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Track PNR</span>
            </button>
          </form>

          {/* Quick PNR Pills */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Sample PNRs:</span>
            {['284-9182741', '849-2194821', '612-4918204'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setPnrInput(sample);
                  handleSearch(sample);
                }}
                className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:text-[#1a365d] font-semibold transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result Area */}
        <div className="p-6 flex-1 flex flex-col gap-6">
          {pnrData ? (
            <>
              {/* Train Summary Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">
                        {pnrData.train_number} · {pnrData.train_name}
                      </span>
                      <span className="text-xs font-bold text-[#1a365d] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {pnrData.class_name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Date of Journey: {pnrData.date_of_journey} · {pnrData.quota}
                    </span>
                  </div>

                  {/* PNR Copy Badge */}
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-mono font-black text-slate-800">{pnrData.pnr}</span>
                    <button
                      onClick={handleCopyPNR}
                      className="p-1 rounded text-slate-500 hover:text-slate-900"
                      title="Copy PNR"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Route Timeline */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="text-left">
                    <span className="text-xl font-black text-slate-900 block">{pnrData.departure_time}</span>
                    <span className="text-sm font-bold text-[#1a365d] block">{pnrData.origin_code}</span>
                    <span className="text-[11px] text-slate-500">{pnrData.origin_name}</span>
                    <span className="text-[10px] text-slate-600 font-bold block mt-0.5">{pnrData.platform_number}</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-4">
                    <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-1">
                      {pnrData.overall_status}
                    </span>
                    <div className="w-full flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-[#1a365d]" />
                      <div className="h-0.5 flex-1 bg-slate-300" />
                      <div className="h-2 w-2 rounded-full bg-[#ea580c]" />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 font-medium">Direct Service</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 block">{pnrData.arrival_time}</span>
                    <span className="text-sm font-bold text-[#1a365d] block">{pnrData.dest_code}</span>
                    <span className="text-[11px] text-slate-500">{pnrData.dest_name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Dest. Station</span>
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#1a365d] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Charting Status</span>
                      <span className="text-xs font-bold text-[#1a365d]">{pnrData.chart_status}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-[#ea580c] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Confirmation Meter</span>
                      <span className="text-xs font-bold text-[#ea580c]">{pnrData.confirmation_chance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Status Manifest */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Passenger Booking Manifest
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Booking Status</th>
                        <th className="py-2.5 px-3">Current Status</th>
                        <th className="py-2.5 px-3">Coach & Berth</th>
                        <th className="py-2.5 px-3">CNF Chance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pnrData.passengers.map((p) => (
                        <tr key={p.passenger_index} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-800">Passenger {p.passenger_index}</td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-600">{p.booking_status}</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {p.current_status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {p.allocated_coach ? `${p.allocated_coach}, ${p.allocated_berth}` : 'Chart Pending'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-600 font-mono">
                              {p.confirmation_probability}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coach Layout Sequence */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Train Coach Sequence (Loco to Rear)
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-2">
                  {pnrData.coach_layout.map((coach, idx) => {
                    const isAllocated = coach === 'B2';
                    return (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold shrink-0 text-center ${
                          isAllocated
                            ? 'bg-[#1a365d] text-white border-[#1a365d] shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {coach}
                        {isAllocated && <span className="block text-[8px] text-orange-300">Your Coach</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  CRIS Timestamp: {new Date(pnrData.last_updated).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                  <button
                    onClick={() => handleSearch()}
                    className="px-3.5 py-2 rounded-xl bg-[#1a365d] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1a365d]">
                <Train className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Track Any Indian Railways PNR</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter your 10-digit reservation number to check charting status, coach allocation, and RAC-to-CNF probability from CRIS.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
