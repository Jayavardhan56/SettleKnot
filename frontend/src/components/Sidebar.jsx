import React from 'react';
import { navigateTo } from '../lib/router.js';
import { logoutAccount } from '../lib/auth.js';
import { getUserSentJoinRequests, getHostPendingJoinRequests } from '../lib/store.js';
import { Home, Bell, LogOut, ShieldCheck, ChevronRight, ChevronLeft, Sparkles, X } from 'lucide-react';

export const Sidebar = ({
  currentUser,
  currentRoom,
  rooms,
  route,
  onUserLoggedOut,
  onOpenAdminPanel,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  if (!currentUser) return null;

  const sentRequests = getUserSentJoinRequests(currentUser.id);
  const hostPendingRequests = getHostPendingJoinRequests(currentUser.id);
  const totalNotifications = sentRequests.length + hostPendingRequests.length;

  const handleLogout = () => {
    logoutAccount();
    if (onUserLoggedOut) onUserLoggedOut();
    navigateTo('landing');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden animate-fadeIn"
        />
      )}

      {/* Main Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-in-out font-sans ${
          isOpenMobile ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-16' : 'md:w-64'} md:static md:h-screen shrink-0 select-none overflow-x-hidden`}
      >
        {/* Top Branding & Toggle Section */}
        <div className={`p-3 border-b border-slate-100 flex items-center ${isCollapsed && !isOpenMobile ? 'flex-col gap-2.5 justify-center' : 'justify-between'}`}>
          <div
            className="flex items-center gap-3 cursor-pointer min-w-0"
            onClick={() => {
              navigateTo('dashboard');
              if (onCloseMobile) onCloseMobile();
            }}
            title="SettleKnot Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20 shrink-0">
              ⚡
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="min-w-0">
                <h1 className="font-tech font-bold text-base leading-tight text-slate-900 truncate">
                  SettleKnot
                </h1>
                <p className="text-[10px] text-slate-500 font-medium truncate">Trip Expense Engine</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle (> / <) */}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-xl bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-600 border border-slate-200 hidden md:flex transition-all cursor-pointer font-bold ${
              isCollapsed && !isOpenMobile ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar (>)' : 'Collapse Sidebar (<)'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-orange-600" /> : <ChevronLeft className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 md:hidden transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Info */}
        <div className={`p-3 border-b border-slate-100 bg-slate-50/50 ${isCollapsed && !isOpenMobile ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center text-lg shrink-0 shadow-2xs">
              {currentUser.avatar || '👤'}
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="min-w-0 flex-1">
                <h3 className="font-tech font-bold text-xs text-slate-900 truncate">{currentUser.name}</h3>
                <span className="text-[9px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 inline-block truncate max-w-full">
                  {currentUser.isAdmin ? 'System Admin ⚡' : 'Traveler Member'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Core Navigation Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {/* 1. Dashboard Link */}
          <button
            onClick={() => {
              navigateTo('dashboard');
              if (onCloseMobile) onCloseMobile();
            }}
            title="Dashboard Overview"
            className={`w-full rounded-xl font-tech font-bold text-xs flex items-center transition-all cursor-pointer ${
              isCollapsed && !isOpenMobile
                ? 'w-10 h-10 mx-auto justify-center p-0'
                : 'px-3 py-2.5 justify-between'
            } ${
              route.view === 'dashboard'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 shrink-0" />
              {(!isCollapsed || isOpenMobile) && <span>Dashboard</span>}
            </div>
            {(!isCollapsed || isOpenMobile) && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
          </button>

          {/* 2. Notifications & Status Link */}
          <button
            onClick={() => {
              navigateTo('notifications');
              if (onCloseMobile) onCloseMobile();
            }}
            title="Notifications & Join Requests Center"
            className={`w-full rounded-xl font-tech font-bold text-xs flex items-center transition-all cursor-pointer ${
              isCollapsed && !isOpenMobile
                ? 'w-10 h-10 mx-auto justify-center p-0'
                : 'px-3 py-2.5 justify-between'
            } ${
              route.view === 'notifications'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-4 h-4 shrink-0" />
                {totalNotifications > 0 && isCollapsed && !isOpenMobile && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-600 border-2 border-white animate-pulse" />
                )}
              </div>
              {(!isCollapsed || isOpenMobile) && <span>Notifications & Status</span>}
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="flex items-center gap-1">
                {totalNotifications > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                      route.view === 'notifications' ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'
                    }`}
                  >
                    {totalNotifications}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </div>
            )}
          </button>

          {/* 3. Admin Control Link (for Admin Users) */}
          {currentUser.isAdmin && (
            <button
              onClick={() => {
                if (onOpenAdminPanel) onOpenAdminPanel();
                navigateTo('admin');
                if (onCloseMobile) onCloseMobile();
              }}
              title="Admin Control Center"
              className={`w-full rounded-xl font-tech font-bold text-xs flex items-center transition-all cursor-pointer ${
                isCollapsed && !isOpenMobile
                  ? 'w-10 h-10 mx-auto justify-center p-0'
                  : 'px-3 py-2.5 justify-between'
              } ${
                route.view === 'admin'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                {(!isCollapsed || isOpenMobile) && <span>Admin Control</span>}
              </div>
              {(!isCollapsed || isOpenMobile) && <Sparkles className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Fixed Bottom Logout Section */}
        <div className="p-2 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={handleLogout}
            title="Sign Out / Logout"
            className={`w-full rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-tech font-bold text-xs flex items-center transition-all cursor-pointer ${
              isCollapsed && !isOpenMobile
                ? 'w-10 h-10 mx-auto justify-center p-0'
                : 'py-2 px-3 justify-center gap-2'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!isCollapsed || isOpenMobile) && <span>Sign Out / Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
