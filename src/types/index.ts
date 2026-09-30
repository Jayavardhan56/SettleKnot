export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  createdAt?: string;
  isAdmin?: boolean;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  isHost?: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'blocked' | string;
}

export type ExpenseCategory = 'food' | 'stay' | 'travel' | 'activities' | 'general';
export type SplitType = 'equal' | 'custom' | 'personal';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory | string;
  paidBy: string;
  isPersonal: boolean;
  splitType: SplitType | string;
  splitAmong?: string[];
  customSplits?: Record<string, number> | null;
  notes?: string;
  timestamp?: string;
  dateFormatted?: string;
  timeFormatted?: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked' | string;
  rejectionsCount?: number;
  createdAt?: string;
  roomCode?: string;
  roomName?: string;
}

export interface UserSentJoinRequest {
  requestId: string;
  roomCode: string;
  roomName: string;
  hostName: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked' | string;
  rejectionsCount: number;
  createdAt?: string;
}

export interface Settlement {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface SettlementHistoryItem {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  dateFormatted?: string;
  timeFormatted?: string;
  timestamp?: string;
  status: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  currency: string;
  hostId: string;
  createdAt: string;
  joinRequests: JoinRequest[];
  members: Member[];
  expenses: Expense[];
  settlementHistory?: SettlementHistoryItem[];
  userRejections?: Record<string, number>;
}

export interface RouteState {
  view: 'landing' | 'dashboard' | 'room' | 'notifications' | 'auth' | 'admin';
  param: string | null;
}
