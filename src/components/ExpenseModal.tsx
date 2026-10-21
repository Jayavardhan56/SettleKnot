import React, { useState, useEffect } from 'react';
import { X, Users, Lock, Check } from 'lucide-react';
import { Room, User, ExpenseCategory, SplitType } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  currentUser: User | null;
  onAddExpense: (expenseData: {
    title: string;
    amount: number;
    category: ExpenseCategory | string;
    paidBy: string;
    paidByName?: string;
    isPersonal: boolean;
    splitType: SplitType | string;
    splitAmong?: string[];
    customSplits?: Record<string, number> | null;
    notes?: string;
  }) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  room,
  currentUser,
  onAddExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | string>('food');
  const [isPersonal, setIsPersonal] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const approvedMembers = room?.members
    ? room.members.filter((m) => m && (m.status === 'approved' || !m.status))
    : [];

  // When modal opens or room updates, reset form and auto-select all approved members for Equal Split
  useEffect(() => {
    if (isOpen && room) {
      const allApprovedIds = approvedMembers.map((m) => m.id);
      setSelectedMembers(allApprovedIds);
      setSplitType('equal');
      setError('');
      setTitle('');
      setAmount('');
      setNotes('');
      setCustomSplits({});
      setIsPersonal(false);

      // Default payer: currentUser if in approved members, or first approved member, or host
      const defaultPayer = currentUser?.id && approvedMembers.some((m) => m.id === currentUser.id)
        ? currentUser.id
        : (approvedMembers[0]?.id || currentUser?.id || room.hostId || '');
      setSelectedPayerId(defaultPayer);
    }
  }, [isOpen, room?.code]);

  if (!isOpen || !room) return null;

  const handleSelectEqualSplit = () => {
    setSplitType('equal');
    if (selectedMembers.length === 0) {
      setSelectedMembers(approvedMembers.map((m) => m.id));
    }
    setError('');
  };

  const toggleMemberForEqual = (id: string) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length <= 1) {
        setError('At least one member must participate in the split.');
        return;
      }
      setSelectedMembers(selectedMembers.filter((mId) => mId !== id));
      setError('');
    } else {
      setSelectedMembers([...selectedMembers, id]);
      setError('');
    }
  };

  const selectAllEqualMembers = () => {
    setSelectedMembers(approvedMembers.map((m) => m.id));
    setError('');
  };

  const handleSelectCustomSplit = () => {
    setSplitType('custom');
    if (selectedMembers.length === 0) {
      setSelectedMembers(approvedMembers.map((m) => m.id));
    }
    setError('');
  };

  const handleCustomSplitChange = (memberId: string, val: string) => {
    setCustomSplits((prev) => ({
      ...prev,
      [memberId]: val,
    }));
  };

  const toggleMemberForCustom = (id: string) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length === 1) return;
      setSelectedMembers(selectedMembers.filter((mId) => mId !== id));
      const nextSplits = { ...customSplits };
      delete nextSplits[id];
      setCustomSplits(nextSplits);
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please enter an expense description.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount in ₹.');
      return;
    }

    // Resolve Payer: either selected from dropdown or active user
    const resolvedPayerId = selectedPayerId || currentUser?.id || room.hostId || (approvedMembers[0] ? approvedMembers[0].id : '');
    const payerMember = approvedMembers.find((m) => m.id === resolvedPayerId) ||
      (currentUser?.id === resolvedPayerId ? currentUser : null);
    const resolvedPayerName = payerMember?.name || (resolvedPayerId === currentUser?.id ? currentUser?.name || 'You' : 'Member');

    if (!isPersonal) {
      if (selectedMembers.length === 0) {
        setError('Please select at least one member to split among.');
        return;
      }

      if (splitType === 'custom') {
        let sumCustom = 0;
        const formattedSplits: Record<string, number> = {};
        for (const mId of selectedMembers) {
          const val = parseFloat(customSplits[mId] || '0');
          if (isNaN(val) || val < 0) {
            setError('Custom split amounts must be valid non-negative numbers.');
            return;
          }
          sumCustom += val;
          formattedSplits[mId] = Math.round(val * 100) / 100;
        }

        if (Math.abs(sumCustom - numAmount) > 0.05) {
          setError(
            `Custom split total (₹${sumCustom.toFixed(2)}) must equal the expense total (₹${numAmount.toFixed(
              2
            )}). Difference: ₹${Math.abs(sumCustom - numAmount).toFixed(2)}`
          );
          return;
        }

        onAddExpense({
          title: title.trim(),
          amount: numAmount,
          category,
          paidBy: resolvedPayerId,
          paidByName: resolvedPayerName,
          isPersonal: false,
          splitType: 'custom',
          splitAmong: selectedMembers,
          customSplits: formattedSplits,
          notes: notes.trim(),
        });
      } else {
        // Equal split among selected participating members
        onAddExpense({
          title: title.trim(),
          amount: numAmount,
          category,
          paidBy: resolvedPayerId,
          paidByName: resolvedPayerName,
          isPersonal: false,
          splitType: 'equal',
          splitAmong: selectedMembers,
          customSplits: null,
          notes: notes.trim(),
        });
      }
    } else {
      // Personal Private Expense (visible only to currentUser)
      onAddExpense({
        title: title.trim(),
        amount: numAmount,
        category,
        paidBy: currentUser?.id || resolvedPayerId,
        paidByName: currentUser?.name || resolvedPayerName,
        isPersonal: true,
        splitType: 'personal',
        splitAmong: [currentUser?.id || resolvedPayerId],
        customSplits: null,
        notes: notes.trim(),
      });
    }

    setTitle('');
    setAmount('');
    setNotes('');
    setCustomSplits({});
    setError('');
    onClose();
  };

  const currentSelectedPayer = approvedMembers.find((m) => m.id === selectedPayerId) ||
    (currentUser?.id === selectedPayerId ? currentUser : null);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn font-sans">
      <div className="glass-panel-light max-w-lg w-full rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20">
              ➕
            </div>
            <div>
              <h3 className="font-tech font-bold text-base sm:text-lg leading-tight">Log Expense Item</h3>
              <p className="text-[11px] text-orange-100 font-medium">{room.name} ({room.code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Expense Visibility Selector: Group vs Personal */}
          <div>
            <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1.5">
              Expense Type & Visibility
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsPersonal(false);
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isPersonal ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Group Trip Expense</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPersonal(true);
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isPersonal ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Personal (Private) 🔒</span>
              </button>
            </div>
            {isPersonal && (
              <p className="text-[11px] text-purple-700 font-medium mt-1.5 bg-purple-50 p-2 rounded-xl border border-purple-200">
                🔒 Personal expenses are 100% private to you. They will not be visible to other members and will not affect group trip settlements.
              </p>
            )}
          </div>

          {/* Paid By: Select which room member actually paid */}
          {!isPersonal && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-tech font-bold text-slate-700 uppercase">
                  Paid By (Who paid for this?)
                </label>
                {selectedPayerId && selectedPayerId === currentUser?.id && (
                  <span className="text-[10px] font-tech font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    You paid ✓
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedPayerId}
                  onChange={(e) => setSelectedPayerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-tech font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-2xs"
                >
                  {approvedMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.avatar || '👤'} {m.name} {m.id === currentUser?.id ? '(You)' : ''} {m.id === room.hostId ? '👑 (Host)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {currentSelectedPayer && (
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  💰 Credit assigned to <strong>{currentSelectedPayer.name}</strong>. Participating members will owe them.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
              Expense Description
            </label>
            <input
              type="text"
              placeholder="e.g. Seafood Dinner, Hotel Room, Taxi Fare"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="₹ 0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-tech font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-tech font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="food">🍕 Food & Drinks</option>
                <option value="stay">🏨 Hotel & Stay</option>
                <option value="travel">🚕 Cab & Travel</option>
                <option value="activities">🎟️ Activities</option>
                <option value="general">📦 General</option>
              </select>
            </div>
          </div>

          {/* Split Settings (Only for Group Expense) */}
          {!isPersonal && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-tech font-bold text-slate-700 uppercase">
                  Split Method
                </label>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSelectEqualSplit}
                    className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg font-tech font-bold transition-all cursor-pointer text-center ${
                      splitType === 'equal'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectCustomSplit}
                    className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg font-tech font-bold transition-all cursor-pointer text-center ${
                      splitType === 'custom'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Custom Amounts ✏️
                  </button>
                </div>
              </div>

              {/* Equal Split: Toggle participating members */}
              {splitType === 'equal' && (
                <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👥</span>
                      <span className="font-tech font-bold text-xs text-orange-950">
                        Splitting equally among {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && selectedMembers.length > 0 && (
                        <span className="font-digits font-black text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                          ₹{(parseFloat(amount) / selectedMembers.length).toFixed(2)} / member
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={selectAllEqualMembers}
                        className="text-[10px] font-tech font-bold text-orange-800 bg-white hover:bg-orange-100 px-2 py-0.5 rounded-md border border-orange-300 transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-orange-200/60">
                    {approvedMembers.map((m) => {
                      const isSelected = selectedMembers.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => toggleMemberForEqual(m.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-tech font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          <span>{m.avatar}</span>
                          <span>{m.name}</span>
                          {isSelected ? <Check className="w-3 h-3 text-white" /> : <span className="w-3 h-3 block opacity-30">+</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Split Mode: Pick members and assign specific amounts */}
              {splitType === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                      Select Members Participating in Custom Split:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {approvedMembers.map((m) => {
                        const isSelected = selectedMembers.includes(m.id);
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => toggleMemberForCustom(m.id)}
                            className={`px-3 py-1.5 rounded-xl font-tech font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span>{m.avatar}</span>
                            <span>{m.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-tech font-bold text-amber-900">
                      <span>
                        Enter Individual Amounts (Total must equal ₹
                        {parseFloat(amount || '0').toFixed(2)})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {approvedMembers
                        .filter((m) => selectedMembers.includes(m.id))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{m.avatar}</span>
                              <span className="font-tech font-bold text-xs text-slate-900">{m.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-slate-400">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={customSplits[m.id] || ''}
                                onChange={(e) => handleCustomSplitChange(m.id, e.target.value)}
                                className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-tech font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">
              Optional Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via Google Pay / UPI"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl btn-tech-orange font-bold text-sm shadow-md cursor-pointer transition-all mt-2"
          >
            {isPersonal ? 'Save Personal Expense 🔒' : 'Save Group Expense ➕'}
          </button>
        </form>
      </div>
    </div>
  );
};
