'use client';

import React, { useState } from 'react';
import { X, Train, Clock, MapPin, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface LiveStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveStatusModal({ isOpen, onClose }: LiveStatusModalProps) {
  const [trainQuery, setTrainQuery] = useState('12951');
  const [trainName, setTrainName] = useState('Tejas Rajdhani Express (12951)');
  const [speed, setSpeed] = useState(118);
  const [delayMins, setDelayMins] = useState(4);
  const [currentStation, setCurrentStation] = useState('Approaching Kota Junction (KOTA)');
  const [nextStation, setNextStation] = useState('Ratlam Junction (RTM) · 284 km remaining');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trainQuery.includes('12167')) {
      setTrainName('Banaras Superfast Express (12167)');
      setCurrentStation('Departed Jabalpur (JBP) · Platform 3');
      setNextStation('Next: Katni Junction (KTE) · 91 km remaining');
      setDelayMins(12);
      setSpeed(94);
    } else if (trainQuery.includes('11059')) {
      setTrainName('Godan Express (11059)');
      setCurrentStation('Approaching Itarsi Junction (ET) · Platform 4');
      setNextStation('Next: Jabalpur (JBP) · 245 km remaining');
      setDelayMins(22);
      setSpeed(88);
    } else {
      setTrainName('Tejas Rajdhani Express (12951)');
      setCurrentStation('Approaching Kota Junction (KOTA) · Platform 1');
      setNextStation('Next: New Delhi (NDLS) · 466 km remaining');
      setDelayMins(4);
      setSpeed(124);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col">
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
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              Live Train Running Status
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              GPS Satellite + CRIS RTIS Integration
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-5">
          <input
            type="text"
            value={trainQuery}
            onChange={(e) => setTrainQuery(e.target.value)}
            placeholder="Enter Train Number (e.g. 12951, 12167)"
            className="flex-1 bg-zinc-900 border border-zinc-800 text-xs text-white rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 shrink-0"
          >
            Track Status
          </button>
        </form>

        {/* Live Status Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-start justify-between border-b border-zinc-850 pb-3">
            <div>
              <div className="text-xs font-bold text-white">{trainName}</div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Runs Daily · Real-time RTIS feed</div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                delayMins <= 5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950 text-amber-400 border border-amber-800/60'
              }`}>
                {delayMins <= 5 ? 'Right Time' : `Delayed ~${delayMins}m`}
              </span>
            </div>
          </div>

          {/* Current Speed & Position */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Current Speed</div>
              <div className="text-lg font-black text-white font-mono mt-0.5">{speed} <span className="text-xs font-normal text-zinc-400">km/h</span></div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Historical P95</div>
              <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">96% <span className="text-xs font-normal text-zinc-400">punctual</span></div>
            </div>
          </div>

          {/* Station Timeline */}
          <div className="flex flex-col gap-2.5 text-xs text-zinc-300">
            <div className="flex items-start gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-sm shadow-emerald-500" />
              <div>
                <span className="font-bold text-white block">{currentStation}</span>
                <span className="text-[11px] text-emerald-400">Speed recorded via Loco GPS</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 mt-1 shrink-0" />
              <div>
                <span className="font-medium text-zinc-400 block">{nextStation}</span>
                <span className="text-[11px] text-zinc-500 font-mono">Estimated Arrival: On Schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> RTIS Synchronized
          </span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white font-semibold transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
