import React, { useState } from 'react';
import {
  getUserSentJoinRequests,
  getHostPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
  syncServerRooms,
  setActiveRoomCode,
  getPendingReceivedPayments,
  getPendingSentPayments,
  approveSettlementPayment,
  declineSettlementPayment,
} from '../lib/store';
import { fetchApi } from '../lib/api';
import { navigateTo } from '../lib/router';
import { Clock, Check, XCircle, ArrowRight, UserCheck, Trash2, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Room } from '../types';

interface NotificationsPageProps {
  currentUser: User | null;
  setRooms?: (rooms: Room[]) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUser, setRooms }) => {
  if (!currentUser) return null;

  const pendingReceived = getPendingReceivedPayments(currentUser.id, currentUser.name);
  const sentPayments = getPendingSentPayments(currentUser.id, currentUser.name);
  const sentRequests = getUserSentJoinRequests(currentUser.id);
  const hostPendingRequests = getHostPendingJoinRequests(currentUser.id);

  const [activeTab, setActiveTab] = useState<'payments' | 'sent' | 'host'>(
    pendingReceived.length > 0 ? 'payments' : 'sent'
  );
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  const refreshState = async () => {
    const updatedRooms = await syncServerRooms();
    if (setRooms) setRooms(updatedRooms);
  };

  const handleApprovePayment = async (roomCode: string, paymentId: string, fromName: string, amount: number) => {
    if (confirm(`Confirm receipt of ₹${amount.toFixed(2)} from '${fromName}'?`)) {
      await approveSettlementPayment(roomCode, paymentId);
      await refreshState();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
    }
  };

  const handleDeclinePayment = async (roomCode: string, paymentId: string, fromName: string, amount: number) => {
    if (
      confirm(
        `Decline payment of ₹${amount.toFixed(2)} from '${fromName}'?\n\nThey will be notified that payment was not received and asked to pay again.`
      )
    ) {
      await declineSettlementPayment(roomCode, paymentId);
      await refreshState();
    }
  };

  const handleApproveHostRequest = async (roomCode: string, reqId: string) => {
    await approveJoinRequest(roomCode, reqId);
    await refreshState();
  };

  const handleRejectHostRequest = async (roomCode: string, reqId: string) => {
    await rejectJoinRequest(roomCode, reqId);
    await refreshState();
  };

  const handleCancelSentRequest = async (roomCode: string) => {
    await cancelJoinRequest(roomCode, currentUser.id);
    await refreshState();
  };

  const handleResendJoinRequest = async (roomCode: string) => {
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
              Notifications & Approvals Center
            </h2>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              Confirm settlement payment receipts, track join requests, or approve incoming room members.
            </p>
          </div>
        </div>

        <button
          onClick={refreshState}
          className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 font-tech font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
          title="Refresh Status & Sync Server"
        >
          <span>Refresh Status 🔄</span>
        </button>
      </div>

      {/* Quick Alert if payments are pending approval */}
      {pendingReceived.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-amber-900 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-tech font-bold text-xs sm:text-sm">
                You have {pendingReceived.length} pending settlement payment{pendingReceived.length > 1 ? 's' : ''} awaiting your approval!
              </p>
              <p className="text-[11px] text-amber-750 font-medium">
                Check UPI or cash received, then approve to finalize debts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('payments')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-tech font-bold text-xs cursor-pointer shadow-xs shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 max-w-2xl gap-1">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 min-w-[150px] py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'payments' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="text-sm">💳</span>
          <span>Payment Approvals ({pendingReceived.length})</span>
          {pendingReceived.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sent' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sent Requests ({sentRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('host')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'host' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Host Approvals ({hostPendingRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: Payment Approvals & Settlements */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Section: Inbound Payment Claims Awaiting My Approval */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-tech font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Inbound Settlement Claims Awaiting Your Approval ({pendingReceived.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Verify before marking debts settled</span>
            </div>

            {pendingReceived.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 shadow-2xs">
                No pending payment approvals for you right now. All caught up! 🌿
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReceived.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-amber-50/50 border border-amber-300 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💰</span>
                          <h4 className="font-tech font-bold text-base text-slate-900">
                            {item.fromName} paid you
                          </h4>
                          <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                            {item.roomCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          Room: <strong className="text-slate-800">{item.roomName}</strong> • Claimed: {item.dateFormatted} {item.timeFormatted}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-digits font-black text-xl text-emerald-600">
                          ₹{item.amount.toFixed(2)}
                        </span>
                        <div className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                          <span>Pending Approval</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveRoomCode(item.roomCode);
                          navigateTo('room', item.roomCode);
                        }}
                        className="text-xs text-slate-600 hover:text-slate-900 font-tech font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>View Room Plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeclinePayment(item.roomCode, item.id, item.fromName, item.amount)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-tech font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Decline ✕</span>
                        </button>

                        <button
                          onClick={() => handleApprovePayment(item.roomCode, item.id, item.fromName, item.amount)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-tech font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve ✓</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Outbound Payment Claims Sent by You */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-tech font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Payments You Marked as Paid ({sentPayments.length})</span>
            </h3>

            {sentPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 shadow-2xs">
                You haven't marked any settlement payments as paid yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sentPayments.map((item) => {
                  const status = item.status || 'PAID';
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-3xl bg-white border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                        status === 'PENDING'
                          ? 'border-amber-200 hover:border-amber-300'
                          : status === 'DECLINED'
                          ? 'border-rose-200 hover:border-rose-300'
                          : 'border-emerald-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-tech font-bold text-base text-slate-900">
                              You paid {item.toName}
                            </h4>
                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {item.roomCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Room: <strong className="text-slate-800">{item.roomName}</strong> • {item.dateFormatted} {item.timeFormatted}
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-digits font-black text-lg ${
                              status === 'PAID'
                                ? 'text-emerald-600'
                                : status === 'PENDING'
                                ? 'text-amber-700'
                                : 'text-slate-400 line-through'
                            }`}
                          >
                            ₹{item.amount.toFixed(2)}
                          </span>

                          <div className="mt-1">
                            {status === 'PENDING' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-tech font-bold text-[10px] flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                                <span>Pending Approval ⏳</span>
                              </span>
                            )}
                            {status === 'PAID' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-tech font-bold text-[10px] flex items-center justify-end gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Verified & Paid ✓</span>
                              </span>
                            )}
                            {status === 'DECLINED' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 font-tech font-bold text-[10px] flex items-center justify-end gap-1">
                                <X className="w-3 h-3 text-rose-600" />
                                <span>Declined ✕</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setActiveRoomCode(item.roomCode);
                            navigateTo('room', item.roomCode);
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 font-tech font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Open Room 🚀</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {status === 'DECLINED' && (
                          <button
                            onClick={() => {
                              setActiveRoomCode(item.roomCode);
                              navigateTo('room', item.roomCode);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-tech font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Pay Again 🔄</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Sent Join Requests */}
      {activeTab === 'sent' && (
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
                          <span
                            className="px-3 py-1 rounded-full bg-red-100 text-red-900 border border-red-300 font-tech font-bold text-xs flex items-center gap-1"
                            title="Maximum request limit reached (3 rejections). Room entry is blocked."
                          >
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
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${loadingCode === req.roomCode ? 'animate-spin' : ''}`}
                          />
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
      )}

      {/* Tab 3: Host Join Approvals */}
      {activeTab === 'host' && (
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
