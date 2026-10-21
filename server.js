import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Cloud Database Credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ANSI Color Log Helper
function logEvent(tag, message, meta = '') {
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`\x1b[36m[${time}]\x1b[0m \x1b[33m[${tag}]\x1b[0m ${message}`, meta ? meta : '');
}

// Mailer Helper for Password Reset Emails
async function sendResetPasswordEmail(recipientEmail, recipientName, resetLink) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || process.env.GMAIL_PASSWORD;

  let transporter = null;
  let fromAddress = process.env.SMTP_FROM || (smtpUser ? `"SettleKnot Support" <${smtpUser}>` : '"SettleKnot App" <no-reply@settleknot.com>');
  let emailSent = false;
  let previewUrl = null;

  try {
    if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else {
      // Create ethereal test account for dev preview
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        fromAddress = `"SettleKnot Support" <${testAccount.user}>`;
      } catch (e) {
        logEvent('MAIL WARN', 'Ethereal creation skipped, using console logging fallback.');
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #d97706 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .logo { font-size: 38px; margin-bottom: 6px; }
          .title { font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
          .subtitle { font-size: 13px; opacity: 0.9; margin-top: 4px; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #d97706 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35); }
          .link-box { font-size: 11px; color: #64748b; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 16px; }
          .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; text-align: center; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">⚡</div>
            <h1 class="title">Reset Your Password</h1>
            <div class="subtitle">SettleKnot Group Trip Expense Platform</div>
          </div>
          <div class="content">
            <p class="greeting">Hi ${recipientName || 'Traveler'},</p>
            <p class="text">We received a request to reset the password for your SettleKnot account (<strong>${recipientEmail}</strong>). Click the secure link below to set a new password:</p>
            <div class="btn-container">
              <a href="${resetLink}" class="btn" target="_blank">Set New Password 🔒</a>
            </div>
            <p class="text" style="font-size: 12px; margin-bottom: 6px;">Or paste this link into your browser:</p>
            <div class="link-box">${resetLink}</div>
            <p class="text" style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This link is valid for 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            © 2026 SettleKnot • Group Trip Expenses & Smart Settlement
          </div>
        </div>
      </body>
      </html>
    `;

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject: '🔒 Reset Your SettleKnot Password',
        text: `Reset your SettleKnot password by clicking this link: ${resetLink} (Link expires in 1 hour)`,
        html: htmlContent,
      });
      emailSent = true;
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      logEvent('MAIL SENT', `Password reset email dispatched to ${recipientEmail}`);
      if (previewUrl) {
        logEvent('MAIL PREVIEW', `Ethereal Email Preview: ${previewUrl}`);
      }
    }
  } catch (err) {
    logEvent('MAIL ERROR', `Could not dispatch email: ${err.message}`);
  }

  // Clear display in server console
  console.log('\n\x1b[43m\x1b[30m ===================== PASSWORD RESET LINK ===================== \x1b[0m');
  console.log(`\x1b[33mRecipient:\x1b[0m  ${recipientEmail}`);
  console.log(`\x1b[32mReset URL:\x1b[0m  ${resetLink}`);
  if (previewUrl) {
    console.log(`\x1b[36mPreview URL:\x1b[0m ${previewUrl}`);
  }
  console.log('\x1b[43m\x1b[30m =============================================================== \x1b[0m\n');

  return { emailSent, previewUrl, resetLink };
}

// Request Logger Middleware
app.use((req, res, next) => {
  const action = req.body && req.body.action ? ` | Action: ${req.body.action}` : '';
  logEvent('HTTP REQUEST', `${req.method} ${req.url}${action}`);
  next();
});

// Local JSON File Fallback
const DB_FILE = path.join(__dirname, 'data', 'db.json');

function readLocalDbFile() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { accounts: [], rooms: [] };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
    };
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { accounts: [], rooms: [] };
  }
}

function writeLocalDbFile(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// =========================================================================
// Supabase Cloud Database Integration
// =========================================================================
let supabase = null;
let isSupabaseConnected = false;

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logEvent('DATABASE', 'No SUPABASE_URL and SUPABASE_KEY in environment. Running with local data/db.json storage.');
    return;
  }

  try {
    logEvent('DATABASE', `Connecting to Supabase at: ${SUPABASE_URL}`);
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Test connection by querying accounts table
    const { data, error } = await supabase.from('accounts').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        logEvent('SUPABASE NOTICE', 'PostgreSQL tables "accounts" and "rooms" need to be created in Supabase SQL Editor. See README.md for the 4-line SQL query.');
      } else {
        console.error('\x1b[31m[SUPABASE TEST ERROR]\x1b[0m', error.message);
      }
      isSupabaseConnected = false;
      return;
    }

    isSupabaseConnected = true;
    logEvent('DATABASE SUCCESS', '⚡ Connected to Supabase Cloud Database permanently!');

    // Automatically seed Supabase from local db.json if cloud tables are empty
    await seedSupabaseIfEmpty();
  } catch (err) {
    console.error('\x1b[31m[SUPABASE INIT ERROR]\x1b[0m Failed to connect to Supabase:', err.message);
    logEvent('DATABASE WARN', 'Falling back to local data/db.json storage.');
    isSupabaseConnected = false;
  }
}

async function seedSupabaseIfEmpty() {
  if (!isSupabaseConnected || !supabase) return;
  try {
    const { count: accCount, error: accErr } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
    const { count: roomCount, error: roomErr } = await supabase.from('rooms').select('*', { count: 'exact', head: true });

    if (!accErr && !roomErr && (accCount === 0 || accCount === null) && (roomCount === 0 || roomCount === null)) {
      const local = readLocalDbFile();
      if (local.accounts && local.accounts.length > 0) {
        const rows = local.accounts.map((a) => ({ id: a.id, email: a.email, data: a }));
        await supabase.from('accounts').upsert(rows);
        logEvent('SUPABASE SEED', `Seeded ${local.accounts.length} accounts to Supabase Cloud.`);
      }
      if (local.rooms && local.rooms.length > 0) {
        const rows = local.rooms.map((r) => ({ code: r.code, data: r }));
        await supabase.from('rooms').upsert(rows);
        logEvent('SUPABASE SEED', `Seeded ${local.rooms.length} rooms to Supabase Cloud.`);
      }
    }
  } catch (err) {
    console.error('Error during Supabase seeding:', err);
  }
}

// Unified Database Access Helpers
async function getAccounts() {
  if (isSupabaseConnected && supabase) {
    try {
      const { data, error } = await supabase.from('accounts').select('*');
      if (!error && Array.isArray(data)) {
        return data.map((item) => item.data || item);
      }
      console.warn('Supabase getAccounts error, falling back to local file:', error?.message);
    } catch (err) {
      console.error('Supabase getAccounts exception:', err);
    }
  }
  return readLocalDbFile().accounts;
}

async function saveAccount(account) {
  if (isSupabaseConnected && supabase) {
    try {
      await supabase.from('accounts').upsert({ id: account.id, email: account.email, data: account });
      return;
    } catch (err) {
      console.error('Supabase saveAccount error:', err);
    }
  }
  const db = readLocalDbFile();
  const idx = db.accounts.findIndex((a) => a.id === account.id);
  if (idx >= 0) db.accounts[idx] = account;
  else db.accounts.push(account);
  writeLocalDbFile(db);
}

async function deleteAccount(userId) {
  if (isSupabaseConnected && supabase) {
    try {
      await supabase.from('accounts').delete().eq('id', userId);
      const rooms = await getRooms();
      for (const r of rooms) {
        let modified = false;
        if (Array.isArray(r.members)) {
          const origLen = r.members.length;
          r.members = r.members.filter((m) => m && m.id !== userId);
          if (r.members.length !== origLen) modified = true;
        }
        if (Array.isArray(r.joinRequests)) {
          const origLen = r.joinRequests.length;
          r.joinRequests = r.joinRequests.filter((m) => m && m.userId !== userId);
          if (r.joinRequests.length !== origLen) modified = true;
        }
        if (r.hostId === userId) {
          if (Array.isArray(r.members) && r.members.length > 0) {
            r.hostId = r.members[0].id;
            r.members[0].isHost = true;
          } else {
            r.hostId = '';
          }
          modified = true;
        }
        if (modified) {
          await saveRoom(r);
        }
      }
      return;
    } catch (err) {
      console.error('Supabase deleteAccount error:', err);
    }
  }

  // Local fallback
  const db = readLocalDbFile();
  db.accounts = db.accounts.filter((a) => a && a.id !== userId);
  if (db.rooms) {
    db.rooms.forEach((r) => {
      if (!r) return;
      if (Array.isArray(r.members)) r.members = r.members.filter((m) => m && m.id !== userId);
      if (Array.isArray(r.joinRequests)) r.joinRequests = r.joinRequests.filter((m) => m && m.userId !== userId);
      if (r.hostId === userId) {
        if (Array.isArray(r.members) && r.members.length > 0) {
          r.hostId = r.members[0].id;
          r.members[0].isHost = true;
        } else {
          r.hostId = '';
        }
      }
    });
  }
  writeLocalDbFile(db);
}

async function getRooms() {
  if (isSupabaseConnected && supabase) {
    try {
      const { data, error } = await supabase.from('rooms').select('*');
      if (!error && Array.isArray(data)) {
        return data.map((item) => item.data || item);
      }
      console.warn('Supabase getRooms error, falling back to local file:', error?.message);
    } catch (err) {
      console.error('Supabase getRooms exception:', err);
    }
  }
  return readLocalDbFile().rooms;
}

async function saveRoom(room) {
  if (isSupabaseConnected && supabase) {
    try {
      await supabase.from('rooms').upsert({ code: room.code, data: room });
      return;
    } catch (err) {
      console.error('Supabase saveRoom error:', err);
    }
  }
  const db = readLocalDbFile();
  const idx = db.rooms.findIndex((r) => r.code === room.code);
  if (idx >= 0) db.rooms[idx] = room;
  else db.rooms.push(room);
  writeLocalDbFile(db);
}

async function deleteRoom(code) {
  if (isSupabaseConnected && supabase) {
    try {
      await supabase.from('rooms').delete().eq('code', code);
      return;
    } catch (err) {
      console.error('Supabase deleteRoom error:', err);
    }
  }
  const db = readLocalDbFile();
  db.rooms = db.rooms.filter((r) => r.code !== code);
  writeLocalDbFile(db);
}

async function getFullDb() {
  const [accounts, rooms] = await Promise.all([getAccounts(), getRooms()]);
  return { accounts, rooms };
}

// =========================================================================
// API Routes
// =========================================================================

// Health Check
app.get('/api/health', (req, res) => {
  logEvent('HEALTH', 'System health check request received');
  res.json({
    status: 'ok',
    service: 'SettleKnot Express Backend',
    database: isSupabaseConnected ? 'Supabase (Cloud Permanent)' : 'Local File (data/db.json)',
    isCloudPersistent: isSupabaseConnected,
    timestamp: new Date().toISOString(),
  });
});

// Database Snapshot Export (Admin)
app.get('/api/db', async (req, res) => {
  logEvent('ADMIN', 'Full database snapshot exported');
  const fullData = await getFullDb();
  res.json({
    ...fullData,
    databaseEngine: isSupabaseConnected ? 'Supabase Cloud Database' : 'Local JSON File',
  });
});

// AUTH API
app.get('/api/auth', async (req, res) => {
  const accounts = await getAccounts();
  res.json({ success: true, accounts });
});

app.post('/api/auth', async (req, res) => {
  const { action, name, email, password, userId } = req.body;
  const accounts = await getAccounts();

  if (action === 'login') {
    const account = accounts.find((a) => a.email && a.email.toLowerCase() === (email || '').toLowerCase());
    if (!account) {
      logEvent('AUTH FAILURE', `Login failed - Email not found: '${email}'`);
      return res.status(401).json({ success: false, error: 'No user account found with this email address.' });
    }
    if (account.password !== password) {
      logEvent('AUTH FAILURE', `Login failed - Incorrect password for: '${email}'`);
      return res.status(401).json({ success: false, error: 'Incorrect password. Please verify your credentials.' });
    }
    const token = `sk_tok_${account.id}_${Date.now()}`;
    logEvent('AUTH SUCCESS', `User logged in: '${account.name}' (${account.email})`);
    return res.json({ success: true, account, token });
  }

  if (action === 'register') {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }
    const existing = accounts.find((a) => a.email && a.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      logEvent('AUTH FAILURE', `Registration failed - Email already exists: '${email}'`);
      return res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
    }

    const avatars = ['🦊', '🐼', '🦁', '🐻', '🐯', '🐨', '🦄', '🐲', '🐙'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      avatar: randomAvatar,
      createdAt: new Date().toISOString(),
      isAdmin: email.trim().toLowerCase() === 'settleknot@admin.in',
    };

    await saveAccount(newAccount);
    const token = `sk_tok_${newAccount.id}_${Date.now()}`;
    logEvent('AUTH REGISTER', `New user registered: '${newAccount.name}' (${newAccount.email}) [${isSupabaseConnected ? 'Supabase' : 'Local'}]`);
    return res.json({ success: true, account: newAccount, token });
  }

  if (action === 'delete') {
    const target = accounts.find((a) => a && a.id === userId);
    if (target && target.email && target.email.toLowerCase() === 'settleknot@admin.in') {
      logEvent('ADMIN WARN', `Attempted deletion of System Admin blocked.`);
      return res.status(400).json({ success: false, error: 'System Admin account cannot be deleted.' });
    }

    await deleteAccount(userId);
    logEvent('ADMIN DELETE', `User account deleted: '${target ? target.name : userId}'`);
    const [updatedAccounts, updatedRooms] = await Promise.all([getAccounts(), getRooms()]);
    return res.json({ success: true, accounts: updatedAccounts, rooms: updatedRooms });
  }

  if (action === 'google-auth') {
    const { name: gName, email: gEmail, avatar: gAvatar, googleId } = req.body;
    if (!gEmail) {
      return res.status(400).json({ success: false, error: 'Google account email is required.' });
    }
    const cleanEmail = gEmail.trim().toLowerCase();
    let account = accounts.find((a) => a.email && a.email.toLowerCase() === cleanEmail);

    if (account) {
      if (gAvatar && !account.avatar) {
        account.avatar = gAvatar;
        await saveAccount(account);
      }
      const token = `sk_tok_${account.id}_${Date.now()}`;
      logEvent('AUTH GOOGLE', `Existing user signed in with Google: '${account.name}' (${account.email})`);
      return res.json({ success: true, account, token });
    }

    // New Google user registration
    const avatars = ['🦊', '🐼', '🦁', '🐻', '🐯', '🐨', '🦄', '🐲', '🐙'];
    const chosenAvatar = gAvatar || avatars[Math.floor(Math.random() * avatars.length)];
    const chosenName = (gName || cleanEmail.split('@')[0] || 'Traveler').trim();

    const newAccount = {
      id: `usr_g_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: chosenName,
      email: cleanEmail,
      password: `g_oauth_${Math.random().toString(36).substr(2, 8)}`,
      avatar: chosenAvatar,
      isGoogleAuth: true,
      googleId: googleId || '',
      createdAt: new Date().toISOString(),
      isAdmin: cleanEmail === 'settleknot@admin.in',
    };

    await saveAccount(newAccount);
    const token = `sk_tok_${newAccount.id}_${Date.now()}`;
    logEvent('AUTH GOOGLE', `New Google account created: '${newAccount.name}' (${newAccount.email})`);
    return res.json({ success: true, account: newAccount, token });
  }

  if (action === 'forgot-password') {
    const { email: reqEmail, origin: reqOrigin } = req.body;
    if (!reqEmail) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    const cleanEmail = reqEmail.trim().toLowerCase();
    const account = accounts.find((a) => a.email && a.email.toLowerCase() === cleanEmail);

    if (!account) {
      logEvent('AUTH WARN', `Forgot password requested for non-existent email: '${cleanEmail}'`);
      return res.status(404).json({ success: false, error: 'No user account found with this email address.' });
    }

    // Generate secure 48-char reset token and 1-hour expiration
    const resetToken = crypto.randomBytes(24).toString('hex');
    account.resetPasswordToken = resetToken;
    account.resetPasswordExpires = Date.now() + 3600000; // 1 Hour

    await saveAccount(account);

    const clientOrigin = reqOrigin || req.headers.origin || 'http://localhost:5173';
    const resetLink = `${clientOrigin}/#/reset-password?token=${resetToken}&email=${encodeURIComponent(account.email)}`;

    const mailResult = await sendResetPasswordEmail(account.email, account.name, resetLink);

    logEvent('AUTH RESET REQUEST', `Password reset token generated for '${account.email}'`);
    return res.json({
      success: true,
      message: `Password reset link has been dispatched to ${account.email}. Please check your inbox.`,
      resetLink,
      previewUrl: mailResult.previewUrl,
    });
  }

  if (action === 'verify-reset-token') {
    const { token: reqToken, email: reqEmail } = req.body;
    if (!reqToken || !reqEmail) {
      return res.status(400).json({ success: false, error: 'Reset token and email are required.' });
    }
    const cleanEmail = reqEmail.trim().toLowerCase();
    const account = accounts.find((a) => a.email && a.email.toLowerCase() === cleanEmail);

    if (!account || !account.resetPasswordToken || account.resetPasswordToken !== reqToken) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset link.' });
    }

    if (account.resetPasswordExpires && Date.now() > account.resetPasswordExpires) {
      return res.status(400).json({ success: false, error: 'This password reset link has expired. Please request a new one.' });
    }

    return res.json({ success: true, email: account.email, name: account.name });
  }

  if (action === 'reset-password') {
    const { token: reqToken, email: reqEmail, newPassword } = req.body;
    if (!reqToken || !reqEmail || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token, email, and new password are required.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }
    const cleanEmail = reqEmail.trim().toLowerCase();
    const account = accounts.find((a) => a.email && a.email.toLowerCase() === cleanEmail);

    if (!account || !account.resetPasswordToken || account.resetPasswordToken !== reqToken) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset link.' });
    }

    if (account.resetPasswordExpires && Date.now() > account.resetPasswordExpires) {
      return res.status(400).json({ success: false, error: 'This password reset link has expired. Please request a new one.' });
    }

    account.password = newPassword;
    delete account.resetPasswordToken;
    delete account.resetPasswordExpires;

    await saveAccount(account);
    logEvent('AUTH PASSWORD RESET', `Password successfully updated for user: '${account.email}'`);
    return res.json({ success: true, message: 'Password has been updated successfully! You can now sign in with your new password.' });
  }

  return res.status(400).json({ success: false, error: 'Invalid auth action specified.' });
});

// ROOMS API
app.get('/api/rooms', async (req, res) => {
  const rooms = await getRooms();
  res.json({ success: true, rooms });
});

app.post('/api/rooms', async (req, res) => {
  const { action, roomData, code, userId, expense, joinCode, userName, userAvatar } = req.body;
  const rooms = await getRooms();

  if (action === 'create' || action === 'update') {
    const existingIndex = rooms.findIndex((r) => r.code === roomData.code);
    let finalRoom;
    if (existingIndex >= 0) {
      finalRoom = { ...rooms[existingIndex], ...roomData };
      logEvent('ROOM UPDATE', `Room '${roomData.name}' (${roomData.code}) updated.`);
    } else {
      finalRoom = roomData;
      logEvent('ROOM CREATE', `New Room created: '${roomData.name}' (Code: ${roomData.code})`);
    }
    await saveRoom(finalRoom);
    return res.json({ success: true, rooms: await getRooms() });
  }

  if (action === 'delete') {
    await deleteRoom(code);
    logEvent('ADMIN DELETE', `Trip Room deleted: Code '${code}'`);
    return res.json({ success: true, rooms: await getRooms() });
  }

  if (action === 'join') {
    const targetRoom = rooms.find((r) => r.code && r.code.toUpperCase() === (joinCode || '').toUpperCase());
    if (!targetRoom) {
      logEvent('ROOM WARN', `Join room failed - Code not found: '${joinCode}'`);
      return res.status(404).json({ success: false, error: 'Room code not found.' });
    }
    targetRoom.members = targetRoom.members || [];
    targetRoom.joinRequests = targetRoom.joinRequests || [];
    targetRoom.userRejections = targetRoom.userRejections || {};

    const isHost = userId === targetRoom.hostId;
    const isApprovedMember = targetRoom.members.some((m) => m && m.id === userId && m.status === 'approved');

    if (isApprovedMember || isHost) {
      return res.json({ success: true, room: targetRoom, rooms, isApproved: true });
    }

    if (userId && userName) {
      const rejectionsCount = targetRoom.userRejections[userId] || 0;

      if (rejectionsCount >= 3) {
        logEvent('JOIN BLOCKED', `User '${userName}' blocked from joining room '${targetRoom.code}' (3 rejections limit reached).`);
        return res.status(403).json({
          success: false,
          isBlocked: true,
          rejectionsCount,
          error: `Access Denied: You have been declined ${rejectionsCount} times by the host of room '${targetRoom.name}' (${targetRoom.code}). Access to this room code is blocked for your account.`
        });
      }

      const existingReq = targetRoom.joinRequests.find((r) => r && r.userId === userId);

      if (existingReq && existingReq.status === 'pending') {
        logEvent('JOIN WARN', `User '${userName}' attempted join but request is already pending for '${targetRoom.code}'`);
        return res.json({
          success: true,
          isPending: true,
          room: targetRoom,
          rooms,
          rejectionsCount,
          error: `Join request for room '${targetRoom.name}' (${targetRoom.code}) is already pending approval from the host.`
        });
      }

      if (existingReq) {
        existingReq.status = 'pending';
        existingReq.userName = userName;
        existingReq.avatar = userAvatar || '👤';
        existingReq.createdAt = new Date().toISOString();
        existingReq.rejectionsCount = rejectionsCount;
        logEvent('JOIN REQUEST RESENT', `User '${userName}' resubmitted join request (Attempt ${rejectionsCount + 1}/3) for room '${targetRoom.name}' (${targetRoom.code})`);
      } else {
        targetRoom.joinRequests.push({
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          userId,
          userName,
          avatar: userAvatar || '👤',
          status: 'pending',
          rejectionsCount,
          createdAt: new Date().toISOString(),
        });
        logEvent('JOIN REQUEST', `User '${userName}' submitted join request (Attempt ${rejectionsCount + 1}/3) for room '${targetRoom.name}' (${targetRoom.code})`);
      }
      await saveRoom(targetRoom);
    }
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'addExpense') {
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.expenses = targetRoom.expenses || [];
    targetRoom.expenses.unshift(expense);
    await saveRoom(targetRoom);
    logEvent('EXPENSE ADD', `Logged expense '${expense.title}' (INR ${expense.amount}) in room '${targetRoom.code}'`);
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'addMember') {
    const { newMember } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.members = targetRoom.members || [];
    if (!targetRoom.members.some((m) => m && m.id === newMember.id)) {
      targetRoom.members.push({ ...newMember, status: 'approved' });
      await saveRoom(targetRoom);
      logEvent('MEMBER ADD', `Host added member '${newMember.name}' to room '${targetRoom.code}'`);
    }
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'removeMember' || action === 'leaveRoom') {
    const { targetUserId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.members = (targetRoom.members || []).filter((m) => m && m.id !== targetUserId);
    targetRoom.joinRequests = (targetRoom.joinRequests || []).filter((r) => r && r.userId !== targetUserId);
    await saveRoom(targetRoom);
    logEvent('MEMBER ACTION', `User '${targetUserId}' removed/left from room '${targetRoom.code}'`);
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'deleteExpense') {
    const { expenseId, userId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    if (targetRoom.expenses) {
      const expToDelete = targetRoom.expenses.find((e) => e && e.id === expenseId);
      const isHost = targetRoom.hostId === userId;
      if (expToDelete && userId && expToDelete.paidBy && expToDelete.paidBy !== userId && !isHost) {
        logEvent('UNAUTHORIZED DELETE', `Blocked user '${userId}' from deleting expense '${expenseId}' (Owned by '${expToDelete.paidBy}')`);
        return res.status(403).json({ success: false, error: 'Permission Denied: Only the member who logged this expense or the Room Host can delete it.' });
      }
      targetRoom.expenses = targetRoom.expenses.filter((e) => e && e.id !== expenseId);
    }
    await saveRoom(targetRoom);
    logEvent('EXPENSE DELETE', `Deleted expense ID '${expenseId}' from room '${code}'`);
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'approveJoinRequest') {
    const { requestId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.joinRequests = targetRoom.joinRequests || [];
    targetRoom.members = targetRoom.members || [];
    const reqItem = targetRoom.joinRequests.find((r) => r && r.id === requestId);
    if (reqItem) {
      reqItem.status = 'approved';
      if (!targetRoom.members.some((m) => m && m.id === reqItem.userId)) {
        targetRoom.members.push({ id: reqItem.userId, name: reqItem.userName, avatar: reqItem.avatar || '👤', status: 'approved' });
      }
      await saveRoom(targetRoom);
      logEvent('JOIN APPROVED', `Host approved join request for '${reqItem.userName}' in room '${targetRoom.code}'`);
    }
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'rejectJoinRequest') {
    const { requestId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.joinRequests = targetRoom.joinRequests || [];
    targetRoom.userRejections = targetRoom.userRejections || {};

    const reqItem = targetRoom.joinRequests.find((r) => r && r.id === requestId);
    if (reqItem) {
      const currentRejections = (targetRoom.userRejections[reqItem.userId] || 0) + 1;
      targetRoom.userRejections[reqItem.userId] = currentRejections;
      reqItem.rejectionsCount = currentRejections;

      if (currentRejections >= 3) {
        reqItem.status = 'blocked';
        logEvent('JOIN BLOCKED', `Host rejected join request for '${reqItem.userName}' 3 times in room '${targetRoom.code}'. Access to room code is blocked.`);
      } else {
        reqItem.status = 'rejected';
        logEvent('JOIN REJECTED', `Host rejected join request for '${reqItem.userName}' (${currentRejections}/3 rejections) in room '${targetRoom.code}'`);
      }
      await saveRoom(targetRoom);
    }
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'cancelJoinRequest') {
    const { userId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.joinRequests = (targetRoom.joinRequests || []).filter((r) => r && r.userId !== userId);
    await saveRoom(targetRoom);
    logEvent('JOIN CANCELLED', `User '${userId}' cancelled join request for room '${targetRoom.code}'`);
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'claimPayment') {
    const { payment, userId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });

    // Validate permission: only debtor, receiver, or host can record settlement payment
    const isPayer = !userId || payment.fromId === userId || (payment.fromName && payment.fromName.toLowerCase() === userId.toLowerCase());
    const isReceiver = userId && (payment.toId === userId || (payment.toName && payment.toName.toLowerCase() === userId.toLowerCase()));
    const isHost = userId && targetRoom.hostId === userId;

    if (userId && !isPayer && !isReceiver && !isHost) {
      logEvent('UNAUTHORIZED CLAIM', `Blocked user '${userId}' from claiming payment for debt between '${payment.fromName}' and '${payment.toName}'`);
      return res.status(403).json({ success: false, error: 'Permission Denied: Only the member who owes this debt or the Room Host can mark it paid.' });
    }

    targetRoom.settlementHistory = targetRoom.settlementHistory || [];

    // Remove any previous pending/declined claim for the exact same transaction
    targetRoom.settlementHistory = targetRoom.settlementHistory.filter(
      (p) => !(p.status !== 'PAID' && p.fromId === payment.fromId && p.toId === payment.toId)
    );

    targetRoom.settlementHistory.unshift({
      ...payment,
      status: 'PENDING',
    });
    await saveRoom(targetRoom);
    logEvent('PAYMENT CLAIM', `'${payment.fromName}' marked ₹${payment.amount} paid to '${payment.toName}' (Pending Approval) in room '${code}'`);
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'approvePayment') {
    const { paymentId, userId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.settlementHistory = targetRoom.settlementHistory || [];
    const item = targetRoom.settlementHistory.find((p) => p.id === paymentId);
    if (item) {
      const isReceiver = !userId || item.toId === userId || (item.toName && item.toName.toLowerCase() === userId.toLowerCase());
      const isHost = userId && targetRoom.hostId === userId;
      if (userId && !isReceiver && !isHost) {
        logEvent('UNAUTHORIZED APPROVE', `Blocked user '${userId}' from approving payment ID '${paymentId}'`);
        return res.status(403).json({ success: false, error: 'Permission Denied: Only the recipient of this payment can approve it.' });
      }
      item.status = 'PAID';
      item.verifiedAt = new Date().toISOString();
      await saveRoom(targetRoom);
      logEvent('PAYMENT APPROVED', `'${item.toName}' verified and approved ₹${item.amount} from '${item.fromName}' in room '${code}'`);
    }
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  if (action === 'declinePayment') {
    const { paymentId, userId } = req.body;
    const targetRoom = rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.settlementHistory = targetRoom.settlementHistory || [];
    const item = targetRoom.settlementHistory.find((p) => p.id === paymentId);
    if (item) {
      const isReceiver = !userId || item.toId === userId || (item.toName && item.toName.toLowerCase() === userId.toLowerCase());
      const isHost = userId && targetRoom.hostId === userId;
      if (userId && !isReceiver && !isHost) {
        logEvent('UNAUTHORIZED DECLINE', `Blocked user '${userId}' from declining payment ID '${paymentId}'`);
        return res.status(403).json({ success: false, error: 'Permission Denied: Only the recipient of this payment can decline it.' });
      }
      item.status = 'DECLINED';
      item.declinedAt = new Date().toISOString();
      await saveRoom(targetRoom);
      logEvent('PAYMENT DECLINED', `'${item.toName}' declined payment claim from '${item.fromName}' in room '${code}'`);
    }
    return res.json({ success: true, room: targetRoom, rooms: await getRooms() });
  }

  return res.status(400).json({ success: false, error: 'Invalid room action.' });
});

// Serve Static Production Build
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
}

// Start Server & Connect to Supabase
app.listen(PORT, async () => {
  console.log(`\x1b[32m⚡ SettleKnot Server running on port ${PORT}\x1b[0m`);
  await initSupabase();
});
