'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, User as UserIcon, Lock, CheckCircle2, AlertCircle, ArrowRight, Train, Ticket } from 'lucide-react';
import { NormalizedOffer, Booking, Passenger, User } from '../types';
import { initiateBooking, confirmBooking } from '../lib/api';

interface PassengerBookingModalProps {
  offer: NormalizedOffer | null;
  currentUser?: User | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export function PassengerBookingModal({
  offer,
  currentUser,
  onClose,
  onBookingSuccess,
}: PassengerBookingModalProps) {
  const [step, setStep] = useState<'DETAILS' | 'AUTH' | 'SUCCESS'>('DETAILS');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('26');
  const [gender, setGender] = useState('MALE');
  const [berthPref, setBerthPref] = useState('LOWER');
  const [irctcUsername, setIrctcUsername] = useState('');
  const [irctcPassword, setIrctcPassword] = useState('');
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync logged in user details if available
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.name);
      if (!irctcUsername) setIrctcUsername(currentUser.irctc_username);
    }
  }, [currentUser]);

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
        user_id: currentUser?.id,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1a365d] shrink-0">
            <Train className="w-5 h-5 text-[#1a365d]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {step === 'SUCCESS' ? 'Ticket Confirmed & Issued!' : 'Direct IRCTC Partner Booking'}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {offer.service_number} · {offer.origin_code} → {offer.dest_code}
            </span>
          </div>
        </div>

        {/* Train Summary Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between mb-5 text-xs">
          <div>
            <div className="text-slate-500 font-medium">Class & Fare</div>
            <div className="text-slate-900 font-bold text-sm">3AC · ₹{offer.price.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 font-medium">Availability Status</div>
            <div className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant CNF Allotment
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PASSENGER & IRCTC USERNAME FORM */}
        {step === 'DETAILS' && (
          <form onSubmit={handleInitiate} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Passenger Full Name (As on Govt ID)
              </label>
              <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-300 focus-within:border-[#1a365d] focus-within:bg-white transition-all">
                <UserIcon className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aditya Srivastava"
                  className="w-full bg-transparent text-slate-900 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl px-3 py-2.5 border border-slate-300 focus:outline-none focus:border-[#1a365d] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl px-2 py-2.5 border border-slate-300 focus:outline-none focus:border-[#1a365d] focus:bg-white transition-all"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="TRANSGENDER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Berth
                </label>
                <select
                  value={berthPref}
                  onChange={(e) => setBerthPref(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl px-2 py-2.5 border border-slate-300 focus:outline-none focus:border-[#1a365d] focus:bg-white transition-all"
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                IRCTC User ID
              </label>
              <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-300 focus-within:border-[#1a365d] focus-within:bg-white transition-all">
                <span className="text-xs text-[#1a365d] font-mono font-bold mr-2">IRCTC:</span>
                <input
                  type="text"
                  required
                  value={irctcUsername}
                  onChange={(e) => setIrctcUsername(e.target.value)}
                  placeholder="Your IRCTC Username"
                  className="w-full bg-transparent text-slate-900 text-sm focus:outline-none font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Required by CRIS for official PNR issuance. No redirect needed.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Locking Berth in CRIS...</span>
                </>
              ) : (
                <>
                  <span>Proceed to IRCTC Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: IRCTC AUTHENTICATION */}
        {step === 'AUTH' && pendingBooking && (
          <form onSubmit={handleConfirmAuth} className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
              <div className="text-slate-600">Berth locked for 09:59 mins:</div>
              <div className="text-[#1a365d] font-bold text-sm mt-0.5">
                Coach {pendingBooking.coach_number} · Berth {pendingBooking.berth_number} ({pendingBooking.berth_type})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Authorize IRCTC Account: <strong className="text-slate-900 font-mono">{irctcUsername}</strong>
              </label>
              <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-300 focus-within:border-[#1a365d] focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  value={irctcPassword}
                  onChange={(e) => setIrctcPassword(e.target.value)}
                  placeholder="IRCTC Password or OTP"
                  className="w-full bg-transparent text-slate-900 text-sm focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Secure tokenized authorization via CRIS partner channel.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Zero cancellation markups · Instant PNR generation</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Issuing Official PNR...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Issue e-Ticket (₹{offer.price})</span>
                  <Ticket className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'SUCCESS' && confirmedBooking && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-xl font-black text-slate-900">Ticket Successfully Booked!</h4>
            <p className="text-xs text-slate-600 mt-1">Official IRCTC PNR has been generated and added to your Passbook.</p>

            <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 w-full text-left font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">PNR Number:</span>
                <span className="text-emerald-700 font-bold text-sm">{confirmedBooking.pnr}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500">Train:</span>
                <span className="text-slate-900 font-semibold">{confirmedBooking.train_number} ({confirmedBooking.train_name})</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Berth Allocation:</span>
                <span className="text-[#1a365d] font-bold">Coach {confirmedBooking.coach_number}, Berth {confirmedBooking.berth_number} ({confirmedBooking.berth_type})</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onBookingSuccess(confirmedBooking);
              }}
              className="w-full py-3 bg-[#1a365d] hover:bg-[#152a4a] text-white font-bold rounded-xl transition-all shadow-md text-sm"
            >
              View in My Trips Passbook
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
