'use client';

import React from 'react';
import { Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { SegmentHack } from '../types';

interface SmartHackBannerProps {
  hack: SegmentHack;
}

export function SmartHackBanner({ hack }: SmartHackBannerProps) {
  return (
    <div className="w-full bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex-shrink-0 mt-0.5 sm:mt-0">
            <Zap className="w-5 h-5 fill-emerald-600 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                ⚡ Smart Hack Discovered
              </span>
              <span className="text-xs text-slate-600 font-medium">Bypass Waitlist Officially</span>
            </div>
            <h3 className="text-slate-900 font-bold text-base sm:text-lg mt-1">
              Confirmed {hack.class_code} Berths available on {hack.train_number}!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {hack.explanation}
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Book From: <strong className="text-slate-900">{hack.book_from}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700">
                Board At: <strong className="text-slate-900">{hack.board_at}</strong>
              </span>
              <span>•</span>
              <span>Extra Cost: <strong className="text-slate-900">+₹{hack.extra_fare_inr}</strong></span>
            </div>
          </div>
        </div>

        <a
          href="https://www.irctc.co.in"
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95"
        >
          Book via IRCTC <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
