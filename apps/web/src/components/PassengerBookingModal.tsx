'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, User, Lock, CheckCircle2, AlertCircle, ArrowRight, Train } from 'lucide-react';
import { NormalizedOffer, Booking, Passenger } from '../types';
import { initiateBooking, confirmBooking } from '../lib/api';

interface PassengerBookingModalProps {
  offer: NormalizedOffer | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export function PassengerBookingModal({
  offer,
  onClose,
  onBookingSuccess,
}: PassengerBookingModalProps) {
  const [step, setStep] = useState<'DETAILS' | 'AUTH' | 'SUCCESS'>('DETAILS');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('MALE');
  const [berthPref, setBerthPref] = useState('NO_PREFERENCE');
  const [irctcUsername, setIrctcUsername] = useState('');
  const [irctcPassword, setIrctcPassword] = useState('');
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!offer) return null;

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Passenger name is required');
      return;
    }
    if (!irctcUsername.trim()) {
      setError('IRCTC User ID is required for Indian Railways booking');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const passengers: Passenger[] = [
        {
          full_name: fullName.trim(),
          age: parseInt(age) || 26,
          gender,
          berth_preference: berthPref,
        },
      ];

      const initiated = await initiateBooking({
        train_number: offer.service_number.split(' ')[0],
        train_name: offer.service_number,
        origin_code: offer.origin_code,
        dest_code: offer.dest_code,
        departure_at: offer.departure_at,
        arrival_at: offer.arrival_at,
        class_code: '3A',
        total_fare: offer.price,
        irctc_username: irctcUsername.trim(),
        passengers,
      });

      setPendingBooking(initiated);
      setStep('AUTH');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate booking';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingBooking) return;
    if (!irctcPassword.trim()) {
      setError('Please enter your IRCTC password / OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const confirmed = await confirmBooking({
        booking_id: pendingBooking.id,
        irctc_username: irctcUsername.trim(),
        irctc_password: irctcPassword.trim(),
        auth_method: 'PASSWORD',
      });

      setConfirmedBooking(confirmed);
      setStep('SUCCESS');
      onBookingSuccess(confirmed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'IRCTC authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {step === 'SUCCESS' ? 'Ticket Confirmed!' : 'In-App Railway Booking'}
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              {offer.service_number} · {offer.origin_code} → {offer.dest_code}
            </span>
          </div>
        </div>

        {/* Train Summary Strip */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between mb-5 text-xs">
          <div>
            <div className="text-slate-400">Class & Fare</div>
            <div className="text-white font-bold text-sm">3AC · ₹{offer.price.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400">Status</div>
            <div className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Confirmation
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PASSENGER & IRCTC USERNAME FORM */}
        {step === 'DETAILS' && (
          <form onSubmit={handleInitiate} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Passenger Full Name (As on Govt ID)
              </label>
              <div className="flex items-center bg-slate-950 rounded-xl px-3 py-2.5 border border-slate-800 focus-within:border-emerald-500">
                <User className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aditya Srivastava"
                  className="w-full bg-transparent text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-950 text-white text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 text-white text-sm rounded-xl px-2 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="TRANSGENDER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Berth
                </label>
                <select
                  value={berthPref}
                  onChange={(e) => setBerthPref(e.target.value)}
                  className="w-full bg-slate-950 text-white text-sm rounded-xl px-2 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="LOWER">Lower</option>
                  <option value="SIDE_LOWER">Side Lower</option>
                  <option value="MIDDLE">Middle</option>
                  <option value="UPPER">Upper</option>
                  <option value="SIDE_UPPER">Side Upper</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                IRCTC User ID
              </label>
              <div className="flex items-center bg-slate-950 rounded-xl px-3 py-2.5 border border-slate-800 focus-within:border-emerald-500">
                <span className="text-xs text-emerald-400 font-mono font-bold mr-2">IRCTC:</span>
                <input
                  type="text"
                  required
                  value={irctcUsername}
                  onChange={(e) => setIrctcUsername(e.target.value)}
                  placeholder="Your IRCTC Username"
                  className="w-full bg-transparent text-white text-sm focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Required by Indian Railways for official PNR issuance.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Reserving Inventory Hold...' : 'Proceed to IRCTC Verification'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OFFICIAL IRCTC SANDBOX AUTH MODAL */}
        {step === 'AUTH' && (
          <form onSubmit={handleConfirmAuth} className="flex flex-col gap-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">Official IRCTC Authentication Gate</span>
                Enter password for <strong className="text-emerald-400">{irctcUsername}</strong> to issue PNR.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                IRCTC Account Password / Sandbox PIN
              </label>
              <div className="flex items-center bg-slate-950 rounded-xl px-3 py-2.5 border border-slate-800 focus-within:border-emerald-500">
                <Lock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={irctcPassword}
                  onChange={(e) => setIrctcPassword(e.target.value)}
                  placeholder="Enter IRCTC Password"
                  className="w-full bg-transparent text-white text-sm focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Your credentials verify directly with Indian Railways. Never shared or stored.
              </span>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Authenticating & Generating PNR...' : 'Authorize & Issue PNR'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS & PNR CONFIRMATION */}
        {step === 'SUCCESS' && confirmedBooking && (
          <div className="flex flex-col items-center text-center py-2">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h4 className="text-xl font-black text-white">Confirmed Booking!</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Your official Indian Railways ticket has been issued and linked to your Tiktiki account.
            </p>

            {/* PNR Card */}
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-4 my-4 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400 font-medium">PNR Number</span>
                <span className="text-base font-mono font-black text-emerald-400 tracking-wider">
                  {confirmedBooking.pnr}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Coach & Berth</span>
                <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                  Coach {confirmedBooking.coach_number} · Berth {confirmedBooking.berth_number} ({confirmedBooking.berth_type})
                </span>
              </div>
            </div>

            <a
              href="/trips"
              className="w-full py-3 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              View Ticket in My Trips ➔
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
