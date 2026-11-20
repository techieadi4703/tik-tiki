'use client';

import React from 'react';
import { Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { SegmentHack } from '../types';

interface SmartHackBannerProps {
  hack: SegmentHack;
}

export function SmartHackBanner({ hack }: SmartHackBannerProps) {
  return (
    <div className="w-full bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 mt-0.5 sm:mt-0">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                ⚡ Smart Hack Discovered
              </span>
              <span className="text-xs text-slate-400 font-medium">Bypass Waitlist Officially</span>
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg mt-1">
              Confirmed {hack.class_code} Berths available on {hack.train_number}!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {hack.explanation}
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Book From: <strong className="text-white">{hack.book_from}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                Board At: <strong className="text-white">{hack.board_at}</strong>
              </span>
              <span>•</span>
              <span>Extra Cost: <strong className="text-white">+₹{hack.extra_fare_inr}</strong></span>
            </div>
          </div>
        </div>

        <a
          href="https://www.irctc.co.in"
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-transform active:scale-95"
        >
          Book via IRCTC <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
