'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Train,
  ShieldCheck,
  Search,
  Check,
  Sparkles,
  RefreshCw,
  Armchair,
  Bed,
  MapPin,
  Compass,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { NormalizedOffer, PNRStatusResponse } from '../types';
import { fetchPNRStatus } from '../lib/api';

interface CoachSeatMapModalProps {
  offer?: NormalizedOffer | null;
  initialTrainNumber?: string;
  initialPNR?: string;
  initialCoach?: string;
  initialSeat?: number;
  isOpen?: boolean;
  onClose: () => void;
  onSelectBerth?: (coach: string, berthNum: number, berthType: string) => void;
}

type TrainArchetype = 'VANDE_BHARAT' | 'SHATABDI' | 'RAJDHANI' | 'SUPERFAST_EXPRESS' | 'GARIB_RATH';

interface SeatInfo {
  num: number;
  seatLetter?: string; // A, B, C, D, E for Chair Car
  code: string; // W (Window), M (Middle), A (Aisle), LB, MB, UB, SL, SU
  type: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'LADIES_QUOTA' | 'SENIOR_QUOTA' | 'YOUR_PNR_SEAT';
  isWindow: boolean;
}

export function CoachSeatMapModal({
  offer,
  initialTrainNumber = '',
  initialPNR = '',
  initialCoach = '',
  initialSeat,
  isOpen = true,
  onClose,
  onSelectBerth,
}: CoachSeatMapModalProps) {
  const [searchInput, setSearchInput] = useState('');
  const [activeTrainNumber, setActiveTrainNumber] = useState(
    initialTrainNumber || offer?.service_number?.split(' ')[0] || '20608'
  );
  const [activeTrainName, setActiveTrainName] = useState(
    offer?.operator_name || 'Vande Bharat Express'
  );
  const [activeClass, setActiveClass] = useState<string>('CC');
  const [activeCoach, setActiveCoach] = useState<string>(initialCoach || 'C2');
  const [selectedSeat, setSelectedSeat] = useState<number>(initialSeat || 23);
  const [selectedSeatType, setSelectedSeatType] = useState<string>('Window Seat');
  const [pnrPassengerHighlight, setPnrPassengerHighlight] = useState<{
    pnr: string;
    coach: string;
    seat: number;
    status: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect train archetype dynamically
  const archetype: TrainArchetype = useMemo(() => {
    const tNum = activeTrainNumber.trim();
    const tName = activeTrainName.toUpperCase();

    if (
      tNum === '20608' ||
      tNum === '22435' ||
      tNum === '22436' ||
      tNum === '22415' ||
      tNum === '20942' ||
      tName.includes('VANDE BHARAT')
    ) {
      return 'VANDE_BHARAT';
    }
    if (tNum.startsWith('120') || tName.includes('SHATABDI')) {
      return 'SHATABDI';
    }
    if (
      tNum.startsWith('1295') ||
      tNum === '12301' ||
      tNum === '12302' ||
      tNum === '12309' ||
      tNum === '12310' ||
      tNum === '12313' ||
      tName.includes('RAJDHANI')
    ) {
      return 'RAJDHANI';
    }
    if (tNum === '12214' || tName.includes('GARIB RATH')) {
      return 'GARIB_RATH';
    }
    return 'SUPERFAST_EXPRESS';
  }, [activeTrainNumber, activeTrainName]);

  // Synchronize available classes per train archetype
  const availableClasses = useMemo(() => {
    switch (archetype) {
      case 'VANDE_BHARAT':
      case 'SHATABDI':
        return [
          { code: 'CC', label: 'AC Chair Car (CC)', icon: Armchair },
          { code: 'EC', label: 'Executive Chair (EC)', icon: Armchair },
        ];
      case 'RAJDHANI':
        return [
          { code: '3A', label: 'AC 3 Tier (3A)', icon: Bed },
          { code: '2A', label: 'AC 2 Tier (2A)', icon: Bed },
          { code: '1A', label: 'First Class (1A)', icon: Bed },
        ];
      case 'GARIB_RATH':
        return [{ code: '3E', label: '3AC Economy (3E)', icon: Bed }];
      case 'SUPERFAST_EXPRESS':
      default:
        return [
          { code: '3A', label: 'AC 3 Tier (3A)', icon: Bed },
          { code: '2A', label: 'AC 2 Tier (2A)', icon: Bed },
          { code: 'SL', label: 'Sleeper (SL)', icon: Bed },
          { code: '1A', label: 'First Class (1A)', icon: Bed },
        ];
    }
  }, [archetype]);

  // Default active class when archetype shifts
  useEffect(() => {
    const isCurrentClassValid = availableClasses.some((c) => c.code === activeClass);
    if (!isCurrentClassValid) {
      setActiveClass(availableClasses[0].code);
    }
  }, [availableClasses, activeClass]);

  // Available coaches per class
  const availableCoaches = useMemo(() => {
    if (archetype === 'VANDE_BHARAT' || archetype === 'SHATABDI') {
      if (activeClass === 'EC') return ['E1', 'E2'];
      return ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
    }
    switch (activeClass) {
      case '1A':
        return ['H1'];
      case '2A':
        return ['A1', 'A2', 'A3'];
      case 'SL':
        return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
      case '3E':
        return ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
      case '3A':
      default:
        return ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
    }
  }, [archetype, activeClass]);

  // Ensure activeCoach matches available list
  useEffect(() => {
    if (!availableCoaches.includes(activeCoach)) {
      setActiveCoach(availableCoaches[0] || 'C1');
    }
  }, [availableCoaches, activeCoach]);

  // Load PNR directly if passed initially
  useEffect(() => {
    if (initialPNR) {
      loadPNR(initialPNR);
    } else if (offer) {
      const train = offer.service_number.split(' ')[0] || '20608';
      setActiveTrainNumber(train);
      setActiveTrainName(offer.operator_name || 'Express');
      if (initialCoach) setActiveCoach(initialCoach);
      if (initialSeat) setSelectedSeat(initialSeat);
    }
  }, [initialPNR, offer]);

  // Lookup PNR via live CRIS status API
  const loadPNR = async (pnrToLoad: string) => {
    const clean = pnrToLoad.replace(/-/g, '').trim();
    if (clean.length !== 10) {
      setError('Indian Railways PNR numbers must be exactly 10 digits (e.g. 612-4914214, 284-9182741).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPNRStatus(clean);
      setActiveTrainNumber(data.train_number);
      setActiveTrainName(data.train_name);
      setActiveClass(data.class_code);

      const p1 = data.passengers[0];
      if (p1 && p1.allocated_coach) {
        setActiveCoach(p1.allocated_coach);
        setSelectedSeat(p1.allocated_berth);
        setSelectedSeatType(p1.allocated_berth_type || 'Window');
        setPnrPassengerHighlight({
          pnr: data.pnr,
          coach: p1.allocated_coach,
          seat: p1.allocated_berth,
          status: p1.current_status,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load PNR coach allocation from CRIS.');
    } finally {
      setLoading(false);
    }
  };

  // Lookup Train Number directly
  const loadTrain = (tNum: string) => {
    const clean = tNum.trim();
    if (clean.length !== 5 && isNaN(Number(clean))) {
      setError('Please enter a valid 5-digit Indian Railways train number (e.g. 20608, 12951, 12168, 12004).');
      return;
    }
    setError(null);
    setPnrPassengerHighlight(null);
    setActiveTrainNumber(clean);

    // Resolve human-readable name
    if (clean === '20608') setActiveTrainName('Vande Bharat Express (SBC - MAS)');
    else if (clean === '22435') setActiveTrainName('Vande Bharat Express (BSB - NDLS)');
    else if (clean === '12951') setActiveTrainName('Tejas Rajdhani Express (MMCT - NDLS)');
    else if (clean === '12168') setActiveTrainName('Banaras - LTT Superfast Express');
    else if (clean === '12004') setActiveTrainName('Shatabdi Express (NDLS - LKO)');
    else setActiveTrainName(`Express (${clean})`);
  };

  // Handle Search Input Submission (handles both PNR & Train Number)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    const digitsOnly = query.replace(/[^0-9]/g, '');
    if (digitsOnly.length === 10) {
      loadPNR(digitsOnly);
    } else if (digitsOnly.length === 5 || query.length >= 4) {
      loadTrain(query);
    } else {
      setError('Please enter a 5-digit Train Number (e.g. 20608) or 10-digit PNR (e.g. 612-4914214).');
    }
  };

  // Deterministic seat status helper
  const getSeatStatus = (num: number): SeatInfo['status'] => {
    if (pnrPassengerHighlight && pnrPassengerHighlight.coach === activeCoach && pnrPassengerHighlight.seat === num) {
      return 'YOUR_PNR_SEAT';
    }
    if (num === selectedSeat) return 'AVAILABLE';
    if (num % 11 === 0) return 'LADIES_QUOTA';
    if (num % 13 === 0) return 'SENIOR_QUOTA';
    if (num % 3 === 0 || num % 5 === 0) return 'OCCUPIED';
    return 'AVAILABLE';
  };

  // 1. VANDE BHARAT / SHATABDI CHAIR CAR GENERATOR (3+2 Layout, 78 Seats)
  const chairCarRows = useMemo(() => {
    if (archetype !== 'VANDE_BHARAT' && archetype !== 'SHATABDI') return [];

    if (activeClass === 'EC') {
      // Executive Class 2+2 layout (52 seats, 13 rows)
      const rows = [];
      for (let r = 0; r < 13; r++) {
        const base = r * 4;
        rows.push({
          rowNumber: r + 1,
          leftSeats: [
            { num: base + 1, seatLetter: 'A', code: 'W', type: 'Window Seat', status: getSeatStatus(base + 1), isWindow: true },
            { num: base + 2, seatLetter: 'B', code: 'A', type: 'Aisle Seat', status: getSeatStatus(base + 2), isWindow: false },
          ],
          rightSeats: [
            { num: base + 3, seatLetter: 'C', code: 'A', type: 'Aisle Seat', status: getSeatStatus(base + 3), isWindow: false },
            { num: base + 4, seatLetter: 'D', code: 'W', type: 'Window Seat', status: getSeatStatus(base + 4), isWindow: true },
          ],
        });
      }
      return rows;
    }

    // Standard AC Chair Car 3+2 layout (78 seats, 16 rows)
    const rows = [];
    const totalRows = 16;
    for (let r = 0; r < totalRows; r++) {
      const base = r * 5;
      rows.push({
        rowNumber: r + 1,
        leftSeats: [
          { num: base + 1, seatLetter: 'A', code: 'W', type: 'Window Seat', status: getSeatStatus(base + 1), isWindow: true },
          { num: base + 2, seatLetter: 'B', code: 'M', type: 'Middle Seat', status: getSeatStatus(base + 2), isWindow: false },
          { num: base + 3, seatLetter: 'C', code: 'A', type: 'Aisle Seat', status: getSeatStatus(base + 3), isWindow: false },
        ],
        rightSeats: [
          { num: base + 4, seatLetter: 'D', code: 'A', type: 'Aisle Seat', status: getSeatStatus(base + 4), isWindow: false },
          { num: base + 5, seatLetter: 'E', code: 'W', type: 'Window Seat', status: getSeatStatus(base + 5), isWindow: true },
        ],
      });
    }
    return rows;
  }, [archetype, activeClass, activeCoach, selectedSeat, pnrPassengerHighlight]);

  // 2. SLEEPER / RAJDHANI COMPARTMENT GENERATOR (3A, 2A, SL, 1A)
  const sleeperBays = useMemo(() => {
    if (archetype === 'VANDE_BHARAT' || archetype === 'SHATABDI') return [];

    const list = [];
    if (activeClass === '3A' || activeClass === 'SL' || activeClass === '3E') {
      // 72/81 Berths (6 Main + 2 Side per bay)
      const baysCount = activeClass === '3E' ? 9 : 9;
      for (let i = 0; i < baysCount; i++) {
        const base = i * 8;
        const main = [
          { num: base + 1, code: 'LB', type: 'Lower Berth (LB)', status: getSeatStatus(base + 1), isWindow: true },
          { num: base + 2, code: 'MB', type: 'Middle Berth (MB)', status: getSeatStatus(base + 2), isWindow: false },
          { num: base + 3, code: 'UB', type: 'Upper Berth (UB)', status: getSeatStatus(base + 3), isWindow: false },
          { num: base + 4, code: 'LB', type: 'Lower Berth (LB)', status: getSeatStatus(base + 4), isWindow: true },
          { num: base + 5, code: 'MB', type: 'Middle Berth (MB)', status: getSeatStatus(base + 5), isWindow: false },
          { num: base + 6, code: 'UB', type: 'Upper Berth (UB)', status: getSeatStatus(base + 6), isWindow: false },
        ];
        const side = [
          { num: base + 7, code: 'SL', type: 'Side Lower (SL)', status: getSeatStatus(base + 7), isWindow: true },
          { num: base + 8, code: 'SU', type: 'Side Upper (SU)', status: getSeatStatus(base + 8), isWindow: true },
        ];
        list.push({ bayNumber: i + 1, label: `Bay ${i + 1} (Berths ${base + 1}-${base + 8})`, main, side });
      }
    } else if (activeClass === '2A') {
      // 54 Berths (4 Main + 2 Side, No Middle Berths)
      for (let i = 0; i < 9; i++) {
        const base = i * 6;
        const main = [
          { num: base + 1, code: 'LB', type: 'Lower Berth (LB)', status: getSeatStatus(base + 1), isWindow: true },
          { num: base + 2, code: 'UB', type: 'Upper Berth (UB)', status: getSeatStatus(base + 2), isWindow: false },
          { num: base + 3, code: 'LB', type: 'Lower Berth (LB)', status: getSeatStatus(base + 3), isWindow: true },
          { num: base + 4, code: 'UB', type: 'Upper Berth (UB)', status: getSeatStatus(base + 4), isWindow: false },
        ];
        const side = [
          { num: base + 5, code: 'SL', type: 'Side Lower (SL)', status: getSeatStatus(base + 5), isWindow: true },
          { num: base + 6, code: 'SU', type: 'Side Upper (SU)', status: getSeatStatus(base + 6), isWindow: true },
        ];
        list.push({ bayNumber: i + 1, label: `Cabin ${i + 1} (Berths ${base + 1}-${base + 6})`, main, side });
      }
    } else if (activeClass === '1A') {
      // First Class AC: 6 Cabins/Coupes
      for (let i = 0; i < 6; i++) {
        const isCoupe = i % 2 === 1;
        const base = i * 4;
        const main = isCoupe
          ? [
              { num: base + 1, code: 'LB', type: 'Coupe Lower', status: getSeatStatus(base + 1), isWindow: true },
              { num: base + 2, code: 'UB', type: 'Coupe Upper', status: getSeatStatus(base + 2), isWindow: true },
            ]
          : [
              { num: base + 1, code: 'LB', type: 'Cabin Lower', status: getSeatStatus(base + 1), isWindow: true },
              { num: base + 2, code: 'UB', type: 'Cabin Upper', status: getSeatStatus(base + 2), isWindow: true },
              { num: base + 3, code: 'LB', type: 'Cabin Lower', status: getSeatStatus(base + 3), isWindow: true },
              { num: base + 4, code: 'UB', type: 'Cabin Upper', status: getSeatStatus(base + 4), isWindow: true },
            ];
        list.push({
          bayNumber: i + 1,
          label: isCoupe ? `Coupe ${String.fromCharCode(65 + i)} (2 Berths)` : `Cabin ${String.fromCharCode(65 + i)} (4 Berths)`,
          main,
          side: [],
        });
      }
    }
    return list;
  }, [archetype, activeClass, activeCoach, selectedSeat, pnrPassengerHighlight]);

  if (!isOpen) return null;

  const handleSeatClick = (seat: SeatInfo) => {
    if (seat.status === 'OCCUPIED') return;
    setSelectedSeat(seat.num);
    setSelectedSeatType(seat.type);
  };

  const handleConfirm = () => {
    onSelectBerth?.(activeCoach, selectedSeat, selectedSeatType);
    onClose();
  };

  const isChairCar = archetype === 'VANDE_BHARAT' || archetype === 'SHATABDI';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pr-8">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1a365d] shrink-0">
            {isChairCar ? <Armchair className="w-5 h-5 text-[#1a365d]" /> : <Train className="w-5 h-5 text-[#1a365d]" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#1a365d] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                {isChairCar ? 'Executive Chair Car Layout' : 'Indian Railways LHB Layout'} · Coach {activeCoach}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isChairCar ? (activeClass === 'EC' ? '52 Rotating Seats' : '78 Seats (3+2)') : '72 Berths'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {activeTrainNumber} · {activeTrainName}
            </h3>
          </div>
        </div>

        {/* Dynamic Train / PNR Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-2">
          <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-300 focus-within:border-[#1a365d] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setError(null);
              }}
              placeholder="Ask any Train (e.g. 20608, 12951, 12168, 12004) or 10-digit PNR (e.g. 612-4914214)..."
              className="w-full bg-transparent text-slate-900 text-xs sm:text-sm font-bold font-mono focus:outline-none placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#1a365d] hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Show Layout</span>
          </button>
        </form>

        {/* Quick Sample Pills for Rapid Verification */}
        <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-500 overflow-x-auto pb-1">
          <span className="font-semibold text-slate-600 shrink-0">Sample:</span>
          {[
            { label: '20608 (Vande Bharat CC)', type: 'train', val: '20608' },
            { label: '12951 (Rajdhani 3A/2A)', type: 'train', val: '12951' },
            { label: '12168 (Banaras SF)', type: 'train', val: '12168' },
            { label: '12004 (Shatabdi CC)', type: 'train', val: '12004' },
            { label: 'PNR 612-4914214', type: 'pnr', val: '612-4914214' },
            { label: 'PNR 284-9182741', type: 'pnr', val: '284-9182741' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => {
                setSearchInput(item.val);
                if (item.type === 'pnr') loadPNR(item.val);
                else loadTrain(item.val);
              }}
              className="px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold shrink-0 transition-colors bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PNR Passenger Seat Badge Banner */}
        {pnrPassengerHighlight && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-950 font-bold">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                PNR {pnrPassengerHighlight.pnr} Allocated Seat: Coach {pnrPassengerHighlight.coach}, Seat #{pnrPassengerHighlight.seat} ({selectedSeatType})
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-400">
              {pnrPassengerHighlight.status}
            </span>
          </div>
        )}

        {/* Controls: Class Selector & Coach Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
          {/* Class Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {availableClasses.map((cls) => {
              const Icon = cls.icon;
              return (
                <button
                  key={cls.code}
                  type="button"
                  onClick={() => {
                    setActiveClass(cls.code);
                    setPnrPassengerHighlight(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    activeClass === cls.code
                      ? 'bg-[#1a365d] text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cls.label}</span>
                </button>
              );
            })}
          </div>

          {/* Coach Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Coach:</span>
            {availableCoaches.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCoach(c)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                  activeCoach === c
                    ? 'bg-[#ea580c] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-3 px-1 text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-700 inline-block" /> Selected
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" /> Available
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-pink-50 border border-pink-300 inline-block" /> Ladies Quota
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300 inline-block" /> Senior Citizen
            </span>
            <span className="flex items-center gap-1 font-medium text-slate-400">
              <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 inline-block" /> Booked
            </span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            {isChairCar ? 'A = Window · B = Middle · C = Aisle' : 'LB = Lower · MB = Middle · UB = Upper'}
          </div>
        </div>

        {/* Carriage Scrollable Floor View */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {/* Front Entry Door */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
            <span>🚪 Forward Automatic Vestibule / Door A</span>
            <span className="text-slate-500">🚽 Modern Modular Bio-Vacuum Toilets (2)</span>
          </div>

          {/* RENDERING ARCHETYPE 1: VANDE BHARAT / SHATABDI CHAIR CAR (3+2 OR 2+2) */}
          {isChairCar ? (
            <div className="space-y-2">
              {chairCarRows.map((row) => (
                <div
                  key={row.rowNumber}
                  className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                >
                  <span className="w-6 text-[10px] font-mono font-bold text-slate-400 text-center">
                    R{row.rowNumber}
                  </span>

                  {/* Left Side (3 seats for CC, 2 seats for EC) */}
                  <div className={`grid gap-1.5 flex-1 ${activeClass === 'EC' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {row.leftSeats.map((seat) => {
                      const isSelected = selectedSeat === seat.num;
                      const isOccupied = seat.status === 'OCCUPIED';
                      const isPnrSeat = seat.status === 'YOUR_PNR_SEAT';

                      return (
                        <button
                          key={seat.num}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => handleSeatClick(seat)}
                          className={`p-2 rounded-xl text-center border transition-all relative ${
                            isPnrSeat
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 font-black shadow-lg scale-105'
                              : isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-md scale-105'
                              : isOccupied
                              ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                              : seat.status === 'LADIES_QUOTA'
                              ? 'bg-pink-50 text-pink-900 border-pink-300 hover:bg-pink-100 shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="text-xs font-mono font-black flex items-center justify-center gap-1">
                            {seat.num}
                            {(isSelected || isPnrSeat) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div
                            className={`text-[9px] uppercase font-bold tracking-tight mt-0.5 ${
                              isSelected || isPnrSeat ? 'text-emerald-100' : isOccupied ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {seat.seatLetter} · {seat.isWindow ? 'Win' : 'Aisle'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Center Gangway Aisle */}
                  <div className="w-7 flex flex-col items-center justify-center text-[10px] font-mono text-slate-300 rotate-90 select-none font-bold">
                    ···
                  </div>

                  {/* Right Side (2 seats for CC, 2 seats for EC) */}
                  <div className={`grid gap-1.5 flex-1 ${activeClass === 'EC' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {row.rightSeats.map((seat) => {
                      const isSelected = selectedSeat === seat.num;
                      const isOccupied = seat.status === 'OCCUPIED';
                      const isPnrSeat = seat.status === 'YOUR_PNR_SEAT';

                      return (
                        <button
                          key={seat.num}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => handleSeatClick(seat)}
                          className={`p-2 rounded-xl text-center border transition-all relative ${
                            isPnrSeat
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 font-black shadow-lg scale-105'
                              : isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-md scale-105'
                              : isOccupied
                              ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                              : seat.status === 'LADIES_QUOTA'
                              ? 'bg-pink-50 text-pink-900 border-pink-300 hover:bg-pink-100 shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="text-xs font-mono font-black flex items-center justify-center gap-1">
                            {seat.num}
                            {(isSelected || isPnrSeat) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div
                            className={`text-[9px] uppercase font-bold tracking-tight mt-0.5 ${
                              isSelected || isPnrSeat ? 'text-emerald-100' : isOccupied ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {seat.seatLetter} · {seat.isWindow ? 'Win' : 'Aisle'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* RENDERING ARCHETYPE 2: SLEEPER / RAJDHANI COMPARTMENT (3A, 2A, SL, 1A) */
            <div className="space-y-3">
              {sleeperBays.map((bay) => (
                <div
                  key={bay.bayNumber}
                  className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col gap-2"
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
                    <span>{bay.label}</span>
                    <span className="text-slate-400">Bay {bay.bayNumber}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Left / Main Cabin Berths */}
                    <div
                      className={`grid gap-1.5 flex-1 ${
                        activeClass === '1A' ? 'grid-cols-2' : activeClass === '2A' ? 'grid-cols-2' : 'grid-cols-3'
                      }`}
                    >
                      {bay.main.map((b) => {
                        const isSelected = selectedSeat === b.num;
                        const isOccupied = b.status === 'OCCUPIED';
                        const isPnrSeat = b.status === 'YOUR_PNR_SEAT';

                        return (
                          <button
                            key={b.num}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => handleSeatClick(b)}
                            className={`p-2 rounded-xl text-center border transition-all relative ${
                              isPnrSeat
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 font-black shadow-lg scale-105'
                                : isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-md scale-105'
                                : isOccupied
                                ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                                : b.status === 'LADIES_QUOTA'
                                ? 'bg-pink-50 text-pink-900 border-pink-300 hover:bg-pink-100 shadow-sm'
                                : b.status === 'SENIOR_QUOTA'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                            }`}
                          >
                            <div className="text-xs font-mono font-black flex items-center justify-center gap-1">
                              {b.num}
                              {(isSelected || isPnrSeat) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div
                              className={`text-[9px] uppercase font-bold tracking-tight mt-0.5 ${
                                isSelected || isPnrSeat ? 'text-emerald-100' : isOccupied ? 'text-slate-400' : 'text-slate-500'
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

                    {/* Right / Side Berths */}
                    {bay.side.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5 w-28 shrink-0">
                        {bay.side.map((b) => {
                          const isSelected = selectedSeat === b.num;
                          const isOccupied = b.status === 'OCCUPIED';
                          const isPnrSeat = b.status === 'YOUR_PNR_SEAT';

                          return (
                            <button
                              key={b.num}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => handleSeatClick(b)}
                              className={`p-2 rounded-xl text-center border transition-all ${
                                isPnrSeat
                                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 font-black shadow-lg scale-105'
                                  : isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-md scale-105'
                                  : isOccupied
                                  ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                              }`}
                            >
                              <div className="text-xs font-mono font-black flex items-center justify-center gap-1">
                                {b.num}
                                {(isSelected || isPnrSeat) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div
                                className={`text-[9px] uppercase font-bold tracking-tight mt-0.5 ${
                                  isSelected || isPnrSeat ? 'text-emerald-100' : isOccupied ? 'text-slate-400' : 'text-slate-500'
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
          )}

          {/* Rear Entry Door */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
            <span className="text-slate-500">🔌 Mobile Charging Port at every seat</span>
            <span>🚪 Rear Vestibule / Door B</span>
          </div>
        </div>

        {/* Selection Confirmation Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">
              {pnrPassengerHighlight ? 'PNR Confirmed Allocation' : 'Selected Seat / Berth'}
            </div>
            <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Coach {activeCoach} · Seat #{selectedSeat} ({selectedSeatType})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
