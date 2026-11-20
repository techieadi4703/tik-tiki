'use client';

import React, { useState } from 'react';
import { X, Train, ShieldCheck, Info } from 'lucide-react';
import { NormalizedOffer } from '../types';

interface CoachSeatMapModalProps {
  offer: NormalizedOffer | null;
  onClose: () => void;
  onSelectBerth?: (berthNum: number, berthType: string) => void;
}

export function CoachSeatMapModal({ offer, onClose, onSelectBerth }: CoachSeatMapModalProps) {
  const [selectedSeat, setSelectedSeat] = useState<number>(24);
  const [coachClass, setCoachClass] = useState<'3A' | '2A' | 'SL'>('3A');

  if (!offer) return null;

  // LHB 3AC 72-berth layout sample (Compartments 1-9)
  // Each compartment: Lower (1), Middle (2), Upper (3) | Lower (4), Middle (5), Upper (6) || Side Lower (7), Side Upper (8)
  const compartments = Array.from({ length: 8 }, (_, compIdx) => {
    const base = compIdx * 8;
    return {
      compNumber: compIdx + 1,
      mainBerths: [
        { num: base + 1, type: 'Lower (L)', code: 'L' },
        { num: base + 2, type: 'Middle (M)', code: 'M' },
        { num: base + 3, type: 'Upper (U)', code: 'U' },
        { num: base + 4, type: 'Lower (L)', code: 'L' },
        { num: base + 5, type: 'Middle (M)', code: 'M' },
        { num: base + 6, type: 'Upper (U)', code: 'U' },
      ],
      sideBerths: [
        { num: base + 7, type: 'Side Lower (SL)', code: 'SL' },
        { num: base + 8, type: 'Side Upper (SU)', code: 'SU' },
      ],
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                LHB Coach Layout · Coach B2
              </span>
              <span className="text-xs text-zinc-400">72 Berths</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {offer.service_number}
            </h3>
          </div>
        </div>

        {/* Coach Class Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            {(['3A', '2A', 'SL'] as const).map((cls) => (
              <button
                key={cls}
                onClick={() => setCoachClass(cls)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  coachClass === cls
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cls === '3A' ? 'AC 3 Tier (3A)' : cls === '2A' ? 'AC 2 Tier (2A)' : 'Sleeper (SL)'}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500/80" /> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-800 opacity-50" /> Occupied
            </span>
          </div>
        </div>

        {/* Interactive Coach Map Scroll Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Coach Entry & Restroom Header */}
          <div className="flex items-center justify-between p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-400">
            <span className="font-mono">🚪 Entry Door / Vestibule</span>
            <span className="font-mono text-zinc-500">🚽 Bio-Toilets & Wash Basin</span>
          </div>

          {/* Coach Compartments Grid */}
          <div className="space-y-3">
            {compartments.map((comp) => (
              <div
                key={comp.compNumber}
                className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 flex flex-col gap-2"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>Bay {comp.compNumber}</span>
                  <span className="text-zinc-600">Cabin {comp.compNumber}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Left 6 Berths (Main Cabin) */}
                  <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {comp.mainBerths.map((b) => {
                      const isSelected = selectedSeat === b.num;
                      return (
                        <button
                          key={b.num}
                          onClick={() => {
                            setSelectedSeat(b.num);
                            onSelectBerth?.(b.num, b.type);
                          }}
                          className={`p-2 rounded-xl text-center border transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                              : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-200 border-zinc-700/60 hover:border-zinc-500'
                          }`}
                        >
                          <div className="text-xs font-mono font-bold">{b.num}</div>
                          <div className={`text-[9px] uppercase font-medium ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-400'}`}>
                            {b.code}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Aisle Gangway */}
                  <div className="w-5 flex flex-col items-center justify-center text-[10px] font-mono text-zinc-600 rotate-90 select-none">
                    ···
                  </div>

                  {/* Right 2 Berths (Side Berths) */}
                  <div className="grid grid-cols-2 gap-1.5 w-28">
                    {comp.sideBerths.map((b) => {
                      const isSelected = selectedSeat === b.num;
                      return (
                        <button
                          key={b.num}
                          onClick={() => {
                            setSelectedSeat(b.num);
                            onSelectBerth?.(b.num, b.type);
                          }}
                          className={`p-2 rounded-xl text-center border transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                              : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-200 border-zinc-700/60 hover:border-zinc-500'
                          }`}
                        >
                          <div className="text-xs font-mono font-bold">{b.num}</div>
                          <div className={`text-[9px] uppercase font-medium ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-400'}`}>
                            {b.code}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coach End Restroom Footer */}
          <div className="flex items-center justify-between p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-400">
            <span className="font-mono text-zinc-500">🚽 Bio-Toilets & Wash Basin</span>
            <span className="font-mono">🚪 Rear Vestibule Door</span>
          </div>
        </div>

        {/* Selection Confirmation Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400">Selected Allocation</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Coach B2 · Berth #{selectedSeat}
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            Confirm Berth Selection
          </button>
        </div>
      </div>
    </div>
  );
}
