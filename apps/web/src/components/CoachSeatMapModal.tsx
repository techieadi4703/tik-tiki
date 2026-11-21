'use client';

import React, { useState, useMemo } from 'react';
import { X, Train, ShieldCheck, Info, Check, User, Sparkles, Filter } from 'lucide-react';
import { NormalizedOffer } from '../types';

interface CoachSeatMapModalProps {
  offer: NormalizedOffer | null;
  onClose: () => void;
  onSelectBerth?: (coach: string, berthNum: number, berthType: string) => void;
}

type TravelClass = '3A' | '2A' | 'SL' | '1A';

interface BerthInfo {
  num: number;
  type: string;
  code: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'LADIES_QUOTA' | 'SENIOR_QUOTA';
  isWindow: boolean;
}

interface BayInfo {
  bayNumber: number;
  label: string;
  mainBerths: BerthInfo[];
  sideBerths: BerthInfo[];
}

export function CoachSeatMapModal({ offer, onClose, onSelectBerth }: CoachSeatMapModalProps) {
  const [coachClass, setCoachClass] = useState<TravelClass>('3A');
  const [selectedCoach, setSelectedCoach] = useState<string>('B2');
  const [selectedBerth, setSelectedBerth] = useState<{ num: number; type: string } | null>({
    num: 24,
    type: 'Lower Berth (LB)',
  });
  const [filterBerthType, setFilterBerthType] = useState<string>('ALL');

  // Available coaches per class
  const availableCoaches = useMemo(() => {
    switch (coachClass) {
      case '1A':
        return ['H1'];
      case '2A':
        return ['A1', 'A2', 'A3'];
      case 'SL':
        return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
      case '3A':
      default:
        return ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
    }
  }, [coachClass]);

  // Update selected coach when travel class changes
  const handleClassChange = (cls: TravelClass) => {
    setCoachClass(cls);
    switch (cls) {
      case '1A':
        setSelectedCoach('H1');
        break;
      case '2A':
        setSelectedCoach('A1');
        break;
      case 'SL':
        setSelectedCoach('S1');
        break;
      case '3A':
      default:
        setSelectedCoach('B2');
        break;
    }
  };

  // Generate authentic Indian Railways coach layout
  const bays = useMemo<BayInfo[]>(() => {
    const list: BayInfo[] = [];

    // Deterministic pseudo-occupied generator for realism
    const getBerthStatus = (num: number): BerthInfo['status'] => {
      // Keep Berth 24 open as default selected
      if (num === 24 || num === 12 || num === 7 || num === 18 || num === 35) return 'AVAILABLE';
      if (num % 7 === 0) return 'SENIOR_QUOTA';
      if (num % 9 === 0) return 'LADIES_QUOTA';
      if (num % 3 === 0 || num % 5 === 0) return 'OCCUPIED';
      return 'AVAILABLE';
    };

    if (coachClass === '3A' || coachClass === 'SL') {
      // 72 Berths: 9 Bays of 8 (6 Main + 2 Side)
      for (let i = 0; i < 9; i++) {
        const base = i * 8;
        const main: BerthInfo[] = [
          { num: base + 1, type: 'Lower Berth (LB)', code: 'LB', status: getBerthStatus(base + 1), isWindow: true },
          { num: base + 2, type: 'Middle Berth (MB)', code: 'MB', status: getBerthStatus(base + 2), isWindow: false },
          { num: base + 3, type: 'Upper Berth (UB)', code: 'UB', status: getBerthStatus(base + 3), isWindow: false },
          { num: base + 4, type: 'Lower Berth (LB)', code: 'LB', status: getBerthStatus(base + 4), isWindow: true },
          { num: base + 5, type: 'Middle Berth (MB)', code: 'MB', status: getBerthStatus(base + 5), isWindow: false },
          { num: base + 6, type: 'Upper Berth (UB)', code: 'UB', status: getBerthStatus(base + 6), isWindow: false },
        ];
        const side: BerthInfo[] = [
          { num: base + 7, type: 'Side Lower (SL)', code: 'SL', status: getBerthStatus(base + 7), isWindow: true },
          { num: base + 8, type: 'Side Upper (SU)', code: 'SU', status: getBerthStatus(base + 8), isWindow: true },
        ];
        list.push({ bayNumber: i + 1, label: `Bay ${i + 1} (Berths ${base + 1}-${base + 8})`, mainBerths: main, sideBerths: side });
      }
    } else if (coachClass === '2A') {
      // 54 Berths: 9 Bays of 6 (4 Main + 2 Side, No middle berth for 2A)
      for (let i = 0; i < 9; i++) {
        const base = i * 6;
        const main: BerthInfo[] = [
          { num: base + 1, type: 'Lower Berth (LB)', code: 'LB', status: getBerthStatus(base + 1), isWindow: true },
          { num: base + 2, type: 'Upper Berth (UB)', code: 'UB', status: getBerthStatus(base + 2), isWindow: false },
          { num: base + 3, type: 'Lower Berth (LB)', code: 'LB', status: getBerthStatus(base + 3), isWindow: true },
          { num: base + 4, type: 'Upper Berth (UB)', code: 'UB', status: getBerthStatus(base + 4), isWindow: false },
        ];
        const side: BerthInfo[] = [
          { num: base + 5, type: 'Side Lower (SL)', code: 'SL', status: getBerthStatus(base + 5), isWindow: true },
          { num: base + 6, type: 'Side Upper (SU)', code: 'SU', status: getBerthStatus(base + 6), isWindow: true },
        ];
        list.push({ bayNumber: i + 1, label: `Bay ${i + 1} (Berths ${base + 1}-${base + 6})`, mainBerths: main, sideBerths: side });
      }
    } else if (coachClass === '1A') {
      // 24 Berths: 6 Cabins/Coupes
      for (let i = 0; i < 6; i++) {
        const isCoupe = i % 2 === 1; // Alternating Cabin (4) and Coupe (2)
        const base = i * 4;
        const main: BerthInfo[] = isCoupe
          ? [
              { num: base + 1, type: 'First Class Lower', code: 'LB', status: getBerthStatus(base + 1), isWindow: true },
              { num: base + 2, type: 'First Class Upper', code: 'UB', status: getBerthStatus(base + 2), isWindow: true },
            ]
          : [
              { num: base + 1, type: 'First Class Lower', code: 'LB', status: getBerthStatus(base + 1), isWindow: true },
              { num: base + 2, type: 'First Class Upper', code: 'UB', status: getBerthStatus(base + 2), isWindow: true },
              { num: base + 3, type: 'First Class Lower', code: 'LB', status: getBerthStatus(base + 3), isWindow: true },
              { num: base + 4, type: 'First Class Upper', code: 'UB', status: getBerthStatus(base + 4), isWindow: true },
            ];
        list.push({
          bayNumber: i + 1,
          label: isCoupe ? `Coupe ${String.fromCharCode(65 + i)} (2 Berths)` : `Cabin ${String.fromCharCode(65 + i)} (4 Berths)`,
          mainBerths: main,
          sideBerths: [], // 1A has corridor on side, no side berths
        });
      }
    }

    return list;
  }, [coachClass]);

  if (!offer) return null;

  const totalBerths = coachClass === '3A' || coachClass === 'SL' ? 72 : coachClass === '2A' ? 54 : 24;

  const handleSelect = (b: BerthInfo) => {
    if (b.status === 'OCCUPIED') return;
    setSelectedBerth({ num: b.num, type: b.type });
  };

  const handleConfirm = () => {
    if (selectedBerth) {
      onSelectBerth?.(selectedCoach, selectedBerth.num, selectedBerth.type);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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
            <Train className="w-5 h-5 text-[#1a365d]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#1a365d] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                LHB Coach Layout · {selectedCoach}
              </span>
              <span className="text-xs text-slate-500 font-medium">{totalBerths} Berths Total</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {offer.service_number} · Coach Schematic & Berth Choice
            </h3>
          </div>
        </div>

        {/* Controls: Class Selector & Coach Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
          {/* Class Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['3A', '2A', 'SL', '1A'] as const).map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => handleClassChange(cls)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  coachClass === cls
                    ? 'bg-[#1a365d] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cls === '3A' ? 'AC 3 Tier (3A)' : cls === '2A' ? 'AC 2 Tier (2A)' : cls === 'SL' ? 'Sleeper (SL)' : 'First AC (1A)'}
              </button>
            ))}
          </div>

          {/* Coach Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Coach:</span>
            {availableCoaches.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCoach(c)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedCoach === c
                    ? 'bg-[#ea580c] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Legend & Berth Type Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-3 px-1 text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-700 inline-block" /> Selected
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" /> Available
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-pink-50 border border-pink-300 inline-block" /> Ladies
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300 inline-block" /> Senior
            </span>
            <span className="flex items-center gap-1 font-medium text-slate-400">
              <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 inline-block" /> Booked
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-slate-400 font-bold uppercase">Filter:</span>
            {['ALL', 'LB', 'MB', 'UB', 'SL'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterBerthType(t)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold transition-colors ${
                  filterBerthType === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Carriage Corridor Scroll Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {/* Vestibule / Door 1 */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
            <span>🚪 Forward Vestibule / Door A</span>
            <span className="text-slate-500">🚽 Bio-Toilets (2) & Wash Basin</span>
          </div>

          {/* Bays */}
          <div className="space-y-3">
            {bays.map((bay) => (
              <div
                key={bay.bayNumber}
                className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col gap-2"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
                  <span>{bay.label}</span>
                  <span className="text-slate-400">Section {bay.bayNumber}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Left / Main Cabin Berths */}
                  <div
                    className={`grid gap-1.5 flex-1 ${
                      coachClass === '1A' ? 'grid-cols-2' : coachClass === '2A' ? 'grid-cols-2' : 'grid-cols-3'
                    }`}
                  >
                    {bay.mainBerths.map((b) => {
                      const isSelected = selectedBerth?.num === b.num;
                      const isOccupied = b.status === 'OCCUPIED';
                      const isDimmed = filterBerthType !== 'ALL' && b.code !== filterBerthType;

                      return (
                        <button
                          key={b.num}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => handleSelect(b)}
                          className={`p-2 rounded-xl text-center border transition-all relative ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-md scale-[1.02]'
                              : isOccupied
                              ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                              : b.status === 'LADIES_QUOTA'
                              ? 'bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-300 shadow-sm'
                              : b.status === 'SENIOR_QUOTA'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-400 shadow-sm'
                          } ${isDimmed ? 'opacity-30' : ''}`}
                        >
                          <div className="text-xs font-mono font-black flex items-center justify-center gap-1">
                            {b.num}
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div
                            className={`text-[9px] uppercase font-bold tracking-tight mt-0.5 ${
                              isSelected
                                ? 'text-emerald-100'
                                : isOccupied
                                ? 'text-slate-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {b.code} · {b.isWindow ? 'Win' : 'Aisle'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Aisle Gangway */}
                  <div className="w-6 flex flex-col items-center justify-center text-[10px] font-mono text-slate-300 rotate-90 select-none font-bold">
                    ···
                  </div>

                  {/* Right / Side Berths (for 3A, 2A, SL) */}
                  {bay.sideBerths.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 w-28 shrink-0">
                      {bay.sideBerths.map((b) => {
                        const isSelected = selectedBerth?.num === b.num;
                        const isOccupied = b.status === 'OCCUPIED';
                        const isDimmed = filterBerthType !== 'ALL' && b.code !== filterBerthType;

                        return (
                          <button
                            key={b.num}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => handleSelect(b)}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-md scale-[1.02]'
                                : isOccupied
                                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-400 shadow-sm'
                            } ${isDimmed ? 'opacity-30' : ''}`}
                          >
                            <div className="text-xs font-mono font-black flex items-center justify-center gap-1">
                              {b.num}
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div
                              className={`text-[9px] uppercase font-bold tracking-tight mt-0.5 ${
                                isSelected ? 'text-emerald-100' : isOccupied ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {b.code}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-24 text-[10px] font-mono text-slate-400 text-right pr-2 italic">
                      Private Corridor
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vestibule / Door 2 */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
            <span className="text-slate-500">🚽 Bio-Toilets (2) & Dustbin</span>
            <span>🚪 Rear Vestibule / Door B</span>
          </div>
        </div>

        {/* Selection Confirmation Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Selected Berth</div>
            {selectedBerth ? (
              <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Coach {selectedCoach} · Berth #{selectedBerth.num} ({selectedBerth.type})
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic mt-0.5">Please choose an open berth</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedBerth}
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              Confirm Berth Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
