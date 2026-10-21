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

export async function signInWithGoogle(profile: { name: string; email: string; avatar?: string; id?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const data = await fetchApi<{ success: boolean; account?: User; error?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'google-auth',
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        googleId: profile.id,
      }),
    });

    if (data.success && data.account) {
      saveStoredCurrentUser(data.account);
      const accounts = getStoredAccounts();
      const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === data.account!.email.toLowerCase());
      if (existingIdx >= 0) accounts[existingIdx] = data.account;
      else accounts.push(data.account);
      saveStoredAccounts(accounts);
      return { success: true, user: data.account };
    }
    return { success: false, error: data.error || 'Google sign in failed.' };
  } catch (err: any) {
    // Local fallback for offline mode
    const accounts = getStoredAccounts();
    let account = accounts.find((a) => a.email.toLowerCase() === profile.email.toLowerCase());
    if (!account) {
      account = {
        id: `usr_g_${Date.now()}`,
        name: profile.name,
        email: profile.email.toLowerCase(),
        avatar: profile.avatar || '🌐',
        createdAt: new Date().toISOString(),
        isGoogleAuth: true,
        isAdmin: profile.email.toLowerCase() === 'settleknot@admin.in',
      };
      accounts.push(account);
      saveStoredAccounts(accounts);
    }
    saveStoredCurrentUser(account);
    return { success: true, user: account };
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message?: string; resetLink?: string; previewUrl?: string; error?: string }> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const data = await fetchApi<{ success: boolean; message?: string; resetLink?: string; previewUrl?: string; error?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'forgot-password', email, origin }),
    });
    return data;
  } catch (err: any) {
    // Local fallback
    const accounts = getStoredAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account) {
      return { success: false, error: 'No user account found with this email address.' };
    }
    const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
    account.resetPasswordToken = token;
    account.resetPasswordExpires = Date.now() + 3600000;
    saveStoredAccounts(accounts);
    const link = `${window.location.origin}/#/reset-password?token=${token}&email=${encodeURIComponent(account.email)}`;
    return {
      success: true,
      message: `Password reset link generated for ${email}. Check link below.`,
      resetLink: link,
    };
  }
}

export async function verifyResetToken(token: string, email: string): Promise<{ success: boolean; error?: string; name?: string; email?: string }> {
  try {
    const data = await fetchApi<{ success: boolean; error?: string; name?: string; email?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify-reset-token', token, email }),
    });
    return data;
  } catch (err: any) {
    const accounts = getStoredAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account || account.resetPasswordToken !== token) {
      return { success: false, error: 'Invalid or expired password reset link.' };
    }
    if (account.resetPasswordExpires && Date.now() > account.resetPasswordExpires) {
      return { success: false, error: 'Password reset link has expired.' };
    }
    return { success: true, email: account.email, name: account.name };
  }
}

export async function resetUserPassword(token: string, email: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const data = await fetchApi<{ success: boolean; message?: string; error?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset-password', token, email, newPassword }),
    });
    return data;
  } catch (err: any) {
    const accounts = getStoredAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account || account.resetPasswordToken !== token) {
      return { success: false, error: 'Invalid or expired password reset link.' };
    }
    account.password = newPassword;
    delete account.resetPasswordToken;
    delete account.resetPasswordExpires;
    saveStoredAccounts(accounts);
    return { success: true, message: 'Password updated successfully! You can now log in.' };
  }
}
