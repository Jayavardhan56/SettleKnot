import { fetchApi } from './api.js';

const AUTH_USER_KEY = 'settleknot_current_user';
const AUTH_ACCOUNTS_KEY = 'settleknot_user_accounts';
const LAST_ACTIVITY_KEY = 'settleknot_last_activity';

export function updateLastActivity() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export function getLastActivity() {
  if (typeof window === 'undefined') return Date.now();
  const stored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : Date.now();
}

export function checkSessionExpired(maxIdleMs = 15 * 60 * 1000) {
  if (typeof window === 'undefined') return false;
  const currentUser = getStoredCurrentUser();
  if (!currentUser) return false;
  const lastAct = getLastActivity();
  return Date.now() - lastAct > maxIdleMs;
}

export function getStoredAccounts() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(AUTH_ACCOUNTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (err) {
    return [];
  }
}

export function saveStoredAccounts(accounts) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getStoredCurrentUser() {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (err) {
    return null;
  }
}

export function saveStoredCurrentUser(user) {
  if (typeof window === 'undefined') return;
  if (!user) {
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  } else {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    updateLastActivity();
  }
}

export async function loginUser(email, password) {
  try {
    const data = await fetchApi('/api/auth', {
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

export async function registerUser(name, email, password) {
  try {
    const data = await fetchApi('/api/auth', {
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
    const newUser = {
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

export function logoutAccount() {
  saveStoredCurrentUser(null);
}

export async function syncServerAccounts() {
  try {
    const data = await fetchApi('/api/auth');
    if (data.success && Array.isArray(data.accounts)) {
      saveStoredAccounts(data.accounts);
      return data.accounts;
    }
    return getStoredAccounts();
  } catch (err) {
    return getStoredAccounts();
  }
}

import { saveAllRooms } from './store.js';

export async function deleteUserAccount(userId) {
  try {
    const data = await fetchApi('/api/auth', {
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
