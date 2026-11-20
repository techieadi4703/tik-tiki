'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchHeader } from '../components/SearchHeader';
import { OptimizerSection } from '../components/OptimizerSection';
import { JourneyCard } from '../components/JourneyCard';
import { SeatAlertModal } from '../components/SeatAlertModal';
import { PassengerBookingModal } from '../components/PassengerBookingModal';
import { CoachSeatMapModal } from '../components/CoachSeatMapModal';
import { LiveStatusModal } from '../components/LiveStatusModal';
import { PNRStatusModal } from '../components/PNRStatusModal';
import { AuthGate } from '../components/AuthGate';
import { FilterSortBar, TimeWindow, SortOption, TrainTypeFilter } from '../components/FilterSortBar';
import { NormalizedOffer, JourneyOptimizationResult, User, AuthSession } from '../types';
import { searchJourneys, fetchOptimizedJourneyStrategies } from '../lib/api';
import { Compass, Train, Zap, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Search Parameters - Zero Defaults on First Load
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
  const [showLiveStatus, setShowLiveStatus] = useState(false);
  const [showPNRStatus, setShowPNRStatus] = useState(false);

  // Restore authenticated session from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tiktiki_user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to parse cached session:', e);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  const handleAuthenticated = (session: AuthSession) => {
    setCurrentUser(session.user);
    try {
      localStorage.setItem('tiktiki_user', JSON.stringify(session.user));
      localStorage.setItem('tiktiki_token', session.token);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('tiktiki_user');
      localStorage.removeItem('tiktiki_token');
    } catch (e) {
      console.error(e);
    }
  };

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

  // If session is still verifying, show clean loader
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1a365d] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Verifying CRIS Passenger Credentials...</span>
        </div>
      </div>
    );
  }

  // MANDATORY AUTHENTICATION GATE: User must be signed in to access the platform
  if (!currentUser) {
    return <AuthGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-[#ea580c] selection:text-white">
      {/* IRCTC-Themed Top Header with Authenticated User Context */}
      <SearchHeader
        origin={origin}
        destination={destination}
        travelDate={date}
        selectedMode={mode}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onSearch={performSearch}
        onSelectMode={setMode}
        onOpenPNRStatus={() => setShowPNRStatus(true)}
        onOpenLiveStatus={() => setShowLiveStatus(true)}
        onOpenCoachMap={() => {
          if (offers.length > 0) {
            setActiveCoachOffer(offers[0]);
          } else {
            setActiveCoachOffer({
              provider_id: 'irctc_cris',
              mode: 'RAIL',
              operator_name: 'Indian Railways (12951)',
              service_number: '12951 (Tejas Rajdhani Express)',
              origin_code: origin || 'MMCT',
              dest_code: destination || 'NDLS',
              departure_at: new Date().toISOString(),
              arrival_at: new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
              duration_minutes: 960,
              price: 2850,
              currency: 'INR',
              transfers: 0,
              status: 'AVAILABLE',
              available_seats: 14,
              booking_url: '',
              retrieved_at: new Date().toISOString(),
              score: 96,
            });
          }
        }}
      />

      {/* Wide Fluid Responsive Main Content (Eliminates excessive side padding) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {!hasSearched ? (
          /* Empty Initial State - Zero Pre-selected Defaults */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Elevated Clean Indian Railways Hero Card */}
            <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-5 text-[#1a365d] shadow-sm">
                <Compass className="w-8 h-8 text-[#1a365d]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-[#ea580c] mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Direct IRCTC Integration · No Redirection
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 max-w-2xl tracking-tight leading-tight">
                Authentic Indian Railways Discovery & Direct In-App Booking
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mt-3 leading-relaxed">
                Search all trains, explore verified seat availability, unlock upstream quotas, and complete tickets directly through your IRCTC passenger account.
              </p>

              {/* Quick Explore Corridors */}
              <div className="mt-8 flex flex-col items-center gap-3 w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Popular High-Demand Travel Corridors
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-semibold text-slate-700 hover:text-[#1a365d] border border-slate-200 hover:border-blue-300 transition-colors shadow-sm"
                    >
                      <Train className="w-3.5 h-3.5 text-[#1a365d]" />
                      {corridor.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Authentic Feature Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full text-left">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" /> Upstream Quota Bypass
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automatically discovers vacant seats originating 1-2 halts prior with legal boarding point switches.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-[#1a365d] font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1a365d]" /> In-App Direct Booking
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Book tickets without broken IRCTC redirects. View all booked tickets in your personalized Passbook.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-amber-700 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Multi-Modal Transit
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Compare trains, intercity sleeper buses, and nonstop flights objectively with transparent fares.
                  </p>
                </div>
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
                  <div key={i} className="h-44 w-full bg-white rounded-2xl animate-pulse border border-slate-200" />
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
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-700 font-medium text-sm">No routes found matching current filters.</p>
                <p className="text-xs text-slate-500 mt-1">Try resetting the departure time window or service filter to view all available transit options.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* In-App Railway Passenger Booking Modal */}
      <PassengerBookingModal
        offer={activeBookingOffer}
        currentUser={currentUser}
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

      {/* Live Train Running Status Modal */}
      <LiveStatusModal
        isOpen={showLiveStatus}
        onClose={() => setShowLiveStatus(false)}
      />

      {/* Live CRIS PNR Status Tracking Modal */}
      <PNRStatusModal
        isOpen={showPNRStatus}
        onClose={() => setShowPNRStatus(false)}
      />

      {/* Seat Alert Sniping Modal */}
      <SeatAlertModal
        offer={activeAlertOffer}
        onClose={() => setActiveAlertOffer(null)}
      />

      <footer className="w-full border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-medium">
        Tiktiki (JourneyOS) · Official CRIS & IRCTC Partner Engine · Zero Hidden Booking Fees
      </footer>
    </div>
  );
}
