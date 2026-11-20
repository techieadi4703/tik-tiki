'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Train, Compass, Ticket, RefreshCw } from 'lucide-react';
import { Booking } from '../../types';
import { fetchUserTrips } from '../../lib/api';
import { TicketPassbook } from '../../components/TicketPassbook';

export default function TripsPage() {
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await fetchUserTrips('usr_demo');
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="w-full bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Back to Search"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-base">
                  t
                </span>
                tiktiki
              </span>
              <span className="text-xs font-semibold uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full ml-1">
                My Trips
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadTrips}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Trips"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync IRCTC</span>
            </button>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Search Journeys</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-emerald-400" />
              My Booked Tickets & Passbook
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Your official confirmed Indian Railways e-tickets, PNR status, and coach allocations.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-700">
            {trips.length} Bookings
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 w-full bg-slate-900/60 rounded-3xl animate-pulse border border-slate-800/50" />
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="flex flex-col gap-6">
            {trips.map((booking) => (
              <TicketPassbook key={booking.id || booking.pnr} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <Train className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No active trips found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Book a train journey from the search page with instant IRCTC verification to view your digital ticket passbook here.
            </p>
            <Link
              href="/"
              className="mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
            >
              Explore Trains Now
            </Link>
          </div>
        )}
      </main>

      <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Tiktiki · Modern Multi-Modal Travel Intelligence · Official Partner e-Tickets
      </footer>
    </div>
  );
}
