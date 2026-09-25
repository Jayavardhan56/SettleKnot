import React, { useState } from 'react';
import { loginUser, registerUser } from '../lib/auth.js';
import { navigateTo } from '../lib/router.js';
import { LogIn, UserPlus, ArrowLeft, Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AuthPage = ({ initialTab = 'login', onUserAuthenticated }) => {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (tab === 'login') {
      const res = await loginUser(email, password);
      if (res.success && res.user) {
        onUserAuthenticated(res.user);
        navigateTo('dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      const res = await registerUser(name, email, password);
      if (res.success && res.user) {
        onUserAuthenticated(res.user);
        navigateTo('dashboard');
      } else {
        setError(res.error || 'Registration failed. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans bg-slate-50 text-slate-900 py-12 px-4">
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-orange-100/60 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Link */}
      <div className="z-10 mb-8 flex items-center justify-between w-full max-w-md px-2">
        <button
          onClick={() => navigateTo('landing')}
          className="inline-flex items-center gap-2 text-xs font-tech font-bold text-slate-600 hover:text-orange-600 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>

        <div
          onClick={() => navigateTo('landing')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-md">
            ⚡
          </div>
          <span className="font-tech font-bold text-base tracking-tight text-slate-900">SettleKnot</span>
        </div>
      </div>

      {/* Centered Integrated Glass Card Container */}
      <div className="z-10 max-w-md w-full glass-panel-ultra rounded-3xl bg-white/95 border border-slate-200/80 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Card Header Banner */}
        <div className="p-6 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-tech font-bold tracking-wider uppercase mb-1">
              Secure Access
            </span>
            <h2 className="font-tech font-bold text-2xl tracking-tight text-white">
              {tab === 'login' ? 'Welcome Back' : 'Get Started Free'}
            </h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              {tab === 'login' ? 'Sign in to access your trip settlement dashboard' : 'Create an account to manage group expenses'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-2xl border border-white/30 shadow-inner">
            ⚡
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Pill Tab Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100/80 border border-slate-200">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tab === 'login' ? 'bg-white text-orange-600 shadow-md border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tab === 'register' ? 'bg-white text-orange-600 shadow-md border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-fadeIn flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-tech font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15 font-sans transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15 font-sans transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15 font-sans transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl btn-tech-orange font-tech font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <span>{loading ? 'Authenticating...' : tab === 'login' ? 'Sign In ⚡' : 'Create Account 🚀'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Micro Footer Features */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Min-Cash Flow Engine</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Secure Session</span>
            </div>
          </div>
        </div>
      </div>

      <p className="z-10 mt-8 text-xs text-slate-500 font-medium text-center">
        SettleKnot © 2026 • Group Trip Expense & Settlement Platform
      </p>
    </div>
  );
};

