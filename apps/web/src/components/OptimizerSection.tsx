'use client';

import React from 'react';
import { Zap, Clock, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { JourneyOptimizationResult } from '../types';

interface OptimizerSectionProps {
  optimization: JourneyOptimizationResult | null;
}

export function OptimizerSection({ optimization }: OptimizerSectionProps) {
  if (!optimization) return null;

  const hasUpstream = optimization.upstream_options && optimization.upstream_options.length > 0;
  const hasConnecting = optimization.connecting_options && optimization.connecting_options.length > 0;
  const hasSplit = optimization.split_segment_options && optimization.split_segment_options.length > 0;

  if (!hasUpstream && !hasConnecting && !hasSplit) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            ⚡
          </span>
          <h3 className="text-white font-bold text-base">
            Tiktiki Journey Optimizer: 3 Smart Strategies Found
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">Bypass Waitlists Legally</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* STRATEGY 1: Upstream Booking with Boarding Change */}
        {hasUpstream && (
          <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                  <Zap className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800/60">
                      Strategy 1 · Upstream Origin Booking
                    </span>
                    <span className="text-xs text-emerald-400/90 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Confirmed Berth
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base mt-1">
                    Book from {optimization.upstream_options[0].book_from_station} · Board at {optimization.upstream_options[0].board_at_station}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {optimization.upstream_options[0].explanation}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    {optimization.upstream_options[0].rule_notice}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400">Estimated extra fare</span>
                  <div className="text-base font-black text-white">
                    +₹{optimization.upstream_options[0].estimated_extra_fare_inr.toFixed(0)}
                  </div>
                </div>
                <a
                  href={`https://www.irctc.co.in/nget/train-search?train=${optimization.upstream_options[0].train_number}`}
                  target="_blank"
                  rel="noopener"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  Book on IRCTC <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* STRATEGY 2: Delay-Aware Connecting Route */}
        {hasConnecting && (
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/90 px-2 py-0.5 rounded border border-sky-800/60">
                  Strategy 2 · Delay-Aware Connecting Route
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Interchange at <strong className="text-white">{optimization.connecting_options[0].interchange_station}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" /> Safe {Math.floor(optimization.connecting_options[0].scheduled_buffer_minutes / 60)}h Buffer (Real Cushion: {Math.floor(optimization.connecting_options[0].effective_slack_minutes / 60)}h {optimization.connecting_options[0].effective_slack_minutes % 60}m)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                <div className="font-bold text-white mb-1">
                  Leg 1: {optimization.connecting_options[0].leg1_train_name} ({optimization.connecting_options[0].leg1_train_number})
                </div>
                <div className="text-slate-400">
                  Depart: {new Date(optimization.connecting_options[0].leg1_departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → Arrive: {new Date(optimization.connecting_options[0].leg1_arrival_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-amber-400 mt-1 font-medium">
                  Historical Delay: ~{optimization.connecting_options[0].leg1_avg_delay_minutes} mins factored into cushion
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                <div className="font-bold text-white mb-1">
                  Leg 2: {optimization.connecting_options[0].leg2_train_name} ({optimization.connecting_options[0].leg2_train_number})
                </div>
                <div className="text-slate-400">
                  Depart: {new Date(optimization.connecting_options[0].leg2_departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → Arrive: {new Date(optimization.connecting_options[0].leg2_arrival_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-emerald-400 mt-1 font-medium">
                  {optimization.connecting_options[0].transfer_platform_advice}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STRATEGY 3: Same-Train Split Segment (Experimental) */}
        {hasSplit && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                  Strategy 3 · Same-Train Split Booking (Experimental)
                </span>
                <span className="text-xs text-slate-400">
                  Train: <strong className="text-white">{optimization.split_segment_options[0].train_name}</strong>
                </span>
              </div>
              <span className="text-xs text-amber-300 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Coach change at {optimization.split_segment_options[0].intermediate_station}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-300 gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40">
              <div>
                <span>Seat 1: <strong>{optimization.split_segment_options[0].leg1_berth}</strong></span>
                <span className="mx-2 text-slate-500">→</span>
                <span>Seat 2: <strong>{optimization.split_segment_options[0].leg2_berth}</strong></span>
              </div>
              <span className="text-slate-400 text-[11px]">
                {optimization.split_segment_options[0].operational_warning}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
