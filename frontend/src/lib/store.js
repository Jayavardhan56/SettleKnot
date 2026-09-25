import { fetchApi } from './api.js';

const ROOMS_KEY = 'settleknot_trip_rooms';
const ACTIVE_ROOM_KEY = 'settleknot_active_room_code';

export function getAllRooms() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ROOMS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (err) {
    return [];
  }
}

export function saveAllRooms(rooms) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function getActiveRoomCode() {
  if (typeof window === 'undefined') return 'GOA2026';
  return sessionStorage.getItem(ACTIVE_ROOM_KEY) || 'GOA2026';
}

export function setActiveRoomCode(code) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ACTIVE_ROOM_KEY, code);
}

export function getUserRooms(userId) {
  const rooms = getAllRooms();
  if (!userId || !Array.isArray(rooms)) return [];
  return rooms.filter((r) => {
    if (!r) return false;
    const members = Array.isArray(r.members) ? r.members : [];
    return members.some((m) => m && m.id === userId && m.status === 'approved') || r.hostId === userId;
  });
}

export function getUserSentJoinRequests(userId) {
  if (!userId) return [];
  const rooms = getAllRooms();
  const results = [];

  rooms.forEach((room) => {
    if (!room || !Array.isArray(room.joinRequests)) return;
    const req = room.joinRequests.find((r) => r && r.userId === userId);
    if (req) {
      const hostMember = (room.members || []).find((m) => m && (m.isHost || m.id === room.hostId));
      const isApproved = (room.members || []).some((m) => m && m.id === userId && m.status === 'approved');
      const userRejections = (room.userRejections && room.userRejections[userId]) || req.rejectionsCount || 0;
      const isBlocked = !isApproved && (userRejections >= 3 || req.status === 'blocked');

      const finalStatus = isApproved ? 'approved' : (isBlocked ? 'blocked' : (req.status || 'pending'));

      results.push({
        requestId: req.id,
        roomCode: room.code,
        roomName: room.name,
        hostName: hostMember ? hostMember.name : 'Room Host',
        status: finalStatus,
        rejectionsCount: userRejections,
        createdAt: req.createdAt || room.createdAt,
      });
    }
  });

  return results;
}

export function getHostPendingJoinRequests(userId) {
  if (!userId) return [];
  const rooms = getAllRooms();
  const pendingList = [];

  rooms.forEach((room) => {
    if (!room || room.hostId !== userId) return;
    if (!Array.isArray(room.joinRequests)) return;

    room.joinRequests.forEach((req) => {
      if (req && req.status === 'pending') {
        const userRejections = (room.userRejections && room.userRejections[req.userId]) || req.rejectionsCount || 0;
        pendingList.push({
          ...req,
          rejectionsCount: userRejections,
          roomCode: room.code,
          roomName: room.name,
        });
      }
    });
  });

  return pendingList;
}

export function generateRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function createRoom(name, hostUser) {
  const code = generateRoomCode();
  const newRoom = {
    id: `room-${Date.now()}`,
    code,
    name: name.trim(),
    currency: '₹',
    hostId: hostUser.id,
    createdAt: new Date().toISOString(),
    joinRequests: [],
    members: [
      {
        id: hostUser.id,
        name: hostUser.name,
        avatar: hostUser.avatar || '🦊',
        isHost: true,
        status: 'approved',
      },
    ],
    expenses: [],
  };

  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', roomData: newRoom }),
    });

    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
    }
  } catch (err) {
    const rooms = getAllRooms();
    rooms.unshift(newRoom);
    saveAllRooms(rooms);
  }

  setActiveRoomCode(code);
  return newRoom;
}

export async function addExpense(roomCode, expenseData) {
  const newExpense = {
    id: `exp-${Date.now()}`,
    timestamp: new Date().toISOString(),
    dateFormatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeFormatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    ...expenseData,
  };

  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'addExpense', code: roomCode, expense: newExpense }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room;
    }
  } catch (err) {
    console.warn('Backend addExpense error:', err);
  }

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === roomCode);
  if (target) {
    target.expenses = target.expenses || [];
    target.expenses.unshift(newExpense);
    saveAllRooms(rooms);
  }
  return target;
}

export async function deleteExpense(roomCode, expenseId) {
  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteExpense', code: roomCode, expenseId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room;
    }
  } catch (err) {
    console.warn('Backend deleteExpense error:', err);
  }

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === roomCode);
  if (target && target.expenses) {
    target.expenses = target.expenses.filter((e) => e && e.id !== expenseId);
    saveAllRooms(rooms);
  }
  return target;
}

export async function approveJoinRequest(code, requestId) {
  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'approveJoinRequest', code, requestId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room || data.rooms.find((r) => r.code === code);
    }
  } catch (err) {
    console.warn('Backend approveJoinRequest error:', err);
  }

  const rooms = getAllRooms();
  const room = rooms.find((r) => r && r.code === code);
  if (room && room.joinRequests) {
    const req = room.joinRequests.find((r) => r && r.id === requestId);
    if (req) {
      req.status = 'approved';
      room.members = room.members || [];
      if (!room.members.some((m) => m && m.id === req.userId)) {
        room.members.push({ id: req.userId, name: req.userName, avatar: req.avatar || '👤', status: 'approved' });
      }
      saveAllRooms(rooms);
    }
  }
  return room;
}

export async function rejectJoinRequest(code, requestId) {
  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'rejectJoinRequest', code, requestId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room || data.rooms.find((r) => r.code === code);
    }
  } catch (err) {
    console.warn('Backend rejectJoinRequest error:', err);
  }

  const rooms = getAllRooms();
  const room = rooms.find((r) => r && r.code === code);
  if (room && room.joinRequests) {
    room.userRejections = room.userRejections || {};
    const req = room.joinRequests.find((r) => r && r.id === requestId);
    if (req) {
      const currentRejections = (room.userRejections[req.userId] || 0) + 1;
      room.userRejections[req.userId] = currentRejections;
      req.rejectionsCount = currentRejections;
      req.status = currentRejections >= 3 ? 'blocked' : 'rejected';
    }
    saveAllRooms(rooms);
  }
  return room;
}

export async function cancelJoinRequest(code, userId) {
  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancelJoinRequest', code, userId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.rooms;
    }
  } catch (err) {
    console.warn('Backend cancelJoinRequest error:', err);
  }

  const rooms = getAllRooms();
  const room = rooms.find((r) => r && r.code === code);
  if (room && room.joinRequests) {
    room.joinRequests = room.joinRequests.filter((r) => r && r.userId !== userId);
    saveAllRooms(rooms);
  }
  return rooms;
}

export async function addMemberToRoom(code, name, avatar = '👤') {
  const avatars = ['🦊', '🐼', '🦁', '🐻', '🐯', '🐨', '🦄', '🐲', '🐙'];
  const newMember = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    avatar: avatar || avatars[Math.floor(Math.random() * avatars.length)],
    status: 'approved',
  };

  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'addMember', code, newMember }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room;
    }
  } catch (err) {
    console.warn('Backend addMember error:', err);
  }

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === code);
  if (target) {
    target.members = target.members || [];
    target.members.push(newMember);
    saveAllRooms(rooms);
  }
  return target;
}

export async function removeMemberFromRoom(code, targetUserId) {
  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'removeMember', code, targetUserId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room;
    }
  } catch (err) {
    console.warn('Backend removeMember error:', err);
  }

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === code);
  if (target) {
    target.members = (target.members || []).filter((m) => m && m.id !== targetUserId);
    target.joinRequests = (target.joinRequests || []).filter((r) => r && r.userId !== targetUserId);
    saveAllRooms(rooms);
  }
  return target;
}

export async function leaveRoom(code, userId) {
  return removeMemberFromRoom(code, userId);
}

export async function deleteRoom(code) {
  try {
    const data = await fetchApi('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', code }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.rooms;
    }
  } catch (err) {
    console.warn('Backend deleteRoom error:', err);
  }
  const rooms = getAllRooms().filter((r) => r && r.code !== code);
  saveAllRooms(rooms);
  return rooms;
}

export async function syncServerRooms() {
  try {
    const data = await fetchApi('/api/rooms');
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.rooms;
    }
    return getAllRooms();
  } catch (err) {
    return getAllRooms();
  }
}

export async function markSettlementPaid(code, settlementData) {
  const newPayment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    fromId: settlementData.fromId,
    fromName: settlementData.fromName,
    toId: settlementData.toId,
    toName: settlementData.toName,
    amount: settlementData.amount,
    dateFormatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeFormatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
    status: 'PAID',
  };

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === code);
  if (target) {
    target.settlementHistory = target.settlementHistory || [];
    target.settlementHistory.unshift(newPayment);
    saveAllRooms(rooms);

    try {
      await fetchApi('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({ action: 'update', roomData: target }),
      });
    } catch (err) {}
  }
  return target;
}

// Minimum Cash Flow Settlement Algorithm
export function calculateSettlements(room) {
  if (!room) return [];
  const members = Array.isArray(room.members) ? room.members : [];
  const expenses = Array.isArray(room.expenses) ? room.expenses : [];
  if (members.length === 0) return [];

  const approvedMembers = members.filter((m) => m && m.status === 'approved');
  if (approvedMembers.length === 0) return [];

  const balances = {};
  approvedMembers.forEach((m) => {
    if (m && m.id) balances[m.id] = 0;
  });

  const groupExpenses = expenses.filter((e) => e && !e.isPersonal);

  groupExpenses.forEach((exp) => {
    const paidBy = exp.paidBy;
    const amount = Number(exp.amount) || 0;

    if (exp.splitType === 'custom' && exp.customSplits && typeof exp.customSplits === 'object') {
      if (balances[paidBy] !== undefined) {
        balances[paidBy] += amount;
      }
      Object.keys(exp.customSplits).forEach((memberId) => {
        const share = Number(exp.customSplits[memberId]) || 0;
        if (balances[memberId] !== undefined) {
          balances[memberId] -= share;
        }
      });
    } else {
      const splitAmong = Array.isArray(exp.splitAmong) && exp.splitAmong.length > 0
        ? exp.splitAmong
        : approvedMembers.map((m) => m.id);

      if (splitAmong.length > 0) {
        const share = amount / splitAmong.length;
        if (balances[paidBy] !== undefined) {
          balances[paidBy] += amount;
        }
        splitAmong.forEach((memberId) => {
          if (balances[memberId] !== undefined) {
            balances[memberId] -= share;
          }
        });
      }
    }
  });

  // Apply completed settlement payments history
  const settlementHistory = Array.isArray(room.settlementHistory) ? room.settlementHistory : [];
  settlementHistory.forEach((payment) => {
    if (payment && payment.status === 'PAID') {
      const fromId = payment.fromId;
      const toId = payment.toId;
      const amount = Number(payment.amount) || 0;

      if (balances[fromId] !== undefined) {
        balances[fromId] += amount;
      }
      if (balances[toId] !== undefined) {
        balances[toId] -= amount;
      }
    }
  });

  const debtors = [];
  const creditors = [];

  Object.keys(balances).forEach((memberId) => {
    const bal = balances[memberId];
    const member = approvedMembers.find((m) => m && m.id === memberId);
    const memberName = member ? member.name : 'Unknown';

    if (bal < -0.01) {
      debtors.push({ id: memberId, name: memberName, amount: Math.abs(bal) });
    } else if (bal > 0.01) {
      creditors.push({ id: memberId, name: memberName, amount: bal });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const minAmount = Math.min(debtor.amount, creditor.amount);

    if (minAmount > 0.01) {
      settlements.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: minAmount,
      });
    }

    debtor.amount -= minAmount;
    creditor.amount -= minAmount;

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return settlements;
}
