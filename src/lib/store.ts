import { fetchApi } from './api';
import { Room, Expense, Member, JoinRequest, UserSentJoinRequest, Settlement, SettlementHistoryItem, User } from '../types';

const ROOMS_KEY = 'settleknot_trip_rooms';
const ACTIVE_ROOM_KEY = 'settleknot_active_room_code';

export function getAllRooms(): Room[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ROOMS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (err) {
    return [];
  }
}

export function saveAllRooms(rooms: Room[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function getActiveRoomCode(): string {
  if (typeof window === 'undefined') return 'GOA2026';
  return localStorage.getItem(ACTIVE_ROOM_KEY) || sessionStorage.getItem(ACTIVE_ROOM_KEY) || 'GOA2026';
}

export function setActiveRoomCode(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_ROOM_KEY, code);
  sessionStorage.setItem(ACTIVE_ROOM_KEY, code);
}

export function getUserRooms(userId: string): Room[] {
  const rooms = getAllRooms();
  if (!userId || !Array.isArray(rooms)) return [];
  return rooms.filter((r) => {
    if (!r) return false;
    const members = Array.isArray(r.members) ? r.members : [];
    return members.some((m) => m && m.id === userId && m.status === 'approved') || r.hostId === userId;
  });
}

export function getUserSentJoinRequests(userId: string): UserSentJoinRequest[] {
  if (!userId) return [];
  const rooms = getAllRooms();
  const results: UserSentJoinRequest[] = [];

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

export function getHostPendingJoinRequests(userId: string): (JoinRequest & { roomCode: string; roomName: string })[] {
  if (!userId) return [];
  const rooms = getAllRooms();
  const pendingList: (JoinRequest & { roomCode: string; roomName: string })[] = [];

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

export function generateRoomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function createRoom(name: string, hostUser: Partial<User> & { id: string; name: string }): Promise<Room> {
  const code = generateRoomCode();
  const newRoom: Room = {
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
    const data = await fetchApi<{ success: boolean; rooms: Room[] }>('/api/rooms', {
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

export async function addExpense(roomCode: string, expenseData: Omit<Expense, 'id' | 'timestamp' | 'dateFormatted' | 'timeFormatted'>): Promise<Room | null> {
  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    timestamp: new Date().toISOString(),
    dateFormatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeFormatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    ...expenseData,
  };

  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room: Room }>('/api/rooms', {
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
  return target || null;
}

export async function deleteExpense(roomCode: string, expenseId: string, userId?: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteExpense', code: roomCode, expenseId, userId }),
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
  return target || null;
}

export async function approveJoinRequest(code: string, requestId: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room?: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'approveJoinRequest', code, requestId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room || data.rooms.find((r) => r.code === code) || null;
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
  return room || null;
}

export async function rejectJoinRequest(code: string, requestId: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room?: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'rejectJoinRequest', code, requestId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room || data.rooms.find((r) => r.code === code) || null;
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
  return room || null;
}

export async function cancelJoinRequest(code: string, userId: string): Promise<Room[]> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[] }>('/api/rooms', {
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

export async function addMemberToRoom(code: string, name: string, avatar: string = '👤'): Promise<Room | null> {
  const avatars = ['🦊', '🐼', '🦁', '🐻', '🐯', '🐨', '🦄', '🐲', '🐙'];
  const newMember: Member = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    avatar: avatar || avatars[Math.floor(Math.random() * avatars.length)],
    status: 'approved',
  };

  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room: Room }>('/api/rooms', {
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
  return target || null;
}

export async function removeMemberFromRoom(code: string, targetUserId: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room: Room }>('/api/rooms', {
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
  return target || null;
}

export async function leaveRoom(code: string, userId: string): Promise<Room | null> {
  return removeMemberFromRoom(code, userId);
}

export async function deleteRoom(code: string): Promise<Room[]> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[] }>('/api/rooms', {
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

export async function syncServerRooms(): Promise<Room[]> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[] }>('/api/rooms');
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.rooms;
    }
    return getAllRooms();
  } catch (err) {
    return getAllRooms();
  }
}

export async function claimSettlementPaid(code: string, settlementData: Settlement): Promise<Room | null> {
  const newPayment: SettlementHistoryItem = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    fromId: settlementData.fromId,
    fromName: settlementData.fromName,
    toId: settlementData.toId,
    toName: settlementData.toName,
    amount: settlementData.amount,
    dateFormatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeFormatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
    status: 'PENDING',
  };

  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room?: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'claimPayment', code, payment: newPayment }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room || data.rooms.find((r) => r.code === code) || null;
    }
  } catch (err) {
    console.warn('Backend claimPayment error:', err);
  }

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === code);
  if (target) {
    target.settlementHistory = target.settlementHistory || [];
    target.settlementHistory = target.settlementHistory.filter(
      (p) => !(p.status !== 'PAID' && p.fromId === settlementData.fromId && p.toId === settlementData.toId)
    );
    target.settlementHistory.unshift(newPayment);
    saveAllRooms(rooms);
  }
  return target || null;
}

export async function approveSettlementPayment(code: string, paymentId: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room?: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'approvePayment', code, paymentId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room || data.rooms.find((r) => r.code === code) || null;
    }
  } catch (err) {
    console.warn('Backend approvePayment error:', err);
  }

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === code);
  if (target && target.settlementHistory) {
    const item = target.settlementHistory.find((p) => p.id === paymentId);
    if (item) {
      item.status = 'PAID';
      item.verifiedAt = new Date().toISOString();
      saveAllRooms(rooms);
    }
  }
  return target || null;
}

export async function declineSettlementPayment(code: string, paymentId: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room?: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'declinePayment', code, paymentId }),
    });
    if (data.success && Array.isArray(data.rooms)) {
      saveAllRooms(data.rooms);
      return data.room || data.rooms.find((r) => r.code === code) || null;
    }
  } catch (err) {
    console.warn('Backend declinePayment error:', err);
  }

  const rooms = getAllRooms();
  const target = rooms.find((r) => r && r.code === code);
  if (target && target.settlementHistory) {
    const item = target.settlementHistory.find((p) => p.id === paymentId);
    if (item) {
      item.status = 'DECLINED';
      item.declinedAt = new Date().toISOString();
      saveAllRooms(rooms);
    }
  }
  return target || null;
}

// Helper to get pending payment claims where the current user is the receiver
export function getPendingReceivedPayments(userId: string, userName?: string): (SettlementHistoryItem & { roomCode: string; roomName: string })[] {
  if (!userId && !userName) return [];
  const rooms = getAllRooms();
  const results: (SettlementHistoryItem & { roomCode: string; roomName: string })[] = [];

  rooms.forEach((room) => {
    if (!room || !Array.isArray(room.settlementHistory)) return;
    room.settlementHistory.forEach((p) => {
      if (!p || p.status !== 'PENDING') return;
      const isRecipient =
        (userId && p.toId === userId) ||
        (userName && p.toName && p.toName.toLowerCase() === userName.toLowerCase()) ||
        (userId && p.toName && p.toName.toLowerCase() === userId.toLowerCase());
      if (isRecipient) {
        results.push({
          ...p,
          roomCode: room.code,
          roomName: room.name,
        });
      }
    });
  });

  return results;
}

// Helper to get payment claims sent by the current user that are pending
export function getPendingSentPayments(userId: string, userName?: string): (SettlementHistoryItem & { roomCode: string; roomName: string })[] {
  if (!userId && !userName) return [];
  const rooms = getAllRooms();
  const results: (SettlementHistoryItem & { roomCode: string; roomName: string })[] = [];

  rooms.forEach((room) => {
    if (!room || !Array.isArray(room.settlementHistory)) return;
    room.settlementHistory.forEach((p) => {
      if (!p || p.status !== 'PENDING') return;
      const isSender =
        (userId && p.fromId === userId) ||
        (userName && p.fromName && p.fromName.toLowerCase() === userName.toLowerCase()) ||
        (userId && p.fromName && p.fromName.toLowerCase() === userId.toLowerCase());
      if (isSender) {
        results.push({
          ...p,
          roomCode: room.code,
          roomName: room.name,
        });
      }
    });
  });

  return results;
}

export async function markSettlementPaid(code: string, settlementData: Settlement): Promise<Room | null> {
  return claimSettlementPaid(code, settlementData);
}

// 1. Direct Pairwise Settlement Algorithm
// Calculates exact direct debts between who actually paid and who participated in that expense
export function calculateDirectSettlements(room: Room | null): Settlement[] {
  if (!room) return [];
  const members = Array.isArray(room.members) ? room.members : [];
  const expenses = Array.isArray(room.expenses) ? room.expenses : [];
  if (members.length === 0) return [];

  const approvedMembers = members.filter((m) => m && (m.status === 'approved' || !m.status));
  if (approvedMembers.length === 0) return [];

  const memberIdMap: Record<string, string> = {};
  approvedMembers.forEach((m) => {
    if (m && m.id) {
      memberIdMap[m.id] = m.id;
      if (m.name) memberIdMap[m.name.trim().toLowerCase()] = m.id;
    }
  });

  const resolveMemberId = (identifier: string): string | null => {
    if (!identifier) return null;
    if (memberIdMap[identifier]) return memberIdMap[identifier];
    const lower = identifier.trim().toLowerCase();
    if (memberIdMap[lower]) return memberIdMap[lower];
    return null;
  };

  // Pairwise debt matrix: pairwiseDebt[debtorId][creditorId] = amount owed
  const pairwiseDebt: Record<string, Record<string, number>> = {};
  approvedMembers.forEach((m1) => {
    pairwiseDebt[m1.id] = {};
    approvedMembers.forEach((m2) => {
      pairwiseDebt[m1.id][m2.id] = 0;
    });
  });

  const groupExpenses = expenses.filter((e) => e && !e.isPersonal);

  groupExpenses.forEach((exp) => {
    const paidById = resolveMemberId(exp.paidBy) || (exp.paidByName ? resolveMemberId(exp.paidByName) : null);
    const amount = Number(exp.amount) || 0;
    if (!paidById || amount <= 0) return;

    if (exp.splitType === 'custom' && exp.customSplits && typeof exp.customSplits === 'object') {
      Object.keys(exp.customSplits).forEach((mKey) => {
        const debtorId = resolveMemberId(mKey);
        const share = Math.round((Number(exp.customSplits![mKey]) || 0) * 100) / 100;
        if (debtorId && debtorId !== paidById && pairwiseDebt[debtorId] && pairwiseDebt[debtorId][paidById] !== undefined) {
          pairwiseDebt[debtorId][paidById] = Math.round((pairwiseDebt[debtorId][paidById] + share) * 100) / 100;
        }
      });
    } else {
      const splitAmongInput = Array.isArray(exp.splitAmong) && exp.splitAmong.length > 0
        ? exp.splitAmong
        : approvedMembers.map((m) => m.id);

      const validSplitIds: string[] = [];
      splitAmongInput.forEach((key) => {
        const id = resolveMemberId(key);
        if (id && !validSplitIds.includes(id)) {
          validSplitIds.push(id);
        }
      });

      const effectiveSplit = validSplitIds.length > 0 ? validSplitIds : approvedMembers.map((m) => m.id);
      if (effectiveSplit.length > 0) {
        const share = Math.round((amount / effectiveSplit.length) * 100) / 100;
        effectiveSplit.forEach((debtorId) => {
          if (debtorId !== paidById && pairwiseDebt[debtorId] && pairwiseDebt[debtorId][paidById] !== undefined) {
            pairwiseDebt[debtorId][paidById] = Math.round((pairwiseDebt[debtorId][paidById] + share) * 100) / 100;
          }
        });
      }
    }
  });

  // Apply completed settlement payments history directly between pairs
  const settlementHistory = Array.isArray(room.settlementHistory) ? room.settlementHistory : [];
  settlementHistory.forEach((payment) => {
    if (payment && payment.status === 'PAID') {
      const fromId = resolveMemberId(payment.fromId) || resolveMemberId(payment.fromName);
      const toId = resolveMemberId(payment.toId) || resolveMemberId(payment.toName);
      const amount = Math.round((Number(payment.amount) || 0) * 100) / 100;

      if (fromId && toId && pairwiseDebt[fromId] && pairwiseDebt[fromId][toId] !== undefined) {
        pairwiseDebt[fromId][toId] = Math.round((pairwiseDebt[fromId][toId] - amount) * 100) / 100;
      }
    }
  });

  // Net out pairwise debts between each pair (A, B)
  const settlements: Settlement[] = [];
  const memberList = approvedMembers;

  for (let a = 0; a < memberList.length; a++) {
    for (let b = a + 1; b < memberList.length; b++) {
      const idA = memberList[a].id;
      const idB = memberList[b].id;
      const debtAtoB = pairwiseDebt[idA]?.[idB] || 0;
      const debtBtoA = pairwiseDebt[idB]?.[idA] || 0;

      const net = Math.round((debtAtoB - debtBtoA) * 100) / 100;

      if (net > 0.01) {
        settlements.push({
          fromId: idA,
          fromName: memberList[a].name,
          toId: idB,
          toName: memberList[b].name,
          amount: net,
        });
      } else if (net < -0.01) {
        settlements.push({
          fromId: idB,
          fromName: memberList[b].name,
          toId: idA,
          toName: memberList[a].name,
          amount: Math.abs(net),
        });
      }
    }
  }

  return settlements;
}

// 2. Minimum Cash Flow Settlement Algorithm (Optimized Global Transfers)
export function calculateSimplifiedSettlements(room: Room | null): Settlement[] {
  if (!room) return [];
  const members = Array.isArray(room.members) ? room.members : [];
  const expenses = Array.isArray(room.expenses) ? room.expenses : [];
  if (members.length === 0) return [];

  const approvedMembers = members.filter((m) => m && (m.status === 'approved' || !m.status));
  if (approvedMembers.length === 0) return [];

  const balances: Record<string, number> = {};
  const memberIdMap: Record<string, string> = {};

  approvedMembers.forEach((m) => {
    if (m && m.id) {
      balances[m.id] = 0;
      memberIdMap[m.id] = m.id;
      if (m.name) {
        memberIdMap[m.name.trim().toLowerCase()] = m.id;
      }
    }
  });

  const resolveMemberId = (identifier: string): string | null => {
    if (!identifier) return null;
    if (balances[identifier] !== undefined) return identifier;
    const lower = identifier.trim().toLowerCase();
    if (memberIdMap[lower] && balances[memberIdMap[lower]] !== undefined) {
      return memberIdMap[lower];
    }
    return null;
  };

  const groupExpenses = expenses.filter((e) => e && !e.isPersonal);

  groupExpenses.forEach((exp) => {
    const paidById = resolveMemberId(exp.paidBy) || (exp.paidByName ? resolveMemberId(exp.paidByName) : null);
    const amount = Number(exp.amount) || 0;

    if (exp.splitType === 'custom' && exp.customSplits && typeof exp.customSplits === 'object') {
      if (paidById && balances[paidById] !== undefined) {
        balances[paidById] += amount;
      }
      Object.keys(exp.customSplits).forEach((mKey) => {
        const targetId = resolveMemberId(mKey);
        const share = Number(exp.customSplits![mKey]) || 0;
        if (targetId && balances[targetId] !== undefined) {
          balances[targetId] -= share;
        }
      });
    } else {
      const splitAmongInput = Array.isArray(exp.splitAmong) && exp.splitAmong.length > 0
        ? exp.splitAmong
        : approvedMembers.map((m) => m.id);

      const validSplitIds: string[] = [];
      splitAmongInput.forEach((key) => {
        const id = resolveMemberId(key);
        if (id && !validSplitIds.includes(id)) {
          validSplitIds.push(id);
        }
      });

      const effectiveSplit = validSplitIds.length > 0 ? validSplitIds : approvedMembers.map((m) => m.id);

      if (effectiveSplit.length > 0) {
        const share = amount / effectiveSplit.length;
        if (paidById && balances[paidById] !== undefined) {
          balances[paidById] += amount;
        }
        effectiveSplit.forEach((memberId) => {
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
      const fromId = resolveMemberId(payment.fromId) || resolveMemberId(payment.fromName);
      const toId = resolveMemberId(payment.toId) || resolveMemberId(payment.toName);
      const amount = Number(payment.amount) || 0;

      if (fromId && balances[fromId] !== undefined) {
        balances[fromId] += amount;
      }
      if (toId && balances[toId] !== undefined) {
        balances[toId] -= amount;
      }
    }
  });

  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];

  Object.keys(balances).forEach((memberId) => {
    const rawBal = balances[memberId];
    const bal = Math.round(rawBal * 100) / 100;
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

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const minAmount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    if (minAmount > 0.01) {
      settlements.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: minAmount,
      });
    }

    debtor.amount = Math.round((debtor.amount - minAmount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - minAmount) * 100) / 100;

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return settlements;
}

// Master settlement calculator: defaults to 'direct' pairwise settlements (no third-party debt redirection)
export function calculateSettlements(room: Room | null, mode: 'direct' | 'simplified' = 'direct'): Settlement[] {
  if (mode === 'simplified') {
    return calculateSimplifiedSettlements(room);
  }
  return calculateDirectSettlements(room);
}

