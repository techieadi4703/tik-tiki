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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Alert Activated!</h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              We are now monitoring <strong className="text-white">{offer.service_number}</strong>. As soon as a bookable berth frees up, we will ping you on {channel === 'WHATSAPP' ? 'WhatsApp' : 'browser push'} with a direct 1-click booking link.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-transform active:scale-95 shadow"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Seat Availability Sniping</h3>
                <span className="text-xs text-slate-400">Never refresh IRCTC manually again</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Train:</span>
                <strong className="text-white">{offer.service_number}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Route:</span>
                <strong className="text-white">{offer.origin_code} → {offer.dest_code}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Date:</span>
                <strong className="text-white">{offer.departure_at.split('T')[0]}</strong>
              </div>
            </div>

            {/* Notification Channel Picker */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('WEB_PUSH')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  channel === 'WEB_PUSH'
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4 text-sky-400" /> Web Push
              </button>
            </div>

            {channel === 'WHATSAPP' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Your WhatsApp Mobile Number
                </label>
                <div className="flex items-center bg-slate-800/90 rounded-xl px-3 py-2.5 border border-slate-700/60 focus-within:border-emerald-500">
                  <span className="text-xs font-bold text-slate-400 mr-2">+91</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full bg-transparent text-white text-sm font-medium focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs font-medium text-rose-400 bg-rose-950/50 border border-rose-800/50 p-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold text-sm rounded-xl transition-transform active:scale-95 shadow flex items-center justify-center gap-2"
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
