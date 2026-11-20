'use client';

import React from 'react';
import { Zap, Clock, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Ticket } from 'lucide-react';
import { JourneyOptimizationResult, NormalizedOffer } from '../types';

interface OptimizerSectionProps {
  optimization: JourneyOptimizationResult | null;
  destination?: string;
  onOpenBookingModal?: (offer: NormalizedOffer) => void;
}

export function OptimizerSection({ optimization, destination, onOpenBookingModal }: OptimizerSectionProps) {
  if (!optimization) return null;

  const hasUpstream = optimization.upstream_options && optimization.upstream_options.length > 0;
  const hasConnecting = optimization.connecting_options && optimization.connecting_options.length > 0;
  const hasSplit = optimization.split_segment_options && optimization.split_segment_options.length > 0;

  if (!hasUpstream && !hasConnecting && !hasSplit) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-xs">
            ⚡
          </span>
          <h3 className="text-slate-900 font-bold text-base">
            CRIS Smart Strategies · Waitlist Bypass Engine
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-semibold">Official IRCTC Boarding Rules</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* STRATEGY 1: Upstream Booking with Boarding Change */}
        {hasUpstream && (
          <div className="bg-gradient-to-r from-emerald-50/70 via-white to-white border border-emerald-300 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
                  <Zap className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Strategy 1 · Upstream Origin Booking
                    </span>
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Confirmed Berth (CNF)
                    </span>
                  </div>
                  <h4 className="text-slate-900 font-bold text-base mt-1.5">
                    Book from {optimization.upstream_options[0].book_from_station} · Board at {optimization.upstream_options[0].board_at_station}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {optimization.upstream_options[0].explanation}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 italic font-medium">
                    {optimization.upstream_options[0].rule_notice}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500">Estimated extra fare</span>
                  <div className="text-base font-black text-slate-900">
                    +₹{optimization.upstream_options[0].estimated_extra_fare_inr.toFixed(0)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const opt = optimization.upstream_options[0];
                    const upstreamOffer: NormalizedOffer = {
                      provider_id: `irctc-mock-${opt.train_number}`,
                      mode: 'RAIL',
                      operator_name: `Indian Railways (${opt.train_name})`,
                      service_number: opt.train_number,
                      origin_code: opt.book_from_station,
                      dest_code: destination || 'NDLS',
                      departure_at: new Date().toISOString(),
                      arrival_at: new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
                      duration_minutes: 960,
                      price: 1850 + Math.round(opt.estimated_extra_fare_inr),
                      currency: 'INR',
                      transfers: 0,
                      status: 'AVAILABLE',
                      available_seats: 12,
                      booking_url: '',
                      retrieved_at: new Date().toISOString(),
                      score: 96,
                    };
                    onOpenBookingModal?.(upstreamOffer);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  Book Confirmed Ticket <Ticket className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STRATEGY 2: Delay-Aware Connecting Route */}
        {hasConnecting && (
          <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                  Strategy 2 · Delay-Aware Connecting Route
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Interchange at <strong className="text-slate-900">{optimization.connecting_options[0].interchange_station}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Safe {Math.floor(optimization.connecting_options[0].scheduled_buffer_minutes / 60)}h Buffer (Real Cushion: {Math.floor(optimization.connecting_options[0].effective_slack_minutes / 60)}h {optimization.connecting_options[0].effective_slack_minutes % 60}m)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">
                  Leg 1: {optimization.connecting_options[0].leg1_train_name} ({optimization.connecting_options[0].leg1_train_number})
                </div>
                <div className="text-slate-600">
                  Depart: {new Date(optimization.connecting_options[0].leg1_departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → Arrive: {new Date(optimization.connecting_options[0].leg1_arrival_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-amber-700 mt-1 font-semibold">
                  Historical Delay: ~{optimization.connecting_options[0].leg1_avg_delay_minutes} mins factored into cushion
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">
                  Leg 2: {optimization.connecting_options[0].leg2_train_name} ({optimization.connecting_options[0].leg2_train_number})
                </div>
                <div className="text-slate-600">
                  Depart: {new Date(optimization.connecting_options[0].leg2_departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → Arrive: {new Date(optimization.connecting_options[0].leg2_arrival_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-emerald-700 mt-1 font-semibold">
                  {optimization.connecting_options[0].transfer_platform_advice}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STRATEGY 3: Same-Train Split Segment */}
        {hasSplit && (
          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  Strategy 3 · Same-Train Split Booking (Experimental)
                </span>
                <span className="text-xs text-slate-600">
                  Train: <strong className="text-slate-900">{optimization.split_segment_options[0].train_name}</strong>
                </span>
              </div>
              <span className="text-xs text-amber-800 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Coach change at {optimization.split_segment_options[0].intermediate_station}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-700 gap-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
              <div>
                <span>Seat 1: <strong>{optimization.split_segment_options[0].leg1_berth}</strong></span>
                <span className="mx-2 text-slate-400">→</span>
                <span>Seat 2: <strong>{optimization.split_segment_options[0].leg2_berth}</strong></span>
              </div>
              <span className="text-slate-600 text-[11px]">
                {optimization.split_segment_options[0].operational_warning}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
