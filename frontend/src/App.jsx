import React, { useEffect, useState } from 'react';
import { getStoredCurrentUser, syncServerAccounts, logoutAccount, updateLastActivity, checkSessionExpired } from './lib/auth.js';
import { getAllRooms, getActiveRoomCode, setActiveRoomCode, syncServerRooms, addExpense, approveJoinRequest, rejectJoinRequest } from './lib/store.js';
import { getRouteFromHash, navigateTo } from './lib/router.js';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { RoomPage } from './pages/RoomPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { ExpenseModal } from './components/ExpenseModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { QrCodeModal } from './components/QrCodeModal.jsx';
import { JoinRequestsModal } from './components/JoinRequestsModal.jsx';
import { Menu } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredCurrentUser());
  const [rooms, setRooms] = useState(getAllRooms());
  const [route, setRoute] = useState(getRouteFromHash());
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [autoLogoutNotice, setAutoLogoutNotice] = useState('');

  // Idle Activity Tracker & Auto Logout System (15-Minute Inactivity limit)
  useEffect(() => {
    if (currentUser && checkSessionExpired(15 * 60 * 1000)) {
      logoutAccount();
      setCurrentUser(null);
      setAutoLogoutNotice('Auto-logged out due to 15 minutes of inactivity for security.');
      navigateTo('landing');
    } else if (currentUser) {
      updateLastActivity();
    }

    let lastUpdate = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 5000) {
        lastUpdate = now;
        updateLastActivity();
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const interval = setInterval(() => {
      const storedUser = getStoredCurrentUser();
      if (storedUser && checkSessionExpired(15 * 60 * 1000)) {
        logoutAccount();
        setCurrentUser(null);
        setIsExpenseModalOpen(false);
        setIsAuthModalOpen(false);
        setIsQrModalOpen(false);
        setIsRequestsModalOpen(false);
        setAutoLogoutNotice('Auto-logged out after 15 minutes of inactivity for security.');
        navigateTo('landing');
      }
    }, 10000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [currentUser]);

  // Route changes and admin permissions
  useEffect(() => {
    syncServerRooms().then(setRooms);
    syncServerAccounts();

    const handleHashChange = () => {
      const currentRoute = getRouteFromHash();
      setRoute(currentRoute);

      if (currentRoute.view === 'admin' && !currentUser?.isAdmin) {
        navigateTo('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  const activeCode = route.param || getActiveRoomCode();
  const currentRoom = rooms.find((r) => r.code === activeCode) || null;

  const handleRoomSwitched = (code) => {
    setActiveRoomCode(code);
    syncServerRooms().then(setRooms);
    navigateTo('room', code);
  };

  const handleAddExpenseSubmit = async (expenseData) => {
    if (!currentRoom) return;
    await addExpense(currentRoom.code, expenseData);
    syncServerRooms().then(setRooms);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
  };

  const handleApproveRequest = async (requestId) => {
    if (!currentRoom) return;
    await approveJoinRequest(currentRoom.code, requestId);
    syncServerRooms().then(setRooms);
  };

  const handleRejectRequest = async (requestId) => {
    if (!currentRoom) return;
    await rejectJoinRequest(currentRoom.code, requestId);
    syncServerRooms().then(setRooms);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Mobile Screen Header Bar (visible only on small screens md:hidden) */}
      {currentUser && route.view !== 'landing' && route.view !== 'auth' && (
        <div className="h-14 bg-white border-b border-slate-200 px-4 flex md:hidden items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
                ⚡
              </div>
              <span className="font-tech font-bold text-sm text-slate-900">SettleKnot</span>
            </div>
          </div>

          <div>
            {currentUser.isAdmin && (
              <span className="text-[10px] font-tech font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                Admin ⚡
              </span>
            )}
          </div>
        </div>
      )}

      {/* Left Sidebar for authenticated app views */}
      {currentUser && route.view !== 'landing' && route.view !== 'auth' && (
        <Sidebar
          currentUser={currentUser}
          currentRoom={currentRoom}
          rooms={rooms}
          route={route}
          onUserLoggedOut={() => {
            setCurrentUser(null);
            navigateTo('landing');
          }}
          onOpenAdminPanel={() => {
            navigateTo('admin');
          }}
          onRoomsUpdated={setRooms}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />
      )}

      {/* Right Column: Scrollable Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
        {/* Render Navbar header ONLY when unauthenticated (Landing or Auth views) */}
        {!currentUser && route.view !== 'landing' && route.view !== 'auth' && (
          <Navbar
            room={null}
            currentUser={null}
            onOpenAuthModal={(tab) => {
              setAuthModalTab(tab);
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {/* Scrollable Main View Router */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {route.view === 'landing' && (
            <LandingPage
              currentUser={currentUser}
              onOpenAuthModal={(tab) => navigateTo('auth', tab)}
            />
          )}

          {route.view === 'dashboard' && (
            <DashboardPage
              currentUser={currentUser}
              setRooms={setRooms}
              onRoomCreated={(room) => {
                setActiveRoomCode(room.code);
                syncServerRooms().then(setRooms);
              }}
              onRoomJoined={(code) => {
                setActiveRoomCode(code);
                syncServerRooms().then(setRooms);
              }}
            />
          )}

          {route.view === 'admin' && (
            <AdminPage
              currentUser={currentUser}
              setRooms={setRooms}
            />
          )}

          {route.view === 'notifications' && (
            <NotificationsPage
              currentUser={currentUser}
              setRooms={setRooms}
            />
          )}

          {route.view === 'room' && (
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
              {currentRoom ? (
                <RoomPage
                  room={currentRoom}
                  currentUser={currentUser}
                  onRoomSwitched={handleRoomSwitched}
                  onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
                  setRooms={setRooms}
                />
              ) : (
                <div className="glass-panel-light p-8 rounded-3xl bg-white border border-slate-200 shadow-md text-center max-w-md mx-auto my-12 space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mx-auto font-black">
                    🏖️
                  </div>
                  <h3 className="font-tech font-bold text-xl text-slate-900">Room Not Found or Deleted</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    The trip room with code <strong className="text-slate-800 font-mono">{activeCode}</strong> was deleted or does not exist.
                  </p>
                  <button
                    onClick={() => navigateTo('dashboard')}
                    className="px-5 py-2.5 rounded-xl btn-tech-orange font-tech font-bold text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    Return to Dashboard ⚡
                  </button>
                </div>
              )}
            </div>
          )}

          {route.view === 'auth' && (
            <AuthPage
              initialTab={route.param === 'register' ? 'register' : 'login'}
              onUserAuthenticated={(user) => {
                setCurrentUser(user);
                syncServerRooms().then(setRooms);
              }}
            />
          )}
        </main>
      </div>

      {/* Auto Logout Security Toast Notification */}
      {autoLogoutNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-fadeIn flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-xs font-sans font-bold text-orange-400">Session Security</p>
              <p className="text-xs font-sans text-slate-200">{autoLogoutNotice}</p>
            </div>
          </div>
          <button
            onClick={() => setAutoLogoutNotice('')}
            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        room={currentRoom}
        currentUser={currentUser}
        onAddExpense={handleAddExpenseSubmit}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onUserAuthenticated={(user) => {
          setCurrentUser(user);
          syncServerRooms().then(setRooms);
        }}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        room={currentRoom}
      />

      <JoinRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        room={currentRoom}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
      />
    </div>
  );
}
