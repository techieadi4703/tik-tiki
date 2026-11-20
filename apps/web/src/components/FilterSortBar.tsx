'use client';

import React from 'react';
import { Clock, ArrowUpDown, Train, SlidersHorizontal, Sun, Sunrise, Sunset, Moon } from 'lucide-react';

export type TimeWindow = 'ALL' | 'EARLY' | 'MORNING' | 'AFTERNOON' | 'NIGHT';
export type SortOption = 'SCORE' | 'FASTEST' | 'DEPARTURE' | 'PRICE';
export type TrainTypeFilter = 'ALL' | 'PREMIER' | 'SUPERFAST' | 'EXPRESS';

interface FilterSortBarProps {
  selectedTimeWindow: TimeWindow;
  onSelectTimeWindow: (w: TimeWindow) => void;
  selectedSort: SortOption;
  onSelectSort: (s: SortOption) => void;
  selectedTrainType: TrainTypeFilter;
  onSelectTrainType: (t: TrainTypeFilter) => void;
  resultsCount: number;
}

export function FilterSortBar({
  selectedTimeWindow,
  onSelectTimeWindow,
  selectedSort,
  onSelectSort,
  selectedTrainType,
  onSelectTrainType,
  resultsCount,
}: FilterSortBarProps) {
  const timeWindows: { id: TimeWindow; label: string; icon: React.ReactNode; range: string }[] = [
    { id: 'ALL', label: 'All Times', icon: <Clock className="w-3.5 h-3.5" />, range: '24h' },
    { id: 'EARLY', label: 'Early Morning', icon: <Sunrise className="w-3.5 h-3.5" />, range: '00-06' },
    { id: 'MORNING', label: 'Morning', icon: <Sun className="w-3.5 h-3.5" />, range: '06-12' },
    { id: 'AFTERNOON', label: 'Afternoon', icon: <Sunset className="w-3.5 h-3.5" />, range: '12-18' },
    { id: 'NIGHT', label: 'Night', icon: <Moon className="w-3.5 h-3.5" />, range: '18-24' },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Time Windows */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {timeWindows.map((tw) => (
            <button
              key={tw.id}
              onClick={() => onSelectTimeWindow(tw.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedTimeWindow === tw.id
                  ? 'bg-[#1a365d] text-white border-[#1a365d] shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              {tw.icon}
              <span>{tw.label}</span>
              <span className={`text-[10px] font-mono ${selectedTimeWindow === tw.id ? 'text-blue-200' : 'text-slate-400'}`}>
                ({tw.range})
              </span>
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-bold">
            <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" /> Sort By:
          </span>
          <select
            value={selectedSort}
            onChange={(e) => onSelectSort(e.target.value as SortOption)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="SCORE">Recommended (Value Index)</option>
            <option value="FASTEST">Fastest Duration</option>
            <option value="DEPARTURE">Departure Time</option>
            <option value="PRICE">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Train Type Filter Tabs */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Service Type:</span>
          {(
            [
              { id: 'ALL', label: 'All Services' },
              { id: 'PREMIER', label: 'Rajdhani / Vande Bharat' },
              { id: 'SUPERFAST', label: 'Superfast' },
              { id: 'EXPRESS', label: 'Mail / Express' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTrainType(t.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                selectedTrainType === t.id
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="text-slate-500 text-xs font-mono font-bold">
          {resultsCount} options verified
        </span>
      </div>
    </div>
  );
}
