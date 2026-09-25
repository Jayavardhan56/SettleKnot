import React, { useState } from 'react';
import { createRoom, getAllRooms, setActiveRoomCode, getUserRooms, getUserSentJoinRequests, getHostPendingJoinRequests, approveJoinRequest, rejectJoinRequest, cancelJoinRequest, syncServerRooms } from '../lib/store.js';
import { fetchApi } from '../lib/api.js';
import { navigateTo } from '../lib/router.js';
import { Plus, Compass, ArrowRight, ShieldCheck, Home, Users, IndianRupee, Clock, Check, Trash2, UserCheck, XCircle } from 'lucide-react';

export const DashboardPage = ({ currentUser, onRoomCreated, onRoomJoined, setRooms }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const userRooms = getUserRooms(currentUser?.id);
  const sentRequests = getUserSentJoinRequests(currentUser?.id);
  const hostPendingRequests = getHostPendingJoinRequests(currentUser?.id);

  const refreshState = async () => {
    const updatedRooms = await syncServerRooms();
    if (setRooms) setRooms(updatedRooms);
  };

  const handleApproveHostRequest = async (roomCode, reqId) => {
    await approveJoinRequest(roomCode, reqId);
    await refreshState();
  };

  const handleRejectHostRequest = async (roomCode, reqId) => {
    await rejectJoinRequest(roomCode, reqId);
    await refreshState();
  };

  const handleCancelSentRequest = async (roomCode) => {
    if (currentUser?.id) {
      await cancelJoinRequest(roomCode, currentUser.id);
      await refreshState();
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Please enter a trip room name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const room = await createRoom(roomName.trim(), currentUser || { id: `usr_${Date.now()}`, name: 'Guest User' });
      setRoomName('');
      onRoomCreated(room);
      navigateTo('room', room.code);
    } catch (err) {
      setError('Failed to create room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e, explicitCode = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const codeToUse = explicitCode || joinCode;
    if (!codeToUse || !codeToUse.trim()) {
      setError('Please enter a 6-character room code');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const targetCode = codeToUse.trim().toUpperCase();
      const localRooms = getAllRooms();
      let targetRoom = localRooms.find((r) => r.code === targetCode);

      // Local pre-check for 3 rejections block
      if (targetRoom && targetRoom.userRejections && currentUser) {
        const localRejections = targetRoom.userRejections[currentUser.id] || 0;
        if (localRejections >= 3) {
          setError(`Access Denied: You have been declined ${localRejections} times for room code '${targetCode}'. Entry to this room code is blocked for your account.`);
          setLoading(false);
          return;
        }
      }

      let res = null;
      if (currentUser) {
        res = await fetchApi('/api/rooms', {
          method: 'POST',
          body: JSON.stringify({
            action: 'join',
            joinCode: targetCode,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
          }),
        }).catch((err) => null);

        if (res && res.room) {
          targetRoom = res.room;
        }
      }

      if (res && res.isBlocked) {
        setError(res.error || `Access Denied: Maximum join request limit (3 rejections) reached for room code '${targetCode}'.`);
        setLoading(false);
        return;
      }

      if (!targetRoom) {
        setError(`No trip room found with code '${targetCode}'.`);
        setLoading(false);
        return;
      }

      const isApproved = targetRoom.hostId === currentUser?.id || (Array.isArray(targetRoom.members) && targetRoom.members.some((m) => m && m.id === currentUser?.id && m.status === 'approved'));

      await refreshState();
      setJoinCode('');

      if (isApproved) {
        setActiveRoomCode(targetRoom.code);
        onRoomJoined(targetRoom.code);
        navigateTo('room', targetRoom.code);
      } else {
        const userRejections = (targetRoom.userRejections && targetRoom.userRejections[currentUser?.id]) || 0;
        setInfoMsg(`Join request for room '${targetRoom.name}' (${targetRoom.code}) has been submitted to the room host. (Attempt ${userRejections + 1}/3). Track approval status below.`);
      }
    } catch (err) {
      setError('Error joining room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans animate-fadeIn">
      {/* User Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-3xl shadow-inner border border-white/30 shrink-0">
            {currentUser?.avatar || '⚡'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-tech font-bold tracking-tight">
              Welcome back, {currentUser?.name || 'Traveler'}!
            </h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              {currentUser?.isAdmin ? 'System Admin ⚡ • Full Access Mode' : 'Manage your trip rooms and split bills effortlessly'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Active Trip Rooms Directory */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-tech font-bold text-lg text-slate-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-600" />
            <span>Your Active Trip Rooms ({userRooms.length})</span>
          </h3>

          {userRooms.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-3xl border border-slate-200">
              You have not joined any trip rooms yet. Create or enter a room code on the right!
            </div>
          ) : (
            <div className="space-y-3">
              {userRooms.map((room) => {
                const spend = room.expenses ? room.expenses.reduce((acc, e) => acc + e.amount, 0) : 0;
                const membersCount = room.members ? room.members.length : 0;

                return (
                  <div
                    key={room.code}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center text-2xl shrink-0">
                        🏖️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-tech font-bold text-base text-slate-900">{room.name}</h4>
                          <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                            {room.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Members: <strong className="text-slate-800">{membersCount}</strong> • Expenses: <strong className="text-slate-800">{room.expenses ? room.expenses.length : 0}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-tech font-bold text-slate-400 block">Total Spend</span>
                        <span className="font-digits text-base font-black text-emerald-600">₹{spend.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveRoomCode(room.code);
                          onRoomJoined(room.code);
                          navigateTo('room', room.code);
                        }}
                        className="px-4 py-2.5 rounded-xl btn-tech-orange font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1"
                      >
                        <span>Open Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create / Join Room Form */}
        <div className="lg:col-span-5">
          <div className="glass-panel-light rounded-3xl p-6 bg-white border border-slate-200 shadow-xl space-y-5">
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => { setActiveTab('create'); setError(''); setInfoMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'create' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create Room</span>
              </button>
              <button
                onClick={() => { setActiveTab('join'); setError(''); setInfoMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'join' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Enter Room Code</span>
              </button>
            </div>

            {infoMsg && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                {infoMsg}
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {activeTab === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
                    Trip / Event Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Goa Beach Trip 🏖️, Manali Trek 🏔️"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl btn-tech-orange text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <span>{loading ? 'Creating...' : 'Create Room 🚀'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
                    6-Character Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GOA2026"
                    maxLength={8}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold text-orange-600 tracking-wider text-center uppercase focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl btn-tech-orange text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <span>{loading ? 'Joining...' : 'Enter Room 🔑'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
