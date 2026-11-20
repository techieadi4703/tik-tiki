'use client';

import React, { useState } from 'react';
import { User, AuthSession } from '../types';
import { loginUser, registerUser } from '../lib/api';
import { ShieldCheck, UserCheck, KeyRound, Train, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'QUICK'>('LOGIN');
  const [identifier, setIdentifier] = useState('aditya@tiktiki.in');
  const [password, setPassword] = useState('railway2026');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regIRCTC, setRegIRCTC] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await loginUser(identifier, password);
      onAuthenticated(session);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        irctc_username: regIRCTC,
        phone: regPhone,
      });
      onAuthenticated(session);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const session = await loginUser(email, pass);
      onAuthenticated(session);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* IRCTC / National Transit Header Banner */}
      <div className="bg-[#1a365d] text-white py-3.5 px-4 sm:px-8 border-b-4 border-orange-500 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white text-[#1a365d] flex items-center justify-center font-black text-xl shadow-sm">
              t
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                tiktiki <span className="text-xs font-mono font-semibold uppercase bg-orange-600 text-white px-2 py-0.5 rounded">JourneyOS</span>
              </div>
              <div className="text-[11px] text-blue-200">
                CRIS & IRCTC Certified Travel Intelligence Platform
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authorized Passenger Booking Gate · 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Top Title */}
          <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[#1a365d] mb-3">
              <Train className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Passenger Access Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to unlock live seat sniping, segment hacks, and direct confirmed railway reservations.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => { setTab('LOGIN'); setError(null); }}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                tab === 'LOGIN'
                  ? 'border-orange-500 text-[#1a365d] bg-white font-extrabold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('QUICK'); setError(null); }}
              className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1 ${
                tab === 'QUICK'
                  ? 'border-orange-500 text-[#1a365d] bg-white font-extrabold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> 1-Click Access
            </button>
            <button
              type="button"
              onClick={() => { setTab('REGISTER'); setError(null); }}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                tab === 'REGISTER'
                  ? 'border-orange-500 text-[#1a365d] bg-white font-extrabold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Register New
            </button>
          </div>

          <div className="p-6 sm:p-7">
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: STANDARD LOGIN */}
            {tab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email or IRCTC User ID
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. aditya@tiktiki.in or ADITYA_CRIS"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-3 bg-[#1a365d] hover:bg-[#132742] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In & Enter JourneyOS'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: 1-CLICK VERIFIED TRAVELER ACCOUNTS */}
            {tab === 'QUICK' && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-slate-500 mb-1">
                  Select a pre-verified traveler account to bypass login instantly:
                </span>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('aditya@tiktiki.in', 'railway2026')}
                  disabled={loading}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-[#1a365d] flex items-center justify-center font-bold text-sm">
                      AS
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        Aditya Srivastava
                      </div>
                      <div className="text-[11px] text-slate-500">
                        IRCTC: <strong>ADITYA_CRIS</strong> · aditya@tiktiki.in
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-md">
                    Sign In →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('demo@irctc.co.in', 'irctc123')}
                  disabled={loading}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      VT
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        Verified IRCTC Traveler
                      </div>
                      <div className="text-[11px] text-slate-500">
                        IRCTC: <strong>DEMO_PASSENGER</strong> · demo@irctc.co.in
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                    Sign In →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@tiktiki.in', 'admin2026')}
                  disabled={loading}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                      AD
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                        IRCTC Operations Admin
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Role: <strong>ADMIN</strong> · admin@tiktiki.in
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md">
                    Admin →
                  </span>
                </button>
              </div>
            )}

            {/* TAB 3: REGISTER NEW TRAVELER */}
            {tab === 'REGISTER' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3 text-left">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Full Name (As per Govt ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      IRCTC Username
                    </label>
                    <input
                      type="text"
                      value={regIRCTC}
                      onChange={(e) => setRegIRCTC(e.target.value)}
                      placeholder="e.g. RAMESH_IRCTC"
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Mobile Number (For WhatsApp / SMS Alerts)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating Account...' : 'Register Traveler Account'} <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Legal Compliance Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center text-[11px] text-slate-500 leading-normal">
            Direct CRIS railway booking gateway · Compliant with Section 143 of the Railways Act.
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="w-full bg-slate-200 py-4 text-center text-xs text-slate-600 font-mono border-t border-slate-300">
        Tiktiki JourneyOS · Official Multi-Modal Transit Intelligence System
      </footer>
    </div>
  );
}
