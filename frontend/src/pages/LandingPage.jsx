import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Calculator, Download, QrCode, Compass } from 'lucide-react';
import { navigateTo } from '../lib/router.js';

export const LandingPage = ({ currentUser, onOpenAuthModal }) => {
  const [quickCode, setQuickCode] = useState('');

  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (quickCode.trim()) {
      navigateTo('room', quickCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Landing Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateTo('landing')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
              ⚡
            </div>
            <div>
              <h1 className="font-tech font-bold text-lg leading-tight text-slate-900 flex items-center gap-2">
                SettleKnot
                <span className="text-[10px] uppercase font-tech font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  Free Web App
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-sans hidden sm:block font-medium">Trip Expense Logger & Settlement</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-tech font-bold text-slate-600">
            <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-orange-600 transition-colors">How It Works</a>
            <a href="#about" className="hover:text-orange-600 transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <button
                onClick={() => navigateTo('dashboard')}
                className="px-4 py-2 rounded-xl btn-tech-orange font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <span>My Dashboard 🚀</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="px-4 py-2 rounded-xl btn-tech-orange font-bold text-xs shadow-md cursor-pointer transition-all hidden sm:flex items-center gap-1.5"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Clean Centered Layout (No Mock Data Cards) */}
      <section className="py-16 sm:py-24 px-4 max-w-4xl mx-auto w-full text-center space-y-8 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-tech font-bold shadow-2xs">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>100% Free Group Expense & Debt Settlement Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-tech font-black tracking-tight text-slate-900 leading-tight">
          Untangle Group Trip Bills <br />
          <span className="text-tech-gradient">Without Any Friction ⚡</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 font-sans leading-relaxed max-w-2xl mx-auto font-medium">
          Log shared trip expenses, calculate minimum cash flow transfers, export executive PDF audit reports, and settle debts instantly — with zero subscription fees forever.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              if (currentUser) navigateTo('dashboard');
              else onOpenAuthModal('register');
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-tech-orange text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <span>Create New Trip Room 🚀</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <form onSubmit={handleQuickJoin} className="w-full sm:w-auto flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <Compass className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
            <input
              type="text"
              placeholder="Enter 6-char room code (e.g. GOA2026)"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              className="px-2 py-2 text-xs font-mono font-bold text-orange-600 focus:outline-none uppercase w-full sm:w-56"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-tech font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              Join
            </button>
          </form>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No Credit Card Needed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mobile PWA Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Permanent Data Storage</span>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 px-4 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-tech font-bold text-slate-900">
              Why Travel Groups Choose <span className="text-tech-orange">SettleKnot</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Designed specifically for hassle-free trip bill management with zero complexity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card-light p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="font-tech font-bold text-lg text-slate-900">Min Debt Algorithm</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Eliminates circular payments by computing the fewest possible cash transfers between members.
              </p>
            </div>

            <div className="glass-card-light p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-tech font-bold text-lg text-slate-900">Executive PDF Reports</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Export 1-click sanitized PDF audit reports complete with SettleKnot brand emblems and tables.
              </p>
            </div>

            <div className="glass-card-light p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-tech font-bold text-lg text-slate-900">Instant QR Invites</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Share 6-digit room codes or direct links for instant 1-click member joining.
              </p>
            </div>

            <div className="glass-card-light p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-tech font-bold text-lg text-slate-900">System Admin Control</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Complete system administration tools with 1-click database JSON backup exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section id="workflow" className="py-20 px-4 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-tech font-bold text-slate-900">
            Settling Debts in <span className="text-tech-orange">3 Simple Steps</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            From arrival at your destination to the final settlement payment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs relative space-y-3">
            <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-tech font-bold text-sm flex items-center justify-center">1</span>
            <h3 className="font-tech font-bold text-lg text-slate-900">Create & Share Room</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Create a trip room (e.g., "Manali Trek") and share the 6-character room code with your friends.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs relative space-y-3">
            <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-tech font-bold text-sm flex items-center justify-center">2</span>
            <h3 className="font-tech font-bold text-lg text-slate-900">Log Group Bills</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Add resort bookings, dinners, cab fares, and activities with category tags and notes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs relative space-y-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-tech font-bold text-sm flex items-center justify-center">3</span>
            <h3 className="font-tech font-bold text-lg text-slate-900">Tally & Export PDF</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              SettleKnot calculates who owes whom. Click 'PDF' to export an audit report for the group.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white mx-auto flex items-center justify-center text-3xl font-black shadow-lg">
            ⚡
          </div>
          <h2 className="text-2xl sm:text-4xl font-tech font-bold">Built for Frictionless Trip Memories</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
            SettleKnot was created to solve a universal travel headache: keeping track of who paid for resort stays, dinners, and cab fares without awkward money conversations at the end of a trip.
          </p>

          <div className="pt-4">
            <button
              onClick={() => {
                if (currentUser) navigateTo('dashboard');
                else onOpenAuthModal('register');
              }}
              className="px-6 py-3.5 rounded-2xl bg-white text-orange-950 hover:bg-orange-50 font-tech font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Get Started Now — It's Free 🚀</span>
              <ArrowRight className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 bg-white text-slate-500 text-xs font-sans">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-tech font-bold text-slate-900">⚡ SettleKnot</span>
            <span>— Free Group Expense & Debt Settlement</span>
          </div>

          <div className="flex items-center gap-4 font-medium">
            <span>INR (₹) Currency Ready</span>
            <span>•</span>
            <span>Production Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
