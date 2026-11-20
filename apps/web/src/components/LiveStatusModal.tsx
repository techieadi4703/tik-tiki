'use client';

import React, { useState } from 'react';
import { X, Train, Clock, MapPin, CheckCircle2, ShieldCheck, Activity, Search } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1a365d] shrink-0">
            <Activity className="w-5 h-5 text-[#1a365d]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                NTES Live Feed
              </span>
              <span className="text-xs text-slate-500 font-medium">GPS Triangulation</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Live Train Running Status
            </h3>
          </div>
        </div>

        {/* Train Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-300 focus-within:border-[#1a365d] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={trainQuery}
              onChange={(e) => setTrainQuery(e.target.value)}
              placeholder="Enter Train Number (e.g. 12951, 12167)"
              className="w-full bg-transparent text-slate-900 text-xs sm:text-sm font-medium focus:outline-none placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#1a365d] hover:bg-[#152a4a] text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
          >
            Track Train
          </button>
        </form>

        {/* Live Status Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs text-slate-500 font-mono">Current Service</span>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{trainName}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Punctuality</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                delayMins <= 5 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {delayMins <= 5 ? 'Right Time' : `Delayed ~${delayMins}m`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase block font-semibold">Current Speed</span>
              <span className="text-slate-900 font-mono font-bold text-sm">{speed} km/h</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase block font-semibold">Signal Status</span>
              <span className="text-emerald-700 font-mono font-bold text-sm">Clear Green</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#1a365d]">
              <MapPin className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>{currentStation}</span>
            </div>
            <span className="text-slate-600 text-[11px] pl-5">{nextStation}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Synced with CRIS Central Servers</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
