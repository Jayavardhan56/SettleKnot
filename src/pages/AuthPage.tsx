import React, { useState } from 'react';
import { loginUser, registerUser, requestPasswordReset } from '../lib/auth';
import { navigateTo } from '../lib/router';
import { GoogleSignInModal } from '../components/GoogleSignInModal';
import { LogIn, UserPlus, ArrowLeft, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { User } from '../types';

interface AuthPageProps {
  initialTab?: 'login' | 'register' | 'forgot';
  onUserAuthenticated: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialTab = 'login', onUserAuthenticated }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevResetLink('');
    setLoading(true);

    if (tab === 'login') {
      const res = await loginUser(email, password);
      if (res.success && res.user) {
        onUserAuthenticated(res.user);
        navigateTo('dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } else if (tab === 'register') {
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
    } else if (tab === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your registered email address');
        setLoading(false);
        return;
      }
      const res = await requestPasswordReset(email.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'Recovery email dispatched. Please check your inbox.');
        if (res.resetLink) {
          setDevResetLink(res.resetLink);
        }
      } else {
        setError(res.error || 'Unable to find an account with this email address.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans bg-slate-50 text-slate-900 py-10 sm:py-12 px-4">
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-orange-100/60 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Link */}
      <div className="z-10 mb-6 sm:mb-8 flex items-center justify-between w-full max-w-md px-2">
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
          <img src="/logo.png" alt="SettleKnot" className="w-7 h-7 rounded-lg object-cover shadow-xs border border-slate-200 shrink-0" />
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
            <h2 className="font-tech font-bold text-xl sm:text-2xl tracking-tight text-white">
              {tab === 'login' ? 'Welcome Back' : tab === 'register' ? 'Get Started Free' : 'Recover Account'}
            </h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              {tab === 'login'
                ? 'Sign in to access your trip settlement dashboard'
                : tab === 'register'
                ? 'Create an account to manage group expenses'
                : 'Receive a password reset link to your email'}
            </p>
          </div>
          <img src="/logo.png" alt="SettleKnot" className="w-12 h-12 rounded-2xl object-cover border border-white/40 shadow-md shrink-0" />
        </div>

        <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* Pill Tab Switcher */}
          {tab !== 'forgot' ? (
            <div className="flex items-center p-1 rounded-2xl bg-slate-100/80 border border-slate-200">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tab === 'login' ? 'bg-white text-orange-600 shadow-md border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-white text-orange-600 shadow-md border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <KeyRound className="w-4 h-4 text-orange-600" />
                <span className="font-tech font-bold text-xs sm:text-sm">Password Recovery</span>
              </div>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
                className="text-xs font-tech font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Google Sign In Button */}
          {tab !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-tech font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-[11px] font-tech font-bold uppercase tracking-wider text-slate-400">or with email</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
            </>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-fadeIn flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              {devResetLink && (
                <div className="pt-2 border-t border-emerald-200">
                  <p className="text-[11px] text-emerald-700 mb-1 font-bold">Direct Recovery Link (Test Mode):</p>
                  <a
                    href={devResetLink}
                    className="inline-block px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-tech font-bold text-xs hover:bg-emerald-700 transition-colors"
                  >
                    Open Password Reset Screen →
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-tech font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
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

            {tab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-tech font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setError(''); setSuccessMsg(''); }}
                      className="text-xs font-tech font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15 font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl btn-tech-orange font-tech font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : tab === 'login'
                  ? 'Sign In ⚡'
                  : tab === 'register'
                  ? 'Create Account 🚀'
                  : 'Send Recovery Email 📩'}
              </span>
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

      <p className="z-10 mt-6 sm:mt-8 text-xs text-slate-500 font-medium text-center">
        SettleKnot © 2026 • Group Trip Expense & Settlement Platform
      </p>

      {/* Google Sign In Modal */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onUserAuthenticated={(u) => {
          onUserAuthenticated(u);
          navigateTo('dashboard');
        }}
      />
    </div>
  );
};
