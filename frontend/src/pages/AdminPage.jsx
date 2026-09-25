import React, { useEffect, useState } from 'react';
import { getStoredAccounts, deleteUserAccount, syncServerAccounts } from '../lib/auth.js';
import { getAllRooms, deleteRoom, syncServerRooms, setActiveRoomCode } from '../lib/store.js';
import { navigateTo } from '../lib/router.js';
import { Users, Home, Trash2, Search, RefreshCw, IndianRupee, Receipt, Download, ArrowUpDown, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

export const AdminPage = ({ currentUser, setRooms }) => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [roomsList, setRoomsList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('spend');
  const [loading, setLoading] = useState(false);

  const refreshAdminData = async () => {
    setLoading(true);
    try {
      const serverRooms = await syncServerRooms();
      const serverAccounts = await syncServerAccounts();
      setRoomsList(serverRooms);
      setAccountsList(serverAccounts);
      if (setRooms) setRooms(serverRooms);
    } catch (err) {
      setRoomsList(getAllRooms());
      setAccountsList(getStoredAccounts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  if (!currentUser?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center my-12">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto font-black">
            🔒
          </div>
          <h3 className="font-tech font-bold text-xl text-slate-900">Access Denied</h3>
          <p className="text-xs text-slate-500 font-medium">
            You do not have Administrator permissions to access the Admin Control Center.
          </p>
          <button
            onClick={() => navigateTo('dashboard')}
            className="px-5 py-2.5 rounded-xl btn-tech-orange font-tech font-bold text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const safeRooms = Array.isArray(roomsList) ? roomsList : [];
  const safeAccounts = Array.isArray(accountsList) ? accountsList : [];

  const totalSystemSpend = safeRooms.reduce((acc, r) => acc + (r?.expenses ? r.expenses.reduce((s, e) => s + (e?.amount || 0), 0) : 0), 0);
  const totalExpensesCount = safeRooms.reduce((acc, r) => acc + (r?.expenses ? r.expenses.length : 0), 0);

  const handleDeleteRoom = async (code, name) => {
    if (confirm(`ADMIN ACTION: Are you sure you want to permanently delete trip room '${name}' (Code: ${code})?`)) {
      const updated = await deleteRoom(code);
      const nextRooms = Array.isArray(updated) ? updated : [];
      setRoomsList(nextRooms);
      if (setRooms) setRooms(nextRooms);
      refreshAdminData();
    }
  };

  const handleDeleteUser = async (id, name, email) => {
    const userEmail = email ? email.toLowerCase() : '';
    if (userEmail === 'settleknot@admin.in') {
      alert('System Admin account cannot be deleted!');
      return;
    }

    if (confirm(`ADMIN ACTION: Are you sure you want to delete user account '${name}' (${userEmail})?`)) {
      const updatedAccounts = await deleteUserAccount(id);
      setAccountsList(Array.isArray(updatedAccounts) ? updatedAccounts : []);
      const updatedRooms = await syncServerRooms();
      setRoomsList(Array.isArray(updatedRooms) ? updatedRooms : []);
      if (setRooms) setRooms(updatedRooms);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/db');
      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        data = { rooms: safeRooms, accounts: safeAccounts, exportedAt: new Date().toISOString() };
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settleknot-db-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download backup: ' + err.message);
    }
  };

  const filteredRooms = safeRooms
    .filter(
      (r) =>
        r &&
        r.name &&
        (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.code && r.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (r.hostId && r.hostId.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortBy === 'spend') {
        const spendA = a.expenses ? a.expenses.reduce((acc, e) => acc + (e?.amount || 0), 0) : 0;
        const spendB = b.expenses ? b.expenses.reduce((acc, e) => acc + (e?.amount || 0), 0) : 0;
        return spendB - spendA;
      }
      if (sortBy === 'members') {
        return (b.members ? b.members.length : 0) - (a.members ? a.members.length : 0);
      }
      if (sortBy === 'date') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });

  const filteredAccounts = safeAccounts.filter(
    (a) =>
      a &&
      a.name &&
      (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn font-sans">
      {/* Admin Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-orange-400">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-3xl shadow-inner border border-white/30 shrink-0">
            👑
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-tech font-bold tracking-tight truncate">
                Admin Control Center
              </h1>
              <span className="text-[10px] uppercase bg-white text-orange-950 font-tech font-black px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
                Full Access ⚡
              </span>
            </div>
            <p className="text-xs text-orange-100 font-medium mt-1 truncate">
              System Administration • Managed as <strong className="text-white underline decoration-amber-200">{currentUser.email || 'settleknot@admin.in'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleDownloadBackup}
            title="Download Full Database JSON Backup"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-orange-950 font-tech font-bold text-xs flex items-center gap-2 shadow-md border border-orange-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-600" />
            <span>Backup DB</span>
          </button>
          <button
            onClick={refreshAdminData}
            title="Refresh System Database"
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI System Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-tech font-bold uppercase mb-1">
            <Users className="w-4 h-4 text-amber-600" />
            <span>System Users</span>
          </div>
          <span className="font-tech text-3xl font-black text-slate-900">{safeAccounts.length}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-tech font-bold uppercase mb-1">
            <Home className="w-4 h-4 text-orange-600" />
            <span>Trip Rooms</span>
          </div>
          <span className="font-tech text-3xl font-black text-slate-900">{safeRooms.length}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-tech font-bold uppercase mb-1">
            <Receipt className="w-4 h-4 text-purple-600" />
            <span>Expenses Logged</span>
          </div>
          <span className="font-tech text-3xl font-black text-slate-900">{totalExpensesCount}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-tech font-bold uppercase mb-1">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Total System Spend</span>
          </div>
          <span className="font-tech text-3xl font-black text-emerald-600">₹{totalSystemSpend.toFixed(2)}</span>
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rooms' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>All Rooms ({safeRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Users ({safeAccounts.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {activeTab === 'rooms' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-tech font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="spend">Sort by Spend (High → Low)</option>
                <option value="members">Sort by Members</option>
                <option value="date">Sort by Date Created</option>
              </select>
            </div>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'rooms' ? 'rooms or codes...' : 'names or emails...'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="space-y-3">
        {activeTab === 'rooms' ? (
          filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
              No system trip rooms match your query.
            </div>
          ) : (
            filteredRooms.map((room) => {
              const spend = room.expenses ? room.expenses.reduce((acc, e) => acc + e.amount, 0) : 0;
              const hostMember = room.members ? room.members.find((m) => m.id === room.hostId) || room.members[0] : null;

              return (
                <div
                  key={room.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center text-xl shrink-0">
                      {hostMember?.avatar || '🏖️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-tech font-bold text-base text-slate-900">{room.name}</h4>
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                          {room.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Host: <strong className="text-slate-800">{hostMember?.name || 'Unknown'}</strong> • Members: <strong className="text-slate-800">{room.members ? room.members.length : 0}</strong> • Expenses: <strong className="text-slate-800">{room.expenses ? room.expenses.length : 0}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-tech font-bold text-slate-400 block">Total Spend</span>
                      <span className="font-tech text-base font-black text-emerald-600">₹{spend.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveRoomCode(room.code);
                          navigateTo('room', room.code);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-tech font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Enter Room</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRoom(room.code, room.name)}
                        title="Delete Room (Admin Hard Delete)"
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : filteredAccounts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
            No user accounts match your query.
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            if (!acc) return null;
            const accEmail = acc.email ? acc.email.toLowerCase() : '';
            const accName = acc.name || 'User';
            const isAdminAcc = accEmail === 'settleknot@admin.in';
            const hostedCount = safeRooms ? safeRooms.filter((r) => r && r.hostId === acc.id).length : 0;
            const joinedCount = safeRooms ? safeRooms.filter((r) => r && r.members && r.members.some((m) => m && m.id === acc.id)).length : 0;

            return (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center text-2xl shrink-0">
                    {acc.avatar || '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-tech font-bold text-base text-slate-900">{accName}</h4>
                      {isAdminAcc && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-tech font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          System Admin ⚡
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Email: <strong className="text-slate-800">{acc.email || 'N/A'}</strong> • Registered: {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="text-left sm:text-right text-xs text-slate-500 font-medium">
                    <span>Rooms Hosted: <strong className="text-slate-900">{hostedCount}</strong></span> • <span>Joined: <strong className="text-slate-900">{joinedCount}</strong></span>
                  </div>

                  {!isAdminAcc && (
                    <button
                      onClick={() => handleDeleteUser(acc.id, accName, accEmail)}
                      title="Delete User Account (Admin Hard Purge)"
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-tech font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete User</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
