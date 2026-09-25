import React, { useState } from 'react';
import { X, Receipt, Tag, Users, Lock, PieChart, Calculator, Check } from 'lucide-react';

export const ExpenseModal = ({ isOpen, onClose, room, currentUser, onAddExpense }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [paidBy, setPaidBy] = useState(currentUser?.id || room?.members[0]?.id || '');
  const [isPersonal, setIsPersonal] = useState(false);
  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'custom'
  const [selectedMembers, setSelectedMembers] = useState(room?.members.filter((m) => m.status === 'approved').map((m) => m.id) || []);
  const [customSplits, setCustomSplits] = useState({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !room) return null;

  const approvedMembers = room.members ? room.members.filter((m) => m.status === 'approved') : [];

  const handleCustomSplitChange = (memberId, val) => {
    setCustomSplits((prev) => ({
      ...prev,
      [memberId]: val,
    }));
  };

  const toggleMember = (id) => {
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

  const handleSubmit = (e) => {
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

    if (!isPersonal) {
      if (selectedMembers.length === 0) {
        setError('Please select at least one member to split among.');
        return;
      }

      if (splitType === 'custom') {
        let sumCustom = 0;
        const formattedSplits = {};
        for (const mId of selectedMembers) {
          const val = parseFloat(customSplits[mId] || 0);
          if (isNaN(val) || val < 0) {
            setError('Custom split amounts must be valid non-negative numbers.');
            return;
          }
          sumCustom += val;
          formattedSplits[mId] = val;
        }

        if (Math.abs(sumCustom - numAmount) > 0.05) {
          setError(`Custom split total (₹${sumCustom.toFixed(2)}) must equal the expense total (₹${numAmount.toFixed(2)}). Difference: ₹${Math.abs(sumCustom - numAmount).toFixed(2)}`);
          return;
        }

        onAddExpense({
          title: title.trim(),
          amount: numAmount,
          category,
          paidBy,
          isPersonal: false,
          splitType: 'custom',
          splitAmong: selectedMembers,
          customSplits: formattedSplits,
          notes: notes.trim(),
        });
      } else {
        onAddExpense({
          title: title.trim(),
          amount: numAmount,
          category,
          paidBy,
          isPersonal: false,
          splitType: 'equal',
          splitAmong: selectedMembers,
          customSplits: null,
          notes: notes.trim(),
        });
      }
    } else {
      // Personal Private Expense
      onAddExpense({
        title: title.trim(),
        amount: numAmount,
        category,
        paidBy: currentUser?.id || paidBy,
        isPersonal: true,
        splitType: 'personal',
        splitAmong: [currentUser?.id || paidBy],
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="glass-panel-light max-w-lg w-full rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-between border-b border-orange-400">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-white" />
            <h3 className="font-tech font-bold text-lg">Log Expense Item</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Expense Visibility Selector: Group vs Personal */}
          <div>
            <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1.5">Expense Type & Visibility</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => { setIsPersonal(false); setError(''); }}
                className={`py-2.5 px-3 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isPersonal ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Group Trip Expense</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsPersonal(true); setError(''); }}
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

          {/* Title */}
          <div>
            <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">Expense Description</label>
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
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">Amount (₹)</label>
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
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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

          {/* Paid By (Only for Group Expense) */}
          {!isPersonal && (
            <div>
              <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">Paid By Member</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-tech font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              >
                {approvedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar} {m.name} {m.id === currentUser?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Split Settings (Only for Group Expense) */}
          {!isPersonal && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-tech font-bold text-slate-700 uppercase">Split Method</label>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setSplitType('equal')}
                    className={`px-3 py-1 rounded-lg font-tech font-bold transition-all cursor-pointer ${
                      splitType === 'equal' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType('custom')}
                    className={`px-3 py-1 rounded-lg font-tech font-bold transition-all cursor-pointer ${
                      splitType === 'custom' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Custom Amounts ✏️
                  </button>
                </div>
              </div>

              {/* Selected Members Checkboxes */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Select Members Involved:</label>
                <div className="flex flex-wrap gap-2">
                  {approvedMembers.map((m) => {
                    const isSelected = selectedMembers.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggleMember(m.id)}
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

              {/* Custom Split Amounts Input Fields */}
              {splitType === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-tech font-bold text-amber-900">
                    <span>Enter Individual Shares (Total must equal ₹{parseFloat(amount || 0).toFixed(2)})</span>
                  </div>
                  <div className="space-y-2">
                    {approvedMembers
                      .filter((m) => selectedMembers.includes(m.id))
                      .map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
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
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-tech font-bold text-slate-700 uppercase mb-1">Optional Notes</label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Submit */}
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
