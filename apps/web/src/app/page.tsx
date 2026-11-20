'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchHeader } from '../components/SearchHeader';
import { OptimizerSection } from '../components/OptimizerSection';
import { JourneyCard } from '../components/JourneyCard';
import { SeatAlertModal } from '../components/SeatAlertModal';
import { PassengerBookingModal } from '../components/PassengerBookingModal';
import { CoachSeatMapModal } from '../components/CoachSeatMapModal';
import { FilterSortBar, TimeWindow, SortOption, TrainTypeFilter } from '../components/FilterSortBar';
import { NormalizedOffer, JourneyOptimizationResult } from '../types';
import { searchJourneys, fetchOptimizedJourneyStrategies } from '../lib/api';
import { Compass, Train, Zap, ShieldCheck } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [mode, setMode] = useState('ALL');

  // Filter & Sort States
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('SCORE');
  const [trainTypeFilter, setTrainTypeFilter] = useState<TrainTypeFilter>('ALL');

  const [offers, setOffers] = useState<NormalizedOffer[]>([]);
  const [optimization, setOptimization] = useState<JourneyOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeAlertOffer, setActiveAlertOffer] = useState<NormalizedOffer | null>(null);
  const [activeBookingOffer, setActiveBookingOffer] = useState<NormalizedOffer | null>(null);
  const [activeCoachOffer, setActiveCoachOffer] = useState<NormalizedOffer | null>(null);

  const performSearch = async (from: string, to: string, travelDate: string) => {
    if (!from || !to) return;
    setLoading(true);
    setHasSearched(true);
    setOrigin(from);
    setDestination(to);
    setDate(travelDate);

    try {
      const [fetchedOffers, fetchedOptimization] = await Promise.all([
        searchJourneys(from, to, travelDate),
        fetchOptimizedJourneyStrategies(from, to, travelDate, '3A'),
      ]);
      setOffers(fetchedOffers);
      setOptimization(fetchedOptimization);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCorridor = (from: string, to: string) => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const dateStr = defaultDate.toISOString().split('T')[0];
    setOrigin(from);
    setDestination(to);
    setDate(dateStr);
    performSearch(from, to, dateStr);
  };

  // Advanced Multi-Attribute Filtering & Sorting
  const filteredOffers = offers
    .filter((o) => {
      // 1. Mode filter
      if (mode !== 'ALL' && o.mode !== mode) return false;

      // 2. Time Window filter
      if (timeWindow !== 'ALL') {
        const depHour = new Date(o.departure_at).getHours();
        if (timeWindow === 'EARLY' && (depHour < 0 || depHour >= 6)) return false;
        if (timeWindow === 'MORNING' && (depHour < 6 || depHour >= 12)) return false;
        if (timeWindow === 'AFTERNOON' && (depHour < 12 || depHour >= 18)) return false;
        if (timeWindow === 'NIGHT' && (depHour < 18 || depHour >= 24)) return false;
      }

      // 3. Train Type filter
      if (trainTypeFilter !== 'ALL' && o.mode === 'RAIL') {
        const name = (o.operator_name + ' ' + o.service_number).toUpperCase();
        if (trainTypeFilter === 'PREMIER' && !name.includes('RAJDHANI') && !name.includes('VANDE') && !name.includes('SHATABDI')) {
          return false;
        }
        if (trainTypeFilter === 'SUPERFAST' && !name.includes('SUPERFAST') && !name.includes('SF')) {
          return false;
        }
        if (trainTypeFilter === 'EXPRESS' && (name.includes('RAJDHANI') || name.includes('VANDE') || name.includes('SUPERFAST'))) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'FASTEST') {
        return a.duration_minutes - b.duration_minutes;
      }
      if (sortOption === 'PRICE') {
        return a.price - b.price;
      }
      if (sortOption === 'DEPARTURE') {
        return new Date(a.departure_at).getTime() - new Date(b.departure_at).getTime();
      }
      return b.score - a.score;
    });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      <SearchHeader
        origin={origin}
        destination={destination}
        travelDate={date}
        selectedMode={mode}
        onSearch={performSearch}
        onSelectMode={setMode}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
        {!hasSearched ? (
          /* Empty Initial State - Zero Defaults */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400 shadow-sm">
              <Compass className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white max-w-xl tracking-tight leading-tight">
              Smarter Transit Discovery. Transparent Journey Choices.
            </h1>
            <p className="text-sm text-zinc-400 max-w-lg mt-2.5 leading-relaxed">
              Compare direct trains, uncover smart upstream quotas, and verify safe delay-aware transfers across India with zero booking markups.
            </p>

            {/* Quick Explore Corridors */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Explore Popular Corridors
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: 'Mumbai ⇄ New Delhi', from: 'MMCT', to: 'NDLS' },
                  { label: 'Mumbai ⇄ Prayagraj', from: 'BOM', to: 'PRYJ' },
                  { label: 'New Delhi ⇄ Patna', from: 'NDLS', to: 'PNBE' },
                  { label: 'Bengaluru ⇄ Chennai', from: 'BLR', to: 'MAS' },
                  { label: 'Delhi ⇄ Howrah (Kolkata)', from: 'NDLS', to: 'HWH' },
                ].map((corridor) => (
                  <button
                    key={corridor.label}
                    onClick={() => handleQuickCorridor(corridor.from, corridor.to)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm"
                  >
                    <Train className="w-3.5 h-3.5 text-emerald-400" />
                    {corridor.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transit Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-3xl text-left">
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl">
                <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Quota Optimization
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Identify vacant berths from nearby originating halts with official boarding point adjustments.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl">
                <div className="text-sky-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Delay-Aware Transfers
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Connecting suggestions incorporate P95 punctuality delays and station platform walking times.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl">
                <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Multi-Modal Comparison
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Compare rail, intercity sleeper buses, and nonstop flights objectively using the Travel Value Index.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Search Results View */
          <>
            {/* Journey Optimizer Strategies */}
            <OptimizerSection
              optimization={optimization}
              destination={destination}
              onOpenBookingModal={setActiveBookingOffer}
            />

            {/* Filter and Sort Bar */}
            <FilterSortBar
              selectedTimeWindow={timeWindow}
              onSelectTimeWindow={setTimeWindow}
              selectedSort={sortOption}
              onSelectSort={setSortOption}
              selectedTrainType={trainTypeFilter}
              onSelectTrainType={setTrainTypeFilter}
              resultsCount={filteredOffers.length}
            />

            {/* Results List */}
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 w-full bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800/50" />
                ))}
              </div>
            ) : filteredOffers.length > 0 ? (
              <div className="flex flex-col gap-4">
                {filteredOffers.map((offer, idx) => (
                  <JourneyCard
                    key={`${offer.service_number}-${idx}`}
                    offer={offer}
                    onOpenAlertModal={setActiveAlertOffer}
                    onOpenBookingModal={setActiveBookingOffer}
                    onOpenCoachModal={setActiveCoachOffer}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
                <p className="text-zinc-400 text-sm">No routes found matching current filters.</p>
                <p className="text-xs text-zinc-500 mt-1">Try resetting the time window or service filter to view all options.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* In-App Railway Passenger Booking Modal */}
      <PassengerBookingModal
        offer={activeBookingOffer}
        onClose={() => setActiveBookingOffer(null)}
        onBookingSuccess={() => {
          setActiveBookingOffer(null);
          router.push('/trips');
        }}
      />

      {/* Interactive Coach Seat Map Visualizer Modal */}
      <CoachSeatMapModal
        offer={activeCoachOffer}
        onClose={() => setActiveCoachOffer(null)}
      />

      {/* Seat Alert Sniping Modal */}
      <SeatAlertModal
        offer={activeAlertOffer}
        onClose={() => setActiveAlertOffer(null)}
      />

      <footer className="w-full border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500 font-mono">
        Tiktiki · Modern Travel Intelligence & Segment Quota Engine · Zero Captive Booking Fees
      </footer>
    </div>
  );
}
