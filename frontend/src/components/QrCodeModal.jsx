import React from 'react';
import { X, QrCode, Copy, Check } from 'lucide-react';

export const QrCodeModal = ({ isOpen, onClose, room }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !room) return null;

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}?room=${room.code}` : `http://localhost:3000?room=${room.code}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="glass-panel-light max-w-sm w-full rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 text-center">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="font-tech font-bold text-xl text-slate-900 mb-1">Invite Trip Members</h3>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Share this room code with friends to log expenses together:
        </p>

        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 mb-4">
          <span className="text-[10px] uppercase font-tech font-bold text-orange-800 block mb-1">6-Digit Room Code:</span>
          <span className="font-mono text-3xl font-black text-orange-600 tracking-widest">{room.code}</span>
        </div>

        <button
          onClick={handleCopyUrl}
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-800 border border-slate-200 font-tech font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          <span>{copied ? 'Link Copied!' : 'Copy Direct Share Link'}</span>
        </button>
      </div>
    </div>
  );
};
