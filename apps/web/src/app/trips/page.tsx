'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Train, Compass, Ticket, RefreshCw, User as UserIcon, LogOut } from 'lucide-react';
import { Booking, User } from '../../types';
import { fetchUserTrips } from '../../lib/api';
import { TicketPassbook } from '../../components/TicketPassbook';

export default function TripsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore authenticated user
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tiktiki_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const userId = currentUser?.id || 'usr_aditya';
      const data = await fetchUserTrips(userId);
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header - IRCTC Authentic Navy Theme */}
      <header className="w-full bg-[#1a365d] border-b border-[#122846] py-3.5 px-4 sm:px-6 lg:px-8 shadow-md text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Back to Search"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-[#ea580c] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  t
                </span>
                tiktiki
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300 bg-orange-950/40 border border-orange-500/30 px-2 py-0.5 rounded-full ml-1">
                CRIS Passbook
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-semibold text-white">{currentUser.name}</span>
                <span className="text-blue-200 font-mono">({currentUser.irctc_username})</span>
              </div>
            )}

            <button
              onClick={loadTrips}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Trips"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync IRCTC</span>
            </button>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Search Journeys</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area - Wide Container matching Search Engine */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-[#1a365d]" />
              Booked Tickets & E-Ticket Passbook
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official confirmed Indian Railways e-tickets, active PNRs, and coach allotments under your IRCTC profile.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-white text-[#1a365d] px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            {trips.length} Booked Journeys
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 w-full bg-white rounded-3xl animate-pulse border border-slate-200 shadow-sm" />
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="flex flex-col gap-6">
            {trips.map((booking) => (
              <TicketPassbook key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c] mb-3">
              <Ticket className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No active bookings yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Search for your desired train routes, unlock confirmed upstream berths, and book tickets with direct IRCTC confirmation.
            </p>
            <Link
              href="/"
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs shadow-md transition-colors"
            >
              Search Trains Now
            </Link>
          </div>
        )}
      </main>

      <footer className="w-full border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-medium">
        Tiktiki (JourneyOS) · Official CRIS & IRCTC Partner Engine · Zero Hidden Booking Fees
      </footer>
    </div>
  );
}
