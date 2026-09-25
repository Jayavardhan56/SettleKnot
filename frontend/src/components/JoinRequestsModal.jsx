import React from 'react';
import { X, UserCheck, Check, Trash2 } from 'lucide-react';

export const JoinRequestsModal = ({ isOpen, onClose, room, onApproveRequest, onRejectRequest }) => {
  if (!isOpen || !room) return null;

  const pendingRequests = room.joinRequests ? room.joinRequests.filter((r) => r.status === 'pending') : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="glass-panel-light max-w-md w-full rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white flex items-center justify-between border-b border-orange-400">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-white" />
            <h3 className="font-tech font-bold text-lg">Pending Join Requests</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-200">
              No pending join requests for room <strong>{room.name}</strong>.
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-orange-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-xl">
                    {req.avatar || '👤'}
                  </div>
                  <div>
                    <h4 className="font-tech font-bold text-sm text-slate-900 flex items-center gap-2">
                      {req.userName}
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        Attempt {(req.rejectionsCount || 0) + 1}/3
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Requested to join</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApproveRequest(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-tech font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => onRejectRequest(req.id)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
