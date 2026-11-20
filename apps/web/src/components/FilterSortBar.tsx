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
    <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Time Windows */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {timeWindows.map((tw) => (
            <button
              key={tw.id}
              onClick={() => onSelectTimeWindow(tw.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedTimeWindow === tw.id
                  ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm'
                  : 'bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 border-zinc-850 hover:border-zinc-700'
              }`}
            >
              {tw.icon}
              <span>{tw.label}</span>
              <span className="text-[10px] text-zinc-500 font-mono">({tw.range})</span>
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={selectedSort}
            onChange={(e) => onSelectSort(e.target.value as SortOption)}
            className="bg-zinc-850 border border-zinc-750 text-xs text-white rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="SCORE">Recommended (Value Index)</option>
            <option value="FASTEST">Fastest Duration</option>
            <option value="DEPARTURE">Departure Time</option>
            <option value="PRICE">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Train Type Filter Tabs */}
      <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Service:</span>
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
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedTrainType === t.id
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="text-zinc-500 text-xs font-mono">
          {resultsCount} options found
        </span>
      </div>
    </div>
  );
}
