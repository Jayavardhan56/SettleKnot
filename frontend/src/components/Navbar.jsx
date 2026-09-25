import React, { useState } from 'react';
import { Download, QrCode, Share2, LogOut, CheckCircle2, LogIn, UserPlus, ShieldCheck, Menu, PanelLeftClose, PanelLeft, Home, Sparkles } from 'lucide-react';
import { generateTripPDF } from '../lib/pdfGenerator.js';

export const Navbar = ({
  room,
  currentUser,
  onOpenQrModal,
  onOpenRequestsModal,
  onOpenAuthModal,
  onOpenAdminPanel,
  onLeaveRoom,
  onUserLoggedOut,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleDesktopSidebar,
}) => {
  const [copied, setCopied] = useState(false);
  const isAdmin = currentUser?.isAdmin;

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    if (!room) return;
    generateTripPDF(room);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs font-sans">
      <div className="w-full flex items-center justify-between gap-3">
        {/* Left Side: Movable Sidebar Toggles & Context Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0 shrink">
          {/* Show Brand Logo only when no user/sidebar is active */}
          {!currentUser ? (
            <div
              className="flex items-center gap-2 cursor-pointer shrink-0"
              onClick={() => (window.location.hash = '#/landing')}
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20 shrink-0">
                ⚡
              </div>
              <div>
                <h1 className="font-tech font-bold text-base leading-tight text-slate-900">SettleKnot</h1>
                <p className="text-[10px] text-slate-500 font-medium">Trip Expense Logger</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Sidebar Open Toggle Button */}
              <button
                onClick={onToggleMobileSidebar}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 md:hidden transition-all cursor-pointer shrink-0"
                title="Toggle Sidebar Navigation"
              >
                <Menu className="w-4.5 h-4.5 text-slate-800" />
              </button>

              {/* Desktop Movable Sidebar Collapse/Expand Button */}
              <button
                onClick={onToggleDesktopSidebar}
                className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 border border-slate-200 text-slate-600 hover:text-orange-600 hidden md:flex transition-all cursor-pointer shrink-0"
                title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
              >
                {isSidebarCollapsed ? <PanelLeft className="w-4.5 h-4.5 text-orange-600" /> : <PanelLeftClose className="w-4.5 h-4.5" />}
              </button>
            </>
          )}

          {/* Context View Breadcrumb */}
          {currentUser && (
            <div className="min-w-0 flex items-center gap-2">
              {room ? (
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base shrink-0">🏖️</span>
                  <h2 className="font-tech font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {room.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 shrink-0">
                    {room.code}
                  </span>
                </div>
              ) : window.location.hash.includes('admin') ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <h2 className="font-tech font-bold text-xs sm:text-sm text-slate-900">
                    Admin Control Center
                  </h2>
                  <span className="text-[10px] font-tech font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hidden md:inline-block">
                    Full Access ⚡
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-orange-600 shrink-0" />
                  <h2 className="font-tech font-bold text-xs sm:text-sm text-slate-900">
                    Dashboard Overview
                  </h2>
                  <span className="text-[10px] font-tech font-bold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hidden md:inline-block">
                    System Active
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Context Controls & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {room && (
            <>
              {/* Copy Code Button */}
              <button
                onClick={handleCopyCode}
                title="Click to copy Room Code"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 border border-slate-200 text-xs font-mono text-orange-700 transition-all cursor-pointer"
              >
                <span className="text-slate-500 font-sans hidden sm:inline">Code:</span>
                <span className="font-tech font-bold tracking-wider">{room.code}</span>
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* QR Code */}
              <button
                onClick={onOpenQrModal}
                title="Scan QR Code to join"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
              </button>

              {/* PDF Export */}
              <button
                onClick={handleExportPdf}
                title="Export Expense PDF Report"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-success text-xs shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline font-sans font-bold">PDF</span>
              </button>

              {/* Leave / Switch Room */}
              <button
                onClick={onLeaveRoom}
                title="Switch Room"
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}

          {!currentUser && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-600" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                className="px-3.5 py-1.5 rounded-xl btn-tech-orange font-bold text-xs shadow-xs transition-all cursor-pointer hidden sm:flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
