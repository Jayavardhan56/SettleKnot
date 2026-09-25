import React from 'react';
import { Crown, Trash2, LogOut, UserMinus, UserCheck, Check } from 'lucide-react';
import { removeMemberFromRoom, leaveRoom, deleteRoom, syncServerRooms, setActiveRoomCode, approveJoinRequest, rejectJoinRequest } from '../lib/store.js';
import { navigateTo } from '../lib/router.js';

export const MemberRoster = ({ room, currentUser, setRooms }) => {
  if (!room || !Array.isArray(room.members)) return null;

  const isHost = currentUser?.id === room.hostId;
  const approvedMembers = room.members.filter((m) => m && m.status === 'approved');
  const pendingRequests = isHost && Array.isArray(room.joinRequests) ? room.joinRequests.filter((r) => r && r.status === 'pending') : [];

  const handleApprove = async (reqId) => {
    await approveJoinRequest(room.code, reqId);
    const updatedRooms = await syncServerRooms();
    if (setRooms) setRooms(updatedRooms);
  };

  const handleReject = async (reqId) => {
    await rejectJoinRequest(room.code, reqId);
    const updatedRooms = await syncServerRooms();
    if (setRooms) setRooms(updatedRooms);
  };

  const handleRemoveMember = async (memberId, name) => {
    if (confirm(`CREATOR ACTION: Are you sure you want to remove member '${name}' from room '${room.name}'?`)) {
      await removeMemberFromRoom(room.code, memberId);
      const updatedRooms = await syncServerRooms();
      if (setRooms) setRooms(updatedRooms);
    }
  };

  const handleLeaveRoom = async () => {
    if (confirm(`Are you sure you want to leave trip room '${room.name}'? You will be removed from the member roster.`)) {
      await leaveRoom(room.code, currentUser.id);
      const updatedRooms = await syncServerRooms();
      if (setRooms) setRooms(updatedRooms);
      setActiveRoomCode('');
      navigateTo('dashboard');
    }
  };

  const handleDeleteRoomByHost = async () => {
    if (confirm(`ROOM CREATOR WARNING: Are you sure you want to permanently delete trip room '${room.name}' (Code: ${room.code})? All expenses, calculations, and roster records will be wiped.`)) {
      const updatedRooms = await deleteRoom(room.code);
      if (setRooms) setRooms(updatedRooms);
      setActiveRoomCode('');
      navigateTo('dashboard');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Host Pending Join Requests Notification Banner */}
      {isHost && pendingRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <UserCheck className="w-5 h-5 text-amber-600 animate-bounce" />
            <h4 className="font-tech font-bold text-sm">
              Pending Join Requests ({pendingRequests.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{req.avatar || '👤'}</span>
                  <div>
                    <h5 className="font-tech font-bold text-xs text-slate-900">{req.userName}</h5>
                    <span className="text-[10px] text-amber-700 font-medium">Awaiting approval</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-tech font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-tech font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            Approved Member Roster ({approvedMembers.length})
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Active members sharing trip expenses in room '{room.name}'
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Member Leave Room Button (For Non-Host Approved Members) */}
          {!isHost && (
            <button
              onClick={handleLeaveRoom}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-tech font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Trip Room</span>
            </button>
          )}

          {/* Host Delete Room Button */}
          {isHost && (
            <button
              onClick={handleDeleteRoomByHost}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-tech font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {approvedMembers.map((member) => {
          if (!member) return null;
          const memberIsHost = (member.id && member.id === room.hostId) || member.isHost;

          return (
            <div
              key={member.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-orange-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center text-xl">
                  {member.avatar || '👤'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-tech font-bold text-sm text-slate-900">{member.name}</h4>
                    {memberIsHost && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-tech font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-600" />
                        Host
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {member.id === currentUser?.id ? 'You' : 'Member'}
                  </span>
                </div>
              </div>

              {/* Host Delete / Kick Member Action */}
              {isHost && !memberIsHost && (
                <button
                  onClick={() => handleRemoveMember(member.id, member.name)}
                  title={`Remove ${member.name} from room`}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer shrink-0"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
