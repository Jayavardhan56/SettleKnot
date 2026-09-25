import React from 'react';
import { getUserRooms, setActiveRoomCode } from '../lib/store.js';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

export const RoomSwitcherNav = ({
  currentRoom,
  currentUser,
  onRoomSwitched,
  onOpenCreateJoinModal,
}) => {
  const userRooms = getUserRooms(currentUser?.id || '');

  if (userRooms.length === 0) return null;

  const currentIndex = userRooms.findIndex((r) => r.code === currentRoom?.code);
  const displayIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

  const handlePrev = () => {
    if (userRooms.length <= 1) return;
    const prevIndex = (currentIndex - 1 + userRooms.length) % userRooms.length;
    const targetRoom = userRooms[prevIndex];
    setActiveRoomCode(targetRoom.code);
    onRoomSwitched(targetRoom.code);
  };

  const handleNext = () => {
    if (userRooms.length <= 1) return;
    const nextIndex = (currentIndex + 1) % userRooms.length;
    const targetRoom = userRooms[nextIndex];
    setActiveRoomCode(targetRoom.code);
    onRoomSwitched(targetRoom.code);
  };

  return (
    <div className="glass-panel-light rounded-2xl px-4 py-2.5 bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3 font-sans">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={handlePrev}
          disabled={userRooms.length <= 1}
          title="Previous Trip Room"
          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
            userRooms.length <= 1
              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border-slate-200 text-slate-700'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-slate-400 font-tech font-bold shrink-0">
            [{displayIndex}/{userRooms.length}]
          </span>
          <span className="font-tech font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[220px]">
            {currentRoom?.name || 'Room'}
          </span>
          <span className="font-tech text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 text-[11px] hidden sm:inline shrink-0">
            {currentRoom?.code}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={userRooms.length <= 1}
          title="Next Trip Room"
          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
            userRooms.length <= 1
              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border-slate-200 text-slate-700'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={onOpenCreateJoinModal}
        className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-tech font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
      >
        <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
        <span>Switch / Join Room</span>
      </button>
    </div>
  );
};
