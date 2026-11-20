'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import { NormalizedOffer } from '../types';
import { createAlert } from '../lib/api';

interface SeatAlertModalProps {
  offer: NormalizedOffer | null;
  onClose: () => void;
}

export function SeatAlertModal({ offer, onClose }: SeatAlertModalProps) {
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'WHATSAPP' | 'WEB_PUSH'>('WHATSAPP');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore saved phone from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tiktiki_user_phone');
    if (saved) setPhone(saved);
  }, []);

  if (!offer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (channel === 'WHATSAPP') {
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        if (cleanPhone.length < 10) {
          throw new Error('Please enter a valid 10-digit mobile number');
        }
        localStorage.setItem('tiktiki_user_phone', cleanPhone);
      }

      await createAlert({
        service_number: offer.service_number,
        origin: offer.origin_code,
        destination: offer.dest_code,
        departure_date: offer.departure_at.split('T')[0],
        notification_channel: channel,
        phone_number: channel === 'WHATSAPP' ? phone : undefined,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to activate alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Seat Alert Activated!</h3>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              We are now monitoring <strong className="text-slate-900">{offer.service_number}</strong>. As soon as a bookable berth opens via cancellations or quota release, we will ping you on {channel === 'WHATSAPP' ? 'WhatsApp' : 'browser push'}.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-transform active:scale-95 shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-orange-100 text-[#ea580c] border border-orange-200">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-base">Seat Availability Sniping</h3>
                <span className="text-xs text-slate-500">Auto-monitors cancellation releases 24x7</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Train:</span>
                <strong className="text-slate-900">{offer.service_number}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Route:</span>
                <strong className="text-slate-900">{offer.origin_code} → {offer.dest_code}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <strong className="text-slate-900">{offer.departure_at.split('T')[0]}</strong>
              </div>
            </div>

            {/* Notification Channel Picker */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('WEB_PUSH')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  channel === 'WEB_PUSH'
                    ? 'bg-blue-50 border-blue-400 text-[#1a365d] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell className="w-4 h-4 text-blue-600" /> Web Push
              </button>
            </div>

            {channel === 'WHATSAPP' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Your WhatsApp Mobile Number
                </label>
                <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-300 focus-within:border-[#1a365d] focus-within:bg-white transition-all">
                  <span className="text-xs font-bold text-slate-500 mr-2">+91</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full bg-transparent text-slate-900 text-sm font-medium focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Activating Watch...
                </>
              ) : (
                'Start Watching (100% Free)'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
