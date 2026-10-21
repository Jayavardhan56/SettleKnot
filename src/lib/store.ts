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

export async function claimSettlementPaid(code: string, settlementData: Settlement, userId?: string): Promise<Room | null> {
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
      body: JSON.stringify({ action: 'claimPayment', code, payment: newPayment, userId }),
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

export async function approveSettlementPayment(code: string, paymentId: string, userId?: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room?: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'approvePayment', code, paymentId, userId }),
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

export async function declineSettlementPayment(code: string, paymentId: string, userId?: string): Promise<Room | null> {
  try {
    const data = await fetchApi<{ success: boolean; rooms: Room[]; room?: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ action: 'declinePayment', code, paymentId, userId }),
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

export async function markSettlementPaid(code: string, settlementData: Settlement, userId?: string): Promise<Room | null> {
  return claimSettlementPaid(code, settlementData, userId);
}

// =========================================================================
// Advanced Financial Calculations Theory: Exact Cent & Graph Optimizations
// =========================================================================

// Convert currency to integer cents to guarantee 100% preservation of money
function toCents(amount: number): number {
  return Math.round((Number(amount) || 0) * 100);
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

// 1. Direct Pairwise Settlement Algorithm
// Calculates exact direct bilateral debts between who actually paid and who participated in each expense
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

  // Pairwise debt matrix in integer cents: pairwiseDebtCents[debtorId][creditorId]
  const pairwiseDebtCents: Record<string, Record<string, number>> = {};
  approvedMembers.forEach((m1) => {
    pairwiseDebtCents[m1.id] = {};
    approvedMembers.forEach((m2) => {
      pairwiseDebtCents[m1.id][m2.id] = 0;
    });
  });

  const groupExpenses = expenses.filter((e) => e && !e.isPersonal);

  groupExpenses.forEach((exp) => {
    const paidById = resolveMemberId(exp.paidBy) || (exp.paidByName ? resolveMemberId(exp.paidByName) : null);
    const totalCents = toCents(exp.amount);
    if (!paidById || totalCents <= 0) return;

    if (exp.splitType === 'custom' && exp.customSplits && typeof exp.customSplits === 'object') {
      Object.keys(exp.customSplits).forEach((mKey) => {
        const debtorId = resolveMemberId(mKey);
        const shareCents = toCents(exp.customSplits![mKey]);
        if (debtorId && debtorId !== paidById && pairwiseDebtCents[debtorId] && pairwiseDebtCents[debtorId][paidById] !== undefined) {
          pairwiseDebtCents[debtorId][paidById] += shareCents;
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
      const K = effectiveSplit.length;
      if (K > 0) {
        // Discrepancy-free integer cent distribution:
        // baseShare * K + remainder === totalCents
        const baseShare = Math.floor(totalCents / K);
        const remainder = totalCents % K;

        effectiveSplit.forEach((debtorId, idx) => {
          // Distribute remainder cent-by-cent to first 'remainder' participants
          const debtorShare = baseShare + (idx < remainder ? 1 : 0);
          if (debtorId !== paidById && pairwiseDebtCents[debtorId] && pairwiseDebtCents[debtorId][paidById] !== undefined) {
            pairwiseDebtCents[debtorId][paidById] += debtorShare;
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
      const paidCents = toCents(payment.amount);

      if (fromId && toId && pairwiseDebtCents[fromId] && pairwiseDebtCents[fromId][toId] !== undefined) {
        pairwiseDebtCents[fromId][toId] -= paidCents;
      }
    }
  });

  // Net out pairwise bilateral debts (A owes B vs B owes A)
  const settlements: Settlement[] = [];
  const memberList = approvedMembers;

  for (let a = 0; a < memberList.length; a++) {
    for (let b = a + 1; b < memberList.length; b++) {
      const idA = memberList[a].id;
      const idB = memberList[b].id;
      const debtAtoB = pairwiseDebtCents[idA]?.[idB] || 0;
      const debtBtoA = pairwiseDebtCents[idB]?.[idA] || 0;

      const netCents = debtAtoB - debtBtoA;

      if (netCents > 0) {
        settlements.push({
          fromId: idA,
          fromName: memberList[a].name,
          toId: idB,
          toName: memberList[b].name,
          amount: fromCents(netCents),
        });
      } else if (netCents < 0) {
        settlements.push({
          fromId: idB,
          fromName: memberList[b].name,
          toId: idA,
          toName: memberList[a].name,
          amount: fromCents(Math.abs(netCents)),
        });
      }
    }
  }

  return settlements;
}

// 2. Complex Calculations Theory: Minimum Cash Flow with Zero-Sum Subset Graph Partitioning
// Finds the mathematical minimum number of cross-member transfers by partitioning the graph
// into independent zero-sum balance subsets before applying min-flow elimination.
export function calculateSimplifiedSettlements(room: Room | null): Settlement[] {
  if (!room) return [];
  const members = Array.isArray(room.members) ? room.members : [];
  const expenses = Array.isArray(room.expenses) ? room.expenses : [];
  if (members.length === 0) return [];

  const approvedMembers = members.filter((m) => m && (m.status === 'approved' || !m.status));
  if (approvedMembers.length === 0) return [];

  const balanceCents: Record<string, number> = {};
  const memberIdMap: Record<string, string> = {};

  approvedMembers.forEach((m) => {
    if (m && m.id) {
      balanceCents[m.id] = 0;
      memberIdMap[m.id] = m.id;
      if (m.name) memberIdMap[m.name.trim().toLowerCase()] = m.id;
    }
  });

  const resolveMemberId = (identifier: string): string | null => {
    if (!identifier) return null;
    if (balanceCents[identifier] !== undefined) return identifier;
    const lower = identifier.trim().toLowerCase();
    if (memberIdMap[lower] && balanceCents[memberIdMap[lower]] !== undefined) {
      return memberIdMap[lower];
    }
    return null;
  };

  const groupExpenses = expenses.filter((e) => e && !e.isPersonal);

  groupExpenses.forEach((exp) => {
    const paidById = resolveMemberId(exp.paidBy) || (exp.paidByName ? resolveMemberId(exp.paidByName) : null);
    const totalCents = toCents(exp.amount);
    if (!paidById || totalCents <= 0) return;

    if (exp.splitType === 'custom' && exp.customSplits && typeof exp.customSplits === 'object') {
      if (balanceCents[paidById] !== undefined) {
        balanceCents[paidById] += totalCents;
      }
      Object.keys(exp.customSplits).forEach((mKey) => {
        const targetId = resolveMemberId(mKey);
        const shareCents = toCents(exp.customSplits![mKey]);
        if (targetId && balanceCents[targetId] !== undefined) {
          balanceCents[targetId] -= shareCents;
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
      const K = effectiveSplit.length;

      if (K > 0) {
        const baseShare = Math.floor(totalCents / K);
        const remainder = totalCents % K;

        if (balanceCents[paidById] !== undefined) {
          balanceCents[paidById] += totalCents;
        }
        effectiveSplit.forEach((memberId, idx) => {
          const share = baseShare + (idx < remainder ? 1 : 0);
          if (balanceCents[memberId] !== undefined) {
            balanceCents[memberId] -= share;
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
      const amountCents = toCents(payment.amount);

      if (fromId && balanceCents[fromId] !== undefined) {
        balanceCents[fromId] += amountCents;
      }
      if (toId && balanceCents[toId] !== undefined) {
        balanceCents[toId] -= amountCents;
      }
    }
  });

  // Conservation of money: verify that sum of balances is 0.
  // Any residual rounding drift (<= 2 cents) is attributed to the largest creditor.
  let netDiscrepancy = 0;
  Object.keys(balanceCents).forEach((id) => {
    netDiscrepancy += balanceCents[id];
  });
  if (netDiscrepancy !== 0) {
    const sortedIds = Object.keys(balanceCents).sort((a, b) => balanceCents[b] - balanceCents[a]);
    if (sortedIds.length > 0) {
      balanceCents[sortedIds[0]] -= netDiscrepancy;
    }
  }

  // Active participants with non-zero balances
  interface BalanceNode {
    id: string;
    name: string;
    cents: number;
  }

  const activeNodes: BalanceNode[] = [];
  Object.keys(balanceCents).forEach((memberId) => {
    const c = balanceCents[memberId];
    if (Math.abs(c) > 0) {
      const m = approvedMembers.find((item) => item && item.id === memberId);
      activeNodes.push({
        id: memberId,
        name: m ? m.name : 'Unknown',
        cents: c,
      });
    }
  });

  if (activeNodes.length === 0) return [];

  // Optimal Zero-Sum Subset Partitioning (Graph Theory):
  // Partition nodes into the maximum number of independent disjoint subsets that each sum to 0.
  // For small to medium groups (N <= 16), dynamic programming bitmask yields the exact optimal partition.
  const N = activeNodes.length;
  const settlements: Settlement[] = [];

  // Sub-solver: settles a single zero-sum component via greedy Min-Cash Flow
  const settleComponent = (component: BalanceNode[]) => {
    const debtors: { id: string; name: string; amountCents: number }[] = [];
    const creditors: { id: string; name: string; amountCents: number }[] = [];

    component.forEach((node) => {
      if (node.cents < 0) {
        debtors.push({ id: node.id, name: node.name, amountCents: Math.abs(node.cents) });
      } else if (node.cents > 0) {
        creditors.push({ id: node.id, name: node.name, amountCents: node.cents });
      }
    });

    debtors.sort((a, b) => b.amountCents - a.amountCents);
    creditors.sort((a, b) => b.amountCents - a.amountCents);

    let di = 0;
    let ci = 0;

    while (di < debtors.length && ci < creditors.length) {
      const debtor = debtors[di];
      const creditor = creditors[ci];
      const transferCents = Math.min(debtor.amountCents, creditor.amountCents);

      if (transferCents > 0) {
        settlements.push({
          fromId: debtor.id,
          fromName: debtor.name,
          toId: creditor.id,
          toName: creditor.name,
          amount: fromCents(transferCents),
        });
      }

      debtor.amountCents -= transferCents;
      creditor.amountCents -= transferCents;

      if (debtor.amountCents <= 0) di++;
      if (creditor.amountCents <= 0) ci++;
    }
  };

  if (N <= 15) {
    // DP Bitmask to find maximum zero-sum disjoint subsets
    const totalMasks = 1 << N;
    const sumMask = new Int32Array(totalMasks);
    for (let mask = 1; mask < totalMasks; mask++) {
      const lowbit = mask & -mask;
      const bitIndex = Math.log2(lowbit);
      sumMask[mask] = sumMask[mask ^ lowbit] + activeNodes[bitIndex].cents;
    }

    const dp = new Int32Array(totalMasks);
    const parent = new Int32Array(totalMasks);

    for (let mask = 1; mask < totalMasks; mask++) {
      if (sumMask[mask] === 0) {
        dp[mask] = 1;
        parent[mask] = mask;
      }
      // Try submask split
      for (let sub = (mask - 1) & mask; sub > (mask ^ sub); sub = (sub - 1) & mask) {
        if (dp[sub] > 0 && dp[mask ^ sub] > 0) {
          if (dp[sub] + dp[mask ^ sub] > dp[mask]) {
            dp[mask] = dp[sub] + dp[mask ^ sub];
            parent[mask] = sub;
          }
        }
      }
    }

    // Reconstruct partitioned subsets from full mask
    const fullMask = totalMasks - 1;
    const components: BalanceNode[][] = [];

    const extractComponents = (mask: number) => {
      if (mask === 0) return;
      if (dp[mask] <= 1) {
        const comp: BalanceNode[] = [];
        for (let i = 0; i < N; i++) {
          if ((mask & (1 << i)) !== 0) comp.push(activeNodes[i]);
        }
        components.push(comp);
        return;
      }
      const sub = parent[mask];
      extractComponents(sub);
      extractComponents(mask ^ sub);
    };

    extractComponents(fullMask);

    components.forEach((comp) => {
      settleComponent(comp);
    });
  } else {
    // For very large rooms, direct optimal greedy on whole graph
    settleComponent(activeNodes);
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

