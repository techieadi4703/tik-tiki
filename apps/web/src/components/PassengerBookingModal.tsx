'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Train,
  Ticket,
  Plus,
  Trash2,
  Users,
  Award,
  Utensils,
} from 'lucide-react';
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
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'AUTH' | 'SUCCESS'>('DETAILS');
  const [quota, setQuota] = useState<'GN' | 'SS' | 'LD' | 'TQ'>('GN');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('aditya@okhdfcbank');
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [txnRef, setTxnRef] = useState('');
  const [irctcUsername, setIrctcUsername] = useState('');
  const [irctcPassword, setIrctcPassword] = useState('');

  // Multi-Passenger Manifest State (Up to 6 passengers per Indian Railways standard)
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      full_name: '',
      age: 26,
      gender: 'MALE',
      berth_preference: 'LOWER',
      senior_citizen: false,
      food_preference: 'VEG',
    },
  ]);

  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync logged in traveler to Passenger #1 and IRCTC Username
  useEffect(() => {
    if (currentUser) {
      setIrctcUsername(currentUser.irctc_username || 'ADITYA_CRIS');
      setPassengers((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && !updated[0].full_name) {
          updated[0].full_name = currentUser.name || '';
        }
        return updated;
      });
    }
  }, [currentUser]);

  if (!offer) return null;

  const basePricePerPerson = offer.price;
  const totalFare = basePricePerPerson * passengers.length;

  const handleAddPassenger = () => {
    if (passengers.length >= 6) return;
    setPassengers([
      ...passengers,
      {
        full_name: '',
        age: 28,
        gender: 'FEMALE',
        berth_preference: 'NO_PREFERENCE',
        senior_citizen: false,
        food_preference: 'VEG',
      },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handlePassengerChange = (index: number, field: keyof Passenger, value: any) => {
    setPassengers((prev) => {
      const updated = [...prev];
      const parsedValue = field === 'age' ? (parseInt(value, 10) || 0) : value;
      const pax = { ...updated[index], [field]: parsedValue };

      // Auto-detect Senior Citizen eligibility in India (Men >= 60, Women >= 58)
      if (field === 'age' || field === 'gender') {
        const ageNum = field === 'age' ? (parseInt(value, 10) || 0) : pax.age;
        const genderVal = field === 'gender' ? value : pax.gender;
        if (ageNum >= 60 || (genderVal === 'FEMALE' && ageNum >= 58)) {
          pax.senior_citizen = true;
          if (pax.berth_preference === 'NO_PREFERENCE' || pax.berth_preference === 'UPPER') {
            pax.berth_preference = 'LOWER';
          }
        } else {
          pax.senior_citizen = false;
        }
      }

      updated[index] = pax;
      return updated;
    });
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all passenger entries
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.full_name.trim()) {
        setError(`Please enter the full name for Passenger ${i + 1}`);
        return;
      }
      const ageVal = parseInt(String(p.age), 10);
      if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) {
        setError(`Please enter a valid age (1-120) for Passenger ${i + 1}`);
        return;
      }
    }

    if (!irctcUsername.trim()) {
      setError('IRCTC User ID is required for official Indian Railways booking');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sanitizedPassengers = passengers.map((p) => ({
        ...p,
        full_name: p.full_name.trim(),
        age: parseInt(String(p.age), 10) || 25,
        gender: p.gender || 'MALE',
        berth_preference: p.berth_preference || 'NO_PREFERENCE',
        senior_citizen: Boolean(p.senior_citizen),
        food_preference: p.food_preference || 'NO_FOOD',
      }));

      const initiated = await initiateBooking({
        user_id: currentUser?.id,
        train_number: offer.service_number.split(' ')[0],
        train_name: offer.service_number,
        origin_code: offer.origin_code,
        dest_code: offer.dest_code,
        departure_at: offer.departure_at,
        arrival_at: offer.arrival_at,
        class_code: '3A',
        quota,
        total_fare: totalFare,
        irctc_username: irctcUsername.trim(),
        passengers: sanitizedPassengers,
      });

      setPendingBooking(initiated);
      setStep('PAYMENT');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate booking';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('PROCESSING');
    setError(null);

    setTimeout(() => {
      setTxnRef(`TXN_${Date.now().toString().slice(-8)}`);
      setPaymentStatus('SUCCESS');
      setTimeout(() => {
        setStep('AUTH');
      }, 700);
    }, 900);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Strip */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1a365d] shrink-0">
            <Train className="w-5 h-5 text-[#1a365d]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-orange-700 bg-orange-100 px-2 py-0.5 rounded font-black border border-orange-300">
                CRIS In-App Booking
              </span>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
              {step === 'SUCCESS' ? 'Tickets Confirmed & Issued!' : offer.service_number}
            </h3>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
          <div>
            <div className="text-slate-500 font-medium">Route & Class</div>
            <div className="text-slate-900 font-bold text-sm">
              {offer.origin_code} → {offer.dest_code} · 3AC (AC 3-Tier)
            </div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Fare Calculation</div>
            <div className="text-slate-900 font-bold text-sm">
              ₹{basePricePerPerson.toLocaleString('en-IN')} × {passengers.length} = <span className="text-[#ea580c] font-black">₹{totalFare.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 font-medium">Availability</div>
            <div className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant CNF
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* STEP 1: MULTI-PASSENGER FORM */}
          {step === 'DETAILS' && (
            <form onSubmit={handleInitiate} className="flex flex-col gap-4">
              {/* Quota Selector */}
              <div className="flex flex-col gap-1.5 bg-blue-50/60 p-3 rounded-2xl border border-blue-200">
                <span className="text-[11px] font-bold uppercase text-[#1a365d] tracking-wider">
                  Select Booking Quota
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'GN', label: 'General (GN)' },
                    { id: 'SS', label: 'Senior Citizen (SS)' },
                    { id: 'LD', label: 'Ladies (LD)' },
                    { id: 'TQ', label: 'Tatkal (TQ)' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuota(q.id as any)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                        quota === q.id
                          ? 'bg-[#1a365d] text-white border-[#1a365d] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passengers Container */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#1a365d]" />
                    Passenger Details ({passengers.length}/6 Max)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Names must match Govt Photo ID
                  </span>
                </div>

                {passengers.map((pax, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col gap-3 relative transition-all hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#1a365d] text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {idx === 0 ? 'Passenger 1 (Primary Traveler)' : `Passenger ${idx + 1}`}
                        </span>
                        {pax.senior_citizen && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" /> Senior Citizen
                          </span>
                        )}
                      </div>

                      {passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePassenger(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove Passenger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Passenger Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      {/* Name */}
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Full Name (As on ID)
                        </label>
                        <div className="flex items-center bg-white rounded-xl px-3 py-2 border border-slate-300 focus-within:border-[#1a365d] focus-within:ring-1 focus-within:ring-[#1a365d]">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                          <input
                            type="text"
                            required
                            value={pax.full_name}
                            onChange={(e) => handlePassengerChange(idx, 'full_name', e.target.value)}
                            placeholder="e.g. Aditya Srivastava"
                            className="w-full bg-transparent text-slate-900 text-xs focus:outline-none font-medium"
                          />
                        </div>
                      </div>

                      {/* Age */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          required
                          value={pax.age}
                          onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                          className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-300 focus:outline-none focus:border-[#1a365d] font-bold"
                        />
                      </div>

                      {/* Gender */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Gender
                        </label>
                        <select
                          value={pax.gender}
                          onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                          className="w-full bg-white text-slate-900 text-xs rounded-xl px-2 py-2 border border-slate-300 focus:outline-none focus:border-[#1a365d] font-medium"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="TRANSGENDER">Transgender</option>
                        </select>
                      </div>
                    </div>

                    {/* Berth & Quota Preferences */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Berth Preference
                        </label>
                        <select
                          value={pax.berth_preference}
                          onChange={(e) => handlePassengerChange(idx, 'berth_preference', e.target.value)}
                          className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-300 focus:outline-none focus:border-[#1a365d]"
                        >
                          <option value="NO_PREFERENCE">No Preference</option>
                          <option value="LOWER">Lower Berth (L)</option>
                          <option value="MIDDLE">Middle Berth (M)</option>
                          <option value="UPPER">Upper Berth (U)</option>
                          <option value="SIDE_LOWER">Side Lower (SL)</option>
                          <option value="SIDE_UPPER">Side Upper (SU)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Meal Preference
                        </label>
                        <select
                          value={pax.food_preference}
                          onChange={(e) => handlePassengerChange(idx, 'food_preference', e.target.value)}
                          className="w-full bg-white text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-300 focus:outline-none focus:border-[#1a365d]"
                        >
                          <option value="VEG">Vegetarian Meal</option>
                          <option value="NON_VEG">Non-Vegetarian Meal</option>
                          <option value="NO_FOOD">No Meal</option>
                        </select>
                      </div>
                    </div>

                    {/* Senior Citizen Checkbox */}
                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pax.senior_citizen}
                        onChange={(e) => handlePassengerChange(idx, 'senior_citizen', e.target.checked)}
                        className="rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c] h-3.5 w-3.5"
                      />
                      <span className="text-[11px] text-slate-700 font-semibold">
                        Senior Citizen Quota / Lower Berth Priority (Men 60+, Women 58+)
                      </span>
                    </label>
                  </div>
                ))}

                {/* Add Passenger Action Button */}
                {passengers.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddPassenger}
                    className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-[#1a365d] bg-blue-50/40 hover:bg-blue-50 text-[#1a365d] font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Passenger ({passengers.length}/6)</span>
                  </button>
                )}
              </div>

              {/* IRCTC User ID */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Authorized IRCTC User ID
                </label>
                <div className="flex items-center bg-white rounded-xl px-3 py-2.5 border border-slate-300 focus-within:border-[#1a365d]">
                  <span className="text-xs text-[#1a365d] font-mono font-black mr-2">IRCTC:</span>
                  <input
                    type="text"
                    required
                    value={irctcUsername}
                    onChange={(e) => setIrctcUsername(e.target.value)}
                    placeholder="Your IRCTC Username (e.g. ADITYA_CRIS)"
                    className="w-full bg-transparent text-slate-900 text-sm focus:outline-none font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Mandatory under CRIS regulations for PRS charting. Direct verification.
                </span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full py-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reserving {passengers.length} Berths in CRIS...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment Checkout (₹{totalFare.toLocaleString('en-IN')})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: ESCROW PAYMENT CHECKOUT GATEWAY */}
          {step === 'PAYMENT' && pendingBooking && (
            <form onSubmit={handleSimulatePayment} className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Fare Summary & Tax Invoice
                </span>
                <div className="flex justify-between text-slate-700">
                  <span>Base Ticket Fare ({passengers.length} {passengers.length === 1 ? 'Pax' : 'Pax'} · 3AC):</span>
                  <span className="font-mono font-semibold">₹{totalFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>IRCTC Convenience Fee (Statutory):</span>
                  <span className="font-mono font-semibold">₹17.70</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>GST (5% on AC Travel):</span>
                  <span className="font-mono font-semibold">₹{(totalFare * 0.05).toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-bold text-sm">
                  <span>Total Payable:</span>
                  <span className="text-[#ea580c] font-black">
                    ₹{(totalFare + 17.70 + totalFare * 0.05).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI (GPay / PhonePe)' },
                    { id: 'CARD', label: 'Credit / Debit Card' },
                    { id: 'NETBANKING', label: 'Net Banking' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        paymentMethod === m.id
                          ? 'border-[#1a365d] bg-blue-50 text-[#1a365d] shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white p-1 rounded-xl border border-slate-300 flex items-center justify-center shrink-0">
                      <div className="w-full h-full bg-slate-900 rounded grid grid-cols-3 gap-0.5 p-1">
                        <div className="bg-white rounded-xs" />
                        <div className="bg-transparent" />
                        <div className="bg-white rounded-xs" />
                        <div className="bg-transparent" />
                        <div className="bg-white rounded-xs" />
                        <div className="bg-transparent" />
                        <div className="bg-white rounded-xs" />
                        <div className="bg-transparent" />
                        <div className="bg-white rounded-xs" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Scan QR Code or Enter UPI ID</span>
                      <span className="text-[11px] text-slate-600">
                        Supports Google Pay, PhonePe, Paytm, CRED & any BHIM UPI app
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center bg-white rounded-xl px-3 py-2 border border-slate-300 text-xs">
                    <span className="font-mono text-slate-400 mr-2">UPI:</span>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@bank"
                      className="w-full bg-transparent text-slate-900 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Card Number</label>
                    <input
                      type="text"
                      defaultValue="4242 •••• •••• 4242"
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Expiry</label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">CVV</label>
                      <input
                        type="password"
                        defaultValue="•••"
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'NETBANKING' && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs font-semibold">
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank, i) => (
                    <div
                      key={bank}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        i === 0 ? 'bg-white border-[#1a365d] text-[#1a365d]' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {bank}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={paymentStatus !== 'IDLE'}
                className="mt-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {paymentStatus === 'PROCESSING' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment (₹{(totalFare + 17.70 + totalFare * 0.05).toFixed(2)})...</span>
                  </>
                ) : paymentStatus === 'SUCCESS' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Payment Verified! Redirecting to IRCTC Auth...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{(totalFare + 17.70 + totalFare * 0.05).toFixed(2)} & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: IRCTC AUTHENTICATION */}
          {step === 'AUTH' && pendingBooking && (
            <form onSubmit={handleConfirmAuth} className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span>Berths locked in CRIS for 09:59 mins:</span>
                  <span className="font-bold text-[#1a365d]">{passengers.length} Passengers</span>
                </div>
                <div className="space-y-1 mt-2 border-t border-blue-200/80 pt-2">
                  {passengers.map((p, i) => (
                    <div key={i} className="flex justify-between text-slate-800">
                      <span className="font-semibold">
                        {i + 1}. {p.full_name} ({p.age}y, {p.gender})
                      </span>
                      <span className="font-mono text-[#1a365d]">
                        Pref: {p.berth_preference || 'Lower'} {p.senior_citizen ? '· [Senior]' : ''}
                      </span>
                    </div>
                  ))}
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
                    placeholder="Enter IRCTC Password or OTP"
                    className="w-full bg-transparent text-slate-900 text-sm focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Simulates authorized CRIS tokenized B2B handshake. Zero booking markup.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Zero cancellation markups · Instant PRS PNR allocation</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Issuing PNR for {passengers.length} Passengers...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Issue e-Tickets (₹{totalFare.toLocaleString('en-IN')})</span>
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
              <h4 className="text-xl font-black text-slate-900">
                {confirmedBooking.passengers.length} Tickets Successfully Booked!
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Official Indian Railways PNR issued and allocated in CRIS Central Charts.
              </p>

              <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 w-full text-left font-mono text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Official PNR:</span>
                  <span className="text-emerald-700 font-bold text-sm tracking-wider">{confirmedBooking.pnr}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-sans">Train Service:</span>
                  <span className="text-slate-900 font-semibold">{confirmedBooking.train_number} ({confirmedBooking.train_name})</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 font-sans block mb-1.5 font-bold uppercase text-[10px]">
                    Confirmed Passenger Allocations:
                  </span>
                  <div className="space-y-1">
                    {confirmedBooking.passengers.map((p, i) => (
                      <div key={i} className="flex justify-between bg-white p-2 rounded-lg border border-slate-200 text-slate-800">
                        <span className="font-sans font-medium">{p.full_name} ({p.age}y, {p.gender})</span>
                        <span className="font-bold text-[#1a365d]">
                          {p.berth_allocated || `Coach ${confirmedBooking.coach_number}, Berth ${21 + i * 3}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onBookingSuccess(confirmedBooking);
                }}
                className="w-full py-3.5 bg-[#1a365d] hover:bg-[#152a4a] text-white font-bold rounded-xl transition-all shadow-md text-sm"
              >
                View in My Trips Passbook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
