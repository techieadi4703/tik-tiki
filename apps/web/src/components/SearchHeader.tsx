'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, Search, Train, Bus, Plane, LayoutGrid, AlertCircle, Ticket, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { StationAutocomplete } from './StationAutocomplete';
import { User } from '../types';

interface SearchHeaderProps {
  origin: string;
  destination: string;
  travelDate: string;
  selectedMode: string;
  currentUser?: User | null;
  onSearch: (from: string, to: string, date: string) => void;
  onSelectMode: (mode: string) => void;
  onOpenLiveStatus?: () => void;
  onOpenCoachMap?: () => void;
  onOpenPNRStatus?: () => void;
  onSignOut?: () => void;
}

export function SearchHeader({
  origin,
  destination,
  travelDate,
  selectedMode,
  currentUser,
  onSearch,
  onSelectMode,
  onOpenLiveStatus,
  onOpenCoachMap,
  onOpenPNRStatus,
  onSignOut,
}: SearchHeaderProps) {
  const [fromCode, setFromCode] = useState(origin);
  const [toCode, setToCode] = useState(destination);
  const [date, setDate] = useState(travelDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSwap = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCode.trim() || !toCode.trim()) {
      setValidationError('Please select both Origin and Destination stations.');
      return;
    }
    if (fromCode.trim().toUpperCase() === toCode.trim().toUpperCase()) {
      setValidationError('Origin and destination cannot be the same station.');
      return;
    }
    setValidationError(null);
    onSearch(fromCode.trim().toUpperCase(), toCode.trim().toUpperCase(), date);
  };

  return (
    <header className="w-full bg-[#1a365d] border-b-4 border-orange-500 shadow-md">
      {/* Top Bar with Branding, Navigation & User Status */}
      <div className="w-full border-b border-blue-900/60 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-white text-[#1a365d] flex items-center justify-center font-black text-xl shadow-sm">
                t
              </span>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  tiktiki
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold bg-orange-600 text-white px-2 py-0.5 rounded shadow-sm">
                    JourneyOS
                  </span>
                </span>
                <span className="hidden sm:block text-[11px] text-blue-200 font-medium">
                  Indian Railways Multi-Modal Transit Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 bg-blue-950/60 p-1 rounded-xl border border-blue-800/80 text-xs font-semibold">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-white text-[#1a365d] font-bold shadow-sm"
            >
              Search Trains
            </button>
            <button
              type="button"
              onClick={onOpenPNRStatus}
              className="px-3.5 py-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-blue-900/60 transition-colors flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5 text-orange-400" />
              <span>PNR Status</span>
            </button>
            <button
              type="button"
              onClick={onOpenLiveStatus}
              className="px-3.5 py-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-blue-900/60 transition-colors"
            >
              Live Running Status
            </button>
            <button
              type="button"
              onClick={onOpenCoachMap}
              className="px-3.5 py-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-blue-900/60 transition-colors"
            >
              Coach Berth Maps
            </button>
          </div>

          {/* User Account Controls */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/trips"
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>My Trips</span>
            </Link>

            {currentUser && (
              <div className="flex items-center gap-2 bg-blue-950/80 border border-blue-800/80 rounded-xl px-2.5 py-1.5 text-xs text-blue-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-bold text-white max-w-[120px] truncate">{currentUser.name}</span>
                  <span className="hidden lg:inline text-[11px] text-blue-300 font-mono">({currentUser.irctc_username})</span>
                </div>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="ml-1 text-blue-300 hover:text-white p-1 hover:bg-blue-900 rounded"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Search Panel Form */}
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl w-full mx-auto flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200">
              {/* Origin Autocomplete */}
              <div className="md:col-span-4 relative z-30">
                <StationAutocomplete
                  label="From"
                  value={fromCode}
                  onChange={(code) => {
                    setFromCode(code);
                    setValidationError(null);
                  }}
                  placeholder="Origin station, city, or code"
                />
              </div>

              {/* Station Swap Button */}
              <div className="hidden md:flex md:col-span-1 items-center justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors shadow-sm"
                  title="Swap stations"
                >
                  <ArrowLeftRight className="w-4 h-4 text-orange-600" />
                </button>
              </div>

              {/* Destination Autocomplete */}
              <div className="md:col-span-4 relative z-20">
                <StationAutocomplete
                  label="To"
                  value={toCode}
                  onChange={(code) => {
                    setToCode(code);
                    setValidationError(null);
                  }}
                  placeholder="Destination station, city, or code"
                />
              </div>

              {/* Date Picker */}
              <div className="md:col-span-2 flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-300">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-bold focus:outline-none text-sm"
                />
              </div>

              {/* Search Submit Button */}
              <div className="md:col-span-1 flex">
                <button
                  type="submit"
                  className="w-full h-full min-h-[44px] bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
                  title="Search Journeys"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Validation Alert Message */}
            {validationError && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{validationError}</span>
              </div>
            )}
          </form>

          {/* Mode Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                    active
                      ? 'bg-white text-[#1a365d] ring-2 ring-orange-500'
                      : 'bg-blue-950/70 text-blue-200 hover:text-white hover:bg-blue-900 border border-blue-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
