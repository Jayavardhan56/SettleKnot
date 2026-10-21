import React, { useState, useEffect } from 'react';
import { verifyResetToken, resetUserPassword } from '../lib/auth';
import { navigateTo } from '../lib/router';
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResetPasswordPageProps {
  onPasswordResetComplete?: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = () => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract token and email from window.location.hash or search
    const hash = window.location.hash;
    let queryPart = '';
    if (hash.includes('?')) {
      queryPart = hash.split('?')[1];
    } else if (window.location.search) {
      queryPart = window.location.search.replace(/^\?/, '');
    }

    const searchParams = new URLSearchParams(queryPart);
    const parsedToken = searchParams.get('token') || '';
    const parsedEmail = searchParams.get('email') || '';

    setToken(parsedToken);
    setEmail(parsedEmail);

    if (!parsedToken || !parsedEmail) {
      setVerifying(false);
      setTokenValid(false);
      setError('Invalid or missing password reset link. Please request a new recovery link.');
      return;
    }

    // Verify token with backend
    verifyResetToken(parsedToken, parsedEmail).then((res) => {
      setVerifying(false);
      if (res.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setError(res.error || 'This password reset link is invalid or has expired.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetUserPassword(token, email, newPassword);
      if (res.success) {
        setSuccessMsg(res.message || 'Your password has been successfully reset! You can now log in.');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      } else {
        setError(res.error || 'Failed to update password. The link might have expired.');
      }
    } catch (err: any) {
      setError('An error occurred: ' + (err.message || 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans bg-slate-50 text-slate-900 py-12 px-4">
      {/* Background Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-orange-100/60 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Link */}
      <div className="z-10 mb-8 flex items-center justify-between w-full max-w-md px-2">
        <button
          onClick={() => navigateTo('auth')}
          className="inline-flex items-center gap-2 text-xs font-tech font-bold text-slate-600 hover:text-orange-600 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Sign In</span>
        </button>

        <div onClick={() => navigateTo('landing')} className="flex items-center gap-2 cursor-pointer">
          <img src="/logo.png" alt="SettleKnot" className="w-7 h-7 rounded-lg object-cover shadow-xs border border-slate-200 shrink-0" />
          <span className="font-tech font-bold text-base tracking-tight text-slate-900">SettleKnot</span>
        </div>
      </div>

      {/* Card Container */}
      <div className="z-10 max-w-md w-full glass-panel-ultra rounded-3xl bg-white/95 border border-slate-200/80 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Card Header Banner */}
        <div className="p-6 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-tech font-bold tracking-wider uppercase mb-1">
              Account Recovery
            </span>
            <h2 className="font-tech font-bold text-2xl tracking-tight text-white">
              Set New Password
            </h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              Choose a secure password for your SettleKnot account
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-2xl shrink-0">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {verifying ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-tech font-bold">Verifying reset authorization link...</p>
            </div>
          ) : successMsg ? (
            <div className="text-center space-y-5 py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner border border-emerald-300">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-tech font-bold text-xl text-slate-900">Password Updated!</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                  Your new password is now active in the database. You can return to the sign in page and log into your account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="w-full py-3.5 rounded-xl btn-tech-orange font-tech font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>Back to Sign In ⚡</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : !tokenValid ? (
            <div className="text-center space-y-5 py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto shadow-inner border border-rose-300">
                <AlertCircle className="w-9 h-9 text-rose-600" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-tech font-bold text-xl text-slate-900">Invalid or Expired Link</h3>
                <p className="text-xs text-rose-600 font-medium leading-relaxed max-w-sm mx-auto">
                  {error || 'This recovery link has expired or is no longer valid. Please submit a new forgot password request.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="w-full py-3.5 rounded-xl btn-tech-orange font-tech font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>Request New Recovery Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-fadeIn flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>{error}</span>
                </div>
              )}

              {/* Verified Account Identifier */}
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-tech font-bold uppercase text-slate-400 block">Resetting password for</span>
                  <span className="font-tech font-bold text-xs text-slate-800">{email}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Authorized</span>
                </span>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-tech font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password (min. 4 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15 font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-tech font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Retype your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/80 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15 font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl btn-tech-orange font-tech font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>{loading ? 'Updating Password...' : 'Save New Password 🔒'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Micro Footer Features */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Token Verification</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Database Sync</span>
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
