import { fetchApi } from './api';
import { saveAllRooms } from './store';
import { User, Room } from '../types';

const AUTH_USER_KEY = 'settleknot_current_user';
const AUTH_ACCOUNTS_KEY = 'settleknot_user_accounts';
const LAST_ACTIVITY_KEY = 'settleknot_last_activity';

export function updateLastActivity(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now().toString();
  localStorage.setItem(LAST_ACTIVITY_KEY, now);
  sessionStorage.setItem(LAST_ACTIVITY_KEY, now);
}

export function getLastActivity(): number {
  if (typeof window === 'undefined') return Date.now();
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY) || sessionStorage.getItem(LAST_ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : Date.now();
}

// Mobile and PWA persistent sessions (30-day default inactivity limit)
export function checkSessionExpired(maxIdleMs: number = 30 * 24 * 60 * 60 * 1000): boolean {
  if (typeof window === 'undefined') return false;
  const currentUser = getStoredCurrentUser();
  if (!currentUser) return false;
  const lastAct = getLastActivity();
  return Date.now() - lastAct > maxIdleMs;
}

export function getStoredAccounts(): User[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(AUTH_ACCOUNTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (err) {
    return [];
  }
}

export function saveStoredAccounts(accounts: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getStoredCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (err) {
    return null;
  }
}

export function saveStoredCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  } else {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    updateLastActivity();
  }
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const data = await fetchApi<{ success: boolean; account?: User; error?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', email, password }),
    });

    if (data.success && data.account) {
      saveStoredCurrentUser(data.account);
      return { success: true, user: data.account };
    }
    return { success: false, error: data.error || 'Login failed' };
  } catch (err) {
    // Local fallback
    const accounts = getStoredAccounts();
    const target = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!target) return { success: false, error: 'No account found with this email' };
    if (target.password !== password) return { success: false, error: 'Incorrect password' };
    saveStoredCurrentUser(target);
    return { success: true, user: target };
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const data = await fetchApi<{ success: boolean; account?: User; error?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', name, email, password }),
    });

    if (data.success && data.account) {
      saveStoredCurrentUser(data.account);
      const accounts = getStoredAccounts();
      accounts.push(data.account);
      saveStoredAccounts(accounts);
      return { success: true, user: data.account };
    }
    return { success: false, error: data.error || 'Registration failed' };
  } catch (err) {
    const avatars = ['🦊', '🐼', '🦁', '🐻', '🐯', '🐨', '🦄'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      avatar: randomAvatar,
      createdAt: new Date().toISOString(),
      isAdmin: email.trim().toLowerCase() === 'settleknot@admin.in',
    };
    const accounts = getStoredAccounts();
    accounts.push(newUser);
    saveStoredAccounts(accounts);
    saveStoredCurrentUser(newUser);
    return { success: true, user: newUser };
  }
}

export function logoutAccount(): void {
  saveStoredCurrentUser(null);
  if (typeof window !== 'undefined') {
    try {
      window.history.pushState(null, '', '#/');
    } catch (_) {}
    window.location.replace('#/');
  }
}

export async function syncServerAccounts(): Promise<User[]> {
  try {
    const data = await fetchApi<{ success: boolean; accounts: User[] }>('/api/auth');
    if (data.success && Array.isArray(data.accounts)) {
      saveStoredAccounts(data.accounts);
      return data.accounts;
    }
    return getStoredAccounts();
  } catch (err) {
    return getStoredAccounts();
  }
}

export async function deleteUserAccount(userId: string): Promise<User[]> {
  try {
    const data = await fetchApi<{ success: boolean; accounts: User[]; rooms: Room[] }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', userId }),
    });
    if (data.success && Array.isArray(data.accounts)) {
      saveStoredAccounts(data.accounts);
      if (Array.isArray(data.rooms)) {
        saveAllRooms(data.rooms);
      }
      return data.accounts;
    }
  } catch (err) {
    console.warn('Backend delete error:', err);
  }
  const accounts = getStoredAccounts().filter((a) => a && a.id !== userId);
  saveStoredAccounts(accounts);
  return accounts;
}
