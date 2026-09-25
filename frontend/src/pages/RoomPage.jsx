import React, { useState } from 'react';
import { calculateSettlements, deleteExpense, markSettlementPaid, syncServerRooms, approveJoinRequest, rejectJoinRequest } from '../lib/store.js';
import { generateTripPDF } from '../lib/pdfGenerator.js';
import { RoomSwitcherNav } from '../components/RoomSwitcherNav.jsx';
import { MemberRoster } from '../components/MemberRoster.jsx';
import { Plus, Trash2, ArrowRight, CheckCircle2, Lock, Receipt, Users, PieChart, Calculator, RefreshCw, ShieldAlert, Clock, IndianRupee, Check, UserCheck, QrCode, Share2, Download, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RoomPage = ({
  room,
  currentUser,
  onRoomSwitched,
  onOpenExpenseModal,
  onOpenQrModal,
  setRooms,
}) => {
  const [activeTab, setActiveTab] = useState('settlements');
  const [expenseFilter, setExpenseFilter] = useState('all'); // 'all' | 'group' | 'personal'
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const isHost = currentUser?.id === room.hostId;
  const isApprovedMember = isHost || (room.members && room.members.some((m) => m && m.id === currentUser?.id && m.status === 'approved'));
  const isPending = !isApprovedMember && (
    (room.joinRequests && room.joinRequests.some((r) => r && r.userId === currentUser?.id && r.status === 'pending')) ||
    (room.members && room.members.some((m) => m && m.id === currentUser?.id && m.status === 'pending'))
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncServerRooms().then(setRooms);
    setRefreshing(false);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (confirm('Are you sure you want to delete this expense item?')) {
      await deleteExpense(room.code, expenseId);
      syncServerRooms().then(setRooms);
    }
  };

  const handleMarkPaid = async (settlement) => {
    if (confirm(`Confirm settlement payment of ₹${settlement.amount.toFixed(2)} from '${settlement.fromName}' to '${settlement.toName}'?`)) {
      await markSettlementPaid(room.code, settlement);
      const updatedRooms = await syncServerRooms();
      if (setRooms) setRooms(updatedRooms);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
    }
  };

  // If user is pending approval from host
  if (!isApprovedMember) {
    const hostMember = room.members ? (room.members.find((m) => m.id === room.hostId) || room.members[0]) : null;

    return (
      <div className="space-y-6 font-sans animate-fadeIn max-w-3xl mx-auto my-8">
        <div className="glass-panel-light p-8 rounded-3xl bg-white border border-orange-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-inner border border-amber-300 animate-bounce">
            ⏳
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-tech font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Status: Pending Host Approval 🔒
            </span>
            <h3 className="font-tech font-bold text-2xl text-slate-900">Join Request Submitted</h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
              You have entered room code <strong className="font-mono text-orange-600">{room.code}</strong> for <strong className="text-slate-900">'{room.name}'</strong>. Room host <strong className="text-slate-900">{hostMember?.name || 'Room Host'}</strong> must approve your request before you can log group expenses or view settlements.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 font-medium text-left">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>What happens next?</span>
            </div>
            <p>1. The room host receives your request in their member roster.</p>
            <p>2. Once approved, refresh this page to access full trip logs and debt calculations.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-tech font-bold text-xs shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Check Status / Refresh 🔄</span>
            </button>

            <button
              onClick={() => window.location.hash = '#/dashboard'}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-tech font-bold text-xs border border-slate-200 cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <span>Return to Dashboard ⚡</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Approved Member Calculations
  const settlements = calculateSettlements(room);
  const approvedMembers = room.members ? room.members.filter((m) => m.status === 'approved') : [];
  
  // All group expenses
  const groupExpenses = room.expenses ? room.expenses.filter((e) => !e.isPersonal) : [];
  const totalTripSpend = groupExpenses.reduce((acc, e) => acc + e.amount, 0);
  const avgSpendPerMember = approvedMembers.length > 0 ? totalTripSpend / approvedMembers.length : 0;

  // Expenses visible to current user (Group + My Personal)
  const visibleExpenses = room.expenses
    ? room.expenses.filter((e) => !e.isPersonal || (e.isPersonal && e.paidBy === currentUser?.id))
    : [];

  const filteredExpenses = visibleExpenses.filter((e) => {
    if (expenseFilter === 'group') return !e.isPersonal;
    if (expenseFilter === 'personal') return e.isPersonal;
    return true;
  });

  // Current user personalized settlements:
  const receiveList = settlements.filter((s) => s.toId === currentUser?.id);
  const payList = settlements.filter((s) => s.fromId === currentUser?.id);

  const totalReceive = receiveList.reduce((acc, s) => acc + s.amount, 0);
  const totalPay = payList.reduce((acc, s) => acc + s.amount, 0);
  const netUserPosition = totalReceive - totalPay;

  const pendingRequests = room.joinRequests ? room.joinRequests.filter((r) => r && r.status === 'pending') : [];

  const handleApproveHostRequest = async (reqId) => {
    await approveJoinRequest(room.code, reqId);
    const serverRooms = await syncServerRooms();
    if (setRooms) setRooms(serverRooms);
  };

  const handleRejectHostRequest = async (reqId) => {
    await rejectJoinRequest(room.code, reqId);
    const serverRooms = await syncServerRooms();
    if (setRooms) setRooms(serverRooms);
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Room Header Controls Bar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center text-2xl shrink-0">
            🏖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-tech font-bold text-xl text-slate-900">{room.name}</h2>
              <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                {room.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Trip Room • Host: <strong className="text-slate-800">{approvedMembers.find((m) => m.id === room.hostId)?.name || 'Host'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Copy Code Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(room.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 border border-slate-200 text-xs font-mono text-orange-700 transition-all cursor-pointer"
            title="Copy Room Code"
          >
            <span>Code:</span>
            <span className="font-tech font-bold tracking-wider">{room.code}</span>
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* QR Code Modal Trigger */}
          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title="Scan / View QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}

          {/* Export PDF Report */}
          <button
            onClick={() => generateTripPDF(room)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-success text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Export Expense PDF Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {/* Dashboard Return */}
          <button
            onClick={() => (window.location.hash = '#/dashboard')}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
            title="Return to Dashboard"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room Switcher Nav Bar */}
      <RoomSwitcherNav
        currentRoom={room}
        currentUser={currentUser}
        onRoomSwitched={onRoomSwitched}
        onOpenCreateJoinModal={() => window.location.hash = '#/dashboard'}
      />

      {/* Host Pending Join Requests Banner for this room */}
      {isHost && pendingRequests.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-amber-900">
            <UserCheck className="w-5 h-5 text-amber-600 animate-bounce shrink-0" />
            <div>
              <h3 className="font-tech font-bold text-base sm:text-lg leading-tight">
                Pending Join Requests for this Room ({pendingRequests.length})
              </h3>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                The following travelers have requested permission to join room '{room.name}'. Approve or decline their access:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-white border border-amber-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-xl shrink-0">
                    {req.avatar || '👤'}
                  </div>
                  <div>
                    <h4 className="font-tech font-bold text-sm text-slate-900 flex items-center gap-2">
                      {req.userName}
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        Attempt {(req.rejectionsCount || 0) + 1}/3
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Requested join access
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveHostRequest(req.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-tech font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleRejectHostRequest(req.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                    title="Decline request"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card-light p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-tech font-bold text-slate-500 uppercase">Total Trip Spend</span>
            <IndianRupee className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-digits text-2xl sm:text-3xl font-black text-orange-600">
            ₹{totalTripSpend.toFixed(2)}
          </span>
        </div>

        <div className="glass-card-light p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-tech font-bold text-slate-500 uppercase">Avg / Member</span>
            <PieChart className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="font-digits text-2xl sm:text-3xl font-black text-emerald-600">
            ₹{avgSpendPerMember.toFixed(2)}
          </span>
        </div>

        <div className="glass-card-light p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-tech font-bold text-slate-500 uppercase">Logged Items</span>
            <Receipt className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-digits text-2xl sm:text-3xl font-black text-slate-900">
            {visibleExpenses.length}
          </span>
        </div>

        <div className="glass-card-light p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-tech font-bold text-slate-500 uppercase">Total Members</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <span className="font-digits text-2xl sm:text-3xl font-black text-slate-900">
            {approvedMembers.length}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-200/60 border border-slate-200">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'settlements' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>Debt & Settlement Summary ({settlements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-orange-600" />
          <span>Logged Expenses ({visibleExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'members' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-orange-600" />
          <span>Members ({approvedMembers.length})</span>
        </button>
      </div>

      {/* Tab 1: Personalized Debt Summary & Transfers */}
      {activeTab === 'settlements' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Personalized User Net Balance Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-tech font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Your Personal Debt Summary ({currentUser?.name || 'You'})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Clear overview of how much money you should collect or pay to other members
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Net Status:</span>
                {netUserPosition > 0.01 ? (
                  <span className="font-tech font-bold text-sm text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    🟢 You receive ₹{netUserPosition.toFixed(2)}
                  </span>
                ) : netUserPosition < -0.01 ? (
                  <span className="font-tech font-bold text-sm text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                    🔴 You owe ₹{Math.abs(netUserPosition).toFixed(2)}
                  </span>
                ) : (
                  <span className="font-tech font-bold text-sm text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    ⚪ All Settled Up
                  </span>
                )}
              </div>
            </div>

            {/* Personalized Debt Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Money You Will Receive */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-tech font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                    <span>📥 Money You Will Receive</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                      ₹{totalReceive.toFixed(2)}
                    </span>
                  </h4>
                </div>

                {receiveList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-emerald-100 text-xs text-slate-500 font-medium text-center">
                    No one owes you money right now.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {receiveList.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="font-tech font-bold text-xs text-slate-900">{s.fromName}</span>
                          <span className="text-[10px] text-emerald-700 font-medium">must pay you</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-digits font-black text-sm text-emerald-600">
                            ₹{s.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleMarkPaid(s)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-tech font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Money You Owe */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-tech font-bold text-sm text-rose-950 flex items-center gap-1.5">
                    <span>📤 Money You Should Pay</span>
                    <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono">
                      ₹{totalPay.toFixed(2)}
                    </span>
                  </h4>
                </div>

                {payList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-rose-100 text-xs text-slate-500 font-medium text-center">
                    You don't owe money to anyone!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payList.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-rose-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-rose-700 font-medium">You must pay</span>
                          <span className="font-tech font-bold text-xs text-slate-900">{s.toName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-digits font-black text-sm text-rose-600">
                            ₹{s.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleMarkPaid(s)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-tech font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settle Up</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Group Settlement Transfer List */}
          <div className="glass-panel-light p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-tech font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  Full Room Settlement Plan (Min Cash Flow)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete minimum transaction transfers to settle all trip debts
                </p>
              </div>
            </div>

            {settlements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                <h4 className="font-tech font-bold text-emerald-950 text-base">All Trip Debts Are 100% Settled!</h4>
                <p className="text-xs text-emerald-700 font-medium">No pending payments required between members.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-orange-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2 text-sm font-sans">
                      <span className="font-bold text-slate-900">{s.fromName}</span>
                      <span className="text-xs font-tech font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        MUST PAY
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-900">{s.toName}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-slate-200 pt-2 sm:pt-0">
                      <span className="font-digits text-lg font-black text-emerald-600">
                        ₹{s.amount.toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleMarkPaid(s)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-tech font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Settlement Payment History Log */}
          <div className="glass-panel-light p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-tech font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Settlement Payment History Log ({room.settlementHistory ? room.settlementHistory.length : 0})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Record of all completed & verified person-to-person debt settlements
                </p>
              </div>
            </div>

            {!room.settlementHistory || room.settlementHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-200">
                No settlement payments marked as paid yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {room.settlementHistory.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 font-sans">
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">✓ PAID</span>
                      <span className="font-bold text-slate-900">{p.fromName}</span>
                      <span className="text-slate-400 font-medium">paid</span>
                      <span className="font-bold text-slate-900">{p.toName}</span>
                      <span className="text-slate-400 font-medium">• {p.dateFormatted} {p.timeFormatted}</span>
                    </div>

                    <span className="font-digits font-black text-sm text-emerald-600">
                      ₹{p.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Logged Expenses Directory */}
      {activeTab === 'expenses' && (
        <div className="glass-panel-light p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="font-tech font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                Logged Expense Items ({filteredExpenses.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Record of group trip expenditures and your private personal expenses
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              {/* Expense Filter Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setExpenseFilter('all')}
                  className={`px-3 py-1 rounded-lg font-tech font-bold transition-all cursor-pointer ${
                    expenseFilter === 'all' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({visibleExpenses.length})
                </button>
                <button
                  onClick={() => setExpenseFilter('group')}
                  className={`px-3 py-1 rounded-lg font-tech font-bold transition-all cursor-pointer ${
                    expenseFilter === 'group' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👥 Group
                </button>
                <button
                  onClick={() => setExpenseFilter('personal')}
                  className={`px-3 py-1 rounded-lg font-tech font-bold transition-all cursor-pointer ${
                    expenseFilter === 'personal' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔒 Personal
                </button>
              </div>

              <button
                onClick={onOpenExpenseModal}
                className="px-4 py-2.5 rounded-xl btn-tech-orange font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Log Expense</span>
              </button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-200">
              No expense items found matching your filter. Click <strong>'Log Expense'</strong> to add one!
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
                const payer = room.members.find((m) => m.id === exp.paidBy);
                const isMyPersonal = exp.isPersonal && exp.paidBy === currentUser?.id;

                return (
                  <div
                    key={exp.id}
                    className={`p-4 rounded-2xl bg-white border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isMyPersonal ? 'border-purple-200 bg-purple-50/30 hover:border-purple-300' : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold ${
                        isMyPersonal ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {exp.category === 'food' ? '🍕' : exp.category === 'stay' ? '🏨' : exp.category === 'travel' ? '🚕' : '🎟️'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-tech font-bold text-base text-slate-900">{exp.title}</h4>
                          {isMyPersonal ? (
                            <span className="text-[10px] bg-purple-100 text-purple-900 font-tech font-bold px-2 py-0.5 rounded-full border border-purple-300 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-purple-600" />
                              Personal (Private)
                            </span>
                          ) : exp.splitType === 'custom' ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-tech font-bold px-2 py-0.5 rounded-full border border-amber-300">
                              Custom Split ✏️
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Paid by <strong className="text-slate-800">{payer?.name || (isMyPersonal ? 'You' : 'Unknown')}</strong> • {exp.dateFormatted || 'Today'} {exp.notes ? `• "${exp.notes}"` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <span className={`font-digits text-lg font-black ${isMyPersonal ? 'text-purple-700' : 'text-orange-600'}`}>
                        ₹{exp.amount.toFixed(2)}
                      </span>

                      {(exp.paidBy === currentUser?.id || isHost) && (
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          title="Delete Expense Item"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Tab 3: Member Roster */}
      {activeTab === 'members' && (
        <div className="glass-panel-light p-6 rounded-3xl bg-white border border-slate-200 shadow-md animate-fadeIn">
          <MemberRoster room={room} currentUser={currentUser} setRooms={setRooms} />
        </div>
      )}
    </div>
  );
};
