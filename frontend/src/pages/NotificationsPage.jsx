import React, { useState } from 'react';
import { getUserSentJoinRequests, getHostPendingJoinRequests, approveJoinRequest, rejectJoinRequest, cancelJoinRequest, syncServerRooms, setActiveRoomCode } from '../lib/store.js';
import { fetchApi } from '../lib/api.js';
import { navigateTo } from '../lib/router.js';
import { Bell, Clock, Check, XCircle, ArrowRight, UserCheck, Trash2, RefreshCw, ShieldAlert } from 'lucide-react';

export const NotificationsPage = ({ currentUser, setRooms }) => {
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' | 'host'
  const [loadingCode, setLoadingCode] = useState(null);

  if (!currentUser) return null;

  const sentRequests = getUserSentJoinRequests(currentUser.id);
  const hostPendingRequests = getHostPendingJoinRequests(currentUser.id);

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
    await cancelJoinRequest(roomCode, currentUser.id);
    await refreshState();
  };

  const handleResendJoinRequest = async (roomCode) => {
    setLoadingCode(roomCode);
    try {
      await fetchApi('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          action: 'join',
          joinCode: roomCode,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
        }),
      });
      await refreshState();
    } catch (err) {
      console.error('Error resending request:', err);
    } finally {
      setLoadingCode(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-2xl shadow-inner border border-white/30 shrink-0">
            🔔
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-tech font-bold tracking-tight">
              Notifications & Join Requests Center
            </h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              Track room request approval statuses, resend declined requests, or approve incoming members.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 max-w-md">
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sent' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Sent Requests ({sentRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('host')}
          className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'host' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Host Approvals ({hostPendingRequests.length})</span>
        </button>
      </div>

      {/* Main Body Content */}
      {activeTab === 'sent' ? (
        <div className="space-y-4">
          <h3 className="font-tech font-bold text-base text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>My Sent Join Requests ({sentRequests.length})</span>
          </h3>

          {sentRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 shadow-2xs">
              You haven't submitted any room join requests yet. Enter a room code on the Dashboard!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected' && (req.rejectionsCount || 0) < 3;
                const isBlocked = req.status === 'blocked' || (req.rejectionsCount || 0) >= 3;

                return (
                  <div
                    key={req.requestId}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-tech font-bold text-base text-slate-900">{req.roomName}</h4>
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {req.roomCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Room Host: <strong className="text-slate-800">{req.hostName}</strong>
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isPending && (
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-tech font-bold text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending (Attempt {(req.rejectionsCount || 0) + 1}/3)</span>
                          </span>
                        )}

                        {isApproved && (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-tech font-bold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approved!</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 font-tech font-bold text-xs flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Declined ({req.rejectionsCount}/3)</span>
                          </span>
                        )}

                        {isBlocked && (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-900 border border-red-300 font-tech font-bold text-xs flex items-center gap-1" title="Maximum request limit reached (3 rejections). Room entry is blocked.">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Access Blocked (3/3 Declined)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      {isApproved && (
                        <button
                          onClick={() => {
                            setActiveRoomCode(req.roomCode);
                            navigateTo('room', req.roomCode);
                          }}
                          className="px-4 py-2 rounded-xl btn-tech-orange font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <span>Enter Room 🚀</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => handleResendJoinRequest(req.roomCode)}
                          disabled={loadingCode === req.roomCode}
                          className="px-4 py-2 rounded-xl btn-tech-orange font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingCode === req.roomCode ? 'animate-spin' : ''}`} />
                          <span>{loadingCode === req.roomCode ? 'Resending...' : 'Resend Request 🔄'}</span>
                        </button>
                      )}

                      {isPending && (
                        <button
                          onClick={() => handleCancelSentRequest(req.roomCode)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-tech font-bold text-xs transition-all cursor-pointer border border-slate-200"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-tech font-bold text-base text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Host Action Required: Pending Join Requests ({hostPendingRequests.length})</span>
          </h3>

          {hostPendingRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 shadow-2xs">
              No pending join requests for any of your hosted trip rooms.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hostPendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl bg-white border border-amber-200 shadow-xs flex items-center justify-between gap-3 space-y-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center text-2xl shrink-0">
                      {req.avatar || '👤'}
                    </div>
                    <div>
                      <h4 className="font-tech font-bold text-sm text-slate-900 flex items-center gap-2">
                        {req.userName}
                        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                          Attempt {(req.rejectionsCount || 0) + 1}/3
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Requested room: <strong className="text-orange-600">{req.roomName}</strong> ({req.roomCode})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveHostRequest(req.roomCode, req.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-tech font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleRejectHostRequest(req.roomCode, req.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                      title="Decline request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
