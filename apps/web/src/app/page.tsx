'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchHeader } from '../components/SearchHeader';
import { OptimizerSection } from '../components/OptimizerSection';
import { JourneyCard } from '../components/JourneyCard';
import { SeatAlertModal } from '../components/SeatAlertModal';
import { PassengerBookingModal } from '../components/PassengerBookingModal';
import { NormalizedOffer, JourneyOptimizationResult } from '../types';
import { searchJourneys, fetchOptimizedJourneyStrategies } from '../lib/api';
import { Compass, Train, Zap, ShieldCheck } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [mode, setMode] = useState('ALL');

  const [offers, setOffers] = useState<NormalizedOffer[]>([]);
  const [optimization, setOptimization] = useState<JourneyOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeAlertOffer, setActiveAlertOffer] = useState<NormalizedOffer | null>(null);
  const [activeBookingOffer, setActiveBookingOffer] = useState<NormalizedOffer | null>(null);

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

  const filteredOffers = offers
    .filter((o) => (mode === 'ALL' ? true : o.mode === mode))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
          /* Empty Initial State - No Pre-selected Defaults */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
              <Compass className="w-8 h-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white max-w-xl tracking-tight">
              Find Smarter Routes. Make Better Travel Decisions.
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mt-2 leading-relaxed">
              Select your origin, destination, and travel date above to compare all direct trains, uncover upstream booking hacks, and verify delay-aware connecting transfers.
            </p>

            {/* Quick Explore Corridors */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Or explore popular corridors
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: 'Mumbai ⇄ New Delhi', from: 'MMCT', to: 'NDLS' },
                  { label: 'Mumbai ⇄ Prayagraj', from: 'BOM', to: 'PRYJ' },
                  { label: 'Itarsi ⇄ Prayagraj', from: 'ET', to: 'PRYJ' },
                  { label: 'New Delhi ⇄ Patna', from: 'NDLS', to: 'PNBE' },
                  { label: 'Bengaluru ⇄ Chennai', from: 'BLR', to: 'MAS' },
                ].map((corridor) => (
                  <button
                    key={corridor.label}
                    onClick={() => handleQuickCorridor(corridor.from, corridor.to)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <Train className="w-3.5 h-3.5 text-emerald-400" />
                    {corridor.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Value Proposition Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-3xl text-left">
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
                <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Upstream Booking
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bypass high waitlists by discovering open quotas at earlier stations on the same train with compliant boarding point changes.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
                <div className="text-sky-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Delay-Aware Cushion
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Connecting train suggestions evaluate P95 historical arrival delays and platform walking times so you never miss a transfer.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
                <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Multi-Modal Comparison
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare rail, intercity sleeper buses, and nonstop flights objectively using the Mathematical Journey Utility Score.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Search Results View */
          <>
            {/* Tiktiki Journey Optimizer: 3 Smart Strategies */}
            <OptimizerSection
              optimization={optimization}
              destination={destination}
              onOpenBookingModal={setActiveBookingOffer}
            />

            {/* Results Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  All Ranked Travel Options
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {filteredOffers.length} available
                  </span>
                </h2>
                <span className="text-xs text-slate-400">
                  Sorted by Journey Utility Score (Balance of Cost, Time, and Reliability)
                </span>
              </div>
            </div>

            {/* Results List */}
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 w-full bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800/50" />
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
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                <p className="text-slate-400 text-sm">No routes found matching this criteria.</p>
                <p className="text-xs text-slate-500 mt-1">Try selecting different travel dates or nearby major junction stations.</p>
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

      {/* Seat Alert Sniping Modal */}
      <SeatAlertModal
        offer={activeAlertOffer}
        onClose={() => setActiveAlertOffer(null)}
      />

      <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Tiktiki · Modern Multi-Modal Travel Intelligence · Zero Ads · Zero Captive Booking Fees
      </footer>
    </div>
  );
}
