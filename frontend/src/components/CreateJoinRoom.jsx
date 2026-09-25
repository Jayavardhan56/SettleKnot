import React, { useState } from 'react';
import { createRoom, getAllRooms, setActiveRoomCode, getUserRooms } from '../lib/store.js';
import { fetchApi } from '../lib/api.js';
import { Sparkles, Plus, LogIn, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

export const CreateJoinRoom = ({ currentUser, onRoomCreated, onRoomJoined, onOpenAuthModal }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const userRooms = getUserRooms(currentUser?.id);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Please enter a trip room name');
      return;
    }

    if (!currentUser) {
      onOpenAuthModal('register');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const room = await createRoom(roomName.trim(), currentUser);
      setRoomName('');
      onRoomCreated(room);
    } catch (err) {
      setError('Failed to create room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Please enter a 6-character room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const targetCode = joinCode.trim().toUpperCase();
      const localRooms = getAllRooms();
      let targetRoom = localRooms.find((r) => r.code === targetCode);

      if (currentUser) {
        const res = await fetchApi('/api/rooms', {
          method: 'POST',
          body: JSON.stringify({
            action: 'join',
            joinCode: targetCode,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
          }),
        }).catch(() => null);

        if (res && res.room) {
          targetRoom = res.room;
        }
      }

      if (!targetRoom) {
        setError(`No trip room found with code '${targetCode}'.`);
        setLoading(false);
        return;
      }

      setActiveRoomCode(targetRoom.code);
      onRoomJoined(targetRoom.code);
      setJoinCode('');
    } catch (err) {
      setError('Error joining room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full glass-panel-light rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl animate-fadeIn">
        {/* SettleKnot Emblem Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 text-white mx-auto flex items-center justify-center text-3xl font-black shadow-lg shadow-orange-500/25 mb-3 animate-floatBounce">
            ⚡
          </div>
          <h2 className="text-2xl font-tech font-bold text-slate-900 tracking-tight">SettleKnot</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create or join a trip expense room to split bills effortlessly
          </p>
        </div>

        {/* Existing Rooms Pill Navigation */}
        {userRooms.length > 0 && (
          <div className="mb-6 p-3 rounded-2xl bg-orange-50 border border-orange-200">
            <span className="text-[10px] uppercase font-tech font-bold text-orange-800 block mb-2">Your Active Rooms:</span>
            <div className="flex flex-wrap gap-1.5">
              {userRooms.map((r) => (
                <button
                  key={r.code}
                  onClick={() => {
                    setActiveRoomCode(r.code);
                    onRoomJoined(r.code);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100 text-orange-950 border border-orange-300 font-tech font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{r.name}</span>
                  <span className="font-mono text-[10px] text-orange-700">({r.code})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-6">
          <button
            onClick={() => { setActiveTab('create'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Room</span>
          </button>
          <button
            onClick={() => { setActiveTab('join'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'join' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Enter Room Code</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1.5">
                Trip / Event Name
              </label>
              <input
                type="text"
                placeholder="e.g. Goa Beach Trip 🏖️, Manali Trek 🏔️"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-tech-orange text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>{loading ? 'Creating Trip Room...' : 'Create Trip Room 🚀'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1.5">
                6-Character Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. GOA2026"
                maxLength={8}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold text-orange-600 tracking-wider text-center uppercase focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-tech-orange text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>{loading ? 'Joining Room...' : 'Enter Trip Room 🔑'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
