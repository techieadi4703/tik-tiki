'use client';

import React, { useState, useEffect } from 'react';
import { X, Train, Clock, MapPin, CheckCircle2, ShieldCheck, Activity, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { LiveTrainStatusResponse } from '../types';
import { fetchLiveTrainStatus } from '../lib/api';

interface LiveStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrain?: string;
}

export function LiveStatusModal({ isOpen, onClose, initialTrain = '12168' }: LiveStatusModalProps) {
  const [trainQuery, setTrainQuery] = useState(initialTrain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<LiveTrainStatusResponse | null>(null);

  const performTrack = async (queryToTrack?: string) => {
    const q = (queryToTrack || trainQuery).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveTrainStatus(q);
      setStatusData(data);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch live NTES tracking status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      performTrack(trainQuery);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performTrack();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
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

        {/* Train Search Input Form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-300 focus-within:border-[#1a365d] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={trainQuery}
              onChange={(e) => {
                setTrainQuery(e.target.value);
                setError(null);
              }}
              placeholder="Enter Train Number (e.g. 12168, 12951, 22435)"
              className="w-full bg-transparent text-slate-900 text-xs sm:text-sm font-bold font-mono focus:outline-none placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#1a365d] hover:bg-[#152a4a] text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Track Train</span>
          </button>
        </form>

        {/* Quick Sample Train Pills */}
        <div className="flex items-center gap-1.5 mb-4 text-[11px] text-slate-500 overflow-x-auto pb-1">
          <span className="font-semibold text-slate-600 shrink-0">Popular:</span>
          {[
            { num: '12168', label: '12168 (Banaras - LTT)' },
            { num: '12951', label: '12951 (Rajdhani)' },
            { num: '22435', label: '22435 (Vande Bharat)' },
            { num: '12559', label: '12559 (Shiv Ganga)' },
            { num: '11059', label: '11059 (Godan)' },
          ].map((item) => (
            <button
              key={item.num}
              type="button"
              onClick={() => {
                setTrainQuery(item.num);
                performTrack(item.num);
              }}
              className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold shrink-0 transition-colors ${
                trainQuery === item.num
                  ? 'bg-blue-50 border-blue-400 text-[#1a365d]'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {item.num}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Status Card */}
        {statusData && (
          <div className="overflow-y-auto flex-1 flex flex-col gap-3 pr-1">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Current Service</span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    {statusData.train_name} ({statusData.train_number})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {statusData.source_code} → {statusData.dest_code} · {statusData.train_type}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block">Punctuality</span>
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                      statusData.delay_minutes === 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {statusData.punctuality_text}
                  </span>
                </div>
              </div>

              {/* Speed & Signal */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Current Speed</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    {statusData.current_speed} <span className="text-xs font-normal text-slate-600">km/h</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Signal Status</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {statusData.signal_status}
                  </span>
                </div>
              </div>

              {/* Location Strip */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <MapPin className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                  <span>{statusData.current_station}</span>
                </div>
                <span className="text-[11px] text-slate-600 ml-5">
                  {statusData.next_station}
                </span>
              </div>
            </div>

            {/* Route Timeline Halts */}
            {statusData.halts && statusData.halts.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Route Halt Progress
                </span>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {statusData.halts.map((h, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-colors ${
                        h.status === 'CURRENT'
                          ? 'bg-blue-50 border-blue-300 font-bold text-[#1a365d]'
                          : h.status === 'PASSED'
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            h.status === 'CURRENT'
                              ? 'bg-blue-600 ring-2 ring-blue-300'
                              : h.status === 'PASSED'
                              ? 'bg-slate-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span>{h.station_name} ({h.station_code})</span>
                        {h.platform_number > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">Pf {h.platform_number}</span>
                        )}
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span>{h.scheduled_depart || h.scheduled_arrive || '--:--'}</span>
                        {h.status === 'CURRENT' && (
                          <span className="ml-1 text-[9px] uppercase font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">
                            Here
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[10px]">
            Synced with CRIS Central Servers
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
