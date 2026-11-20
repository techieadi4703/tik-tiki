'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, Search, Train, Bus, Plane, LayoutGrid } from 'lucide-react';

interface SearchHeaderProps {
  origin: string;
  destination: string;
  travelDate: string;
  selectedMode: string;
  onSearch: (from: string, to: string, date: string) => void;
  onSelectMode: (mode: string) => void;
}

export function SearchHeader({
  origin,
  destination,
  travelDate,
  selectedMode,
  onSearch,
  onSelectMode,
}: SearchHeaderProps) {
  const [from, setFrom] = useState(origin);
  const [to, setTo] = useState(destination);
  const [date, setDate] = useState(travelDate);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(from, to, date);
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 py-6 px-4 sm:px-8 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-lg">
                t
              </span>
              tiktiki
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full ml-2">
              Travel Intelligence
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Zero-Ad Modern Travel</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80 shadow-lg">
          <div className="md:col-span-4 flex items-center bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 uppercase w-12">From</span>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value.toUpperCase())}
              placeholder="Origin (e.g. BOM)"
              className="w-full bg-transparent text-white font-medium focus:outline-none text-sm placeholder-slate-500"
            />
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Swap stations"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-4 flex items-center bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 uppercase w-12">To</span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value.toUpperCase())}
              placeholder="Destination (e.g. JAI)"
              className="w-full bg-transparent text-white font-medium focus:outline-none text-sm placeholder-slate-500"
            />
          </div>

          <div className="md:col-span-2 flex items-center bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-700/50">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-white font-medium focus:outline-none text-sm [color-scheme:dark]"
            />
          </div>

          <div className="md:col-span-1 flex">
            <button
              type="submit"
              className="w-full h-full min-h-[42px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Modes', icon: LayoutGrid },
            { id: 'RAIL', label: 'Trains Only', icon: Train },
            { id: 'BUS', label: 'Buses Only', icon: Bus },
            { id: 'FLIGHT', label: 'Flights Only', icon: Plane },
          ].map((item) => {
            const Icon = item.icon;
            const active = selectedMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
