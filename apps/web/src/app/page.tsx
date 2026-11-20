'use client';

import React, { useState, useEffect } from 'react';
import { SearchHeader } from '../components/SearchHeader';
import { OptimizerSection } from '../components/OptimizerSection';
import { JourneyCard } from '../components/JourneyCard';
import { SeatAlertModal } from '../components/SeatAlertModal';
import { NormalizedOffer, JourneyOptimizationResult } from '../types';
import { searchJourneys, fetchOptimizedJourneyStrategies } from '../lib/api';

export default function Home() {
  const [origin, setOrigin] = useState('ET');
  const [destination, setDestination] = useState('PRYJ');
  const [date, setDate] = useState('2026-12-24');
  const [mode, setMode] = useState('ALL');

  const [offers, setOffers] = useState<NormalizedOffer[]>([]);
  const [optimization, setOptimization] = useState<JourneyOptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAlertOffer, setActiveAlertOffer] = useState<NormalizedOffer | null>(null);

  const performSearch = async (from: string, to: string, travelDate: string) => {
    setLoading(true);
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

  useEffect(() => {
    performSearch(origin, destination, date);
  }, []);

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
        {/* Tiktiki Journey Optimizer: 3 Smart Strategies */}
        <OptimizerSection optimization={optimization} />

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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <p className="text-slate-400 text-sm">No routes found matching this criteria.</p>
          </div>
        )}
      </main>

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
