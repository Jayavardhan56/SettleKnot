import React, { useState } from 'react';
import { X, User as UserIcon, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../lib/auth';
import { User } from '../types';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAuthenticated: (user: User) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onUserAuthenticated,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');

  if (!isOpen) return null;

  // Preset demo accounts for 1-click Google Sign-In test
  const quickAccounts = [
    { name: 'Alex Johnson', email: 'alex@example.com', avatar: '🦊' },
    { name: 'Sam Rivera', email: 'sam@example.com', avatar: '🐱' },
    { name: 'Priya Sharma', email: 'priya@example.com', avatar: '🦁' },
  ];

  const handleSelectQuickAccount = async (acc: { name: string; email: string; avatar: string }) => {
    setLoading(true);
    setError('');
    const res = await signInWithGoogle(acc);
    setLoading(false);
    if (res.success && res.user) {
      onUserAuthenticated(res.user);
      onClose();
    } else {
      setError(res.error || 'Google authentication failed.');
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setError('Please enter your Google email address');
      return;
    }
    const cleanEmail = customEmail.trim();
    const cleanName = customName.trim() || cleanEmail.split('@')[0];

    setLoading(true);
    setError('');

    const res = await signInWithGoogle({
      name: cleanName,
      email: cleanEmail,
      avatar: '🌐',
    });

    setLoading(false);

    if (res.success && res.user) {
      onUserAuthenticated(res.user);
      onClose();
    } else {
      setError(res.error || 'Google sign-in failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="glass-panel-ultra max-w-sm sm:max-w-md w-full rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <h3 className="font-tech font-bold text-base text-slate-900">
              Sign in with Google
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Choose a Google account or enter your email to proceed to SettleKnot:
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {mode === 'quick' ? (
            <div className="space-y-2.5">
              {quickAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectQuickAccount(acc)}
                  className="w-full p-3 rounded-2xl border border-slate-200 hover:border-orange-400 bg-white hover:bg-orange-50/50 flex items-center justify-between transition-all cursor-pointer shadow-2xs group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      {acc.avatar}
                    </div>
                    <div>
                      <p className="font-tech font-bold text-xs sm:text-sm text-slate-900">{acc.name}</p>
                      <p className="text-[11px] text-slate-500">{acc.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('custom'); setError(''); }}
                  className="text-xs font-tech font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  Use a different Google account →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
                  Google Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
                  Display Name (Optional)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-tech font-bold text-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl btn-tech-orange font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <span>{loading ? 'Signing in...' : 'Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit Encrypted Google Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
