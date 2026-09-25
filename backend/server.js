const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ANSI Color Log Helper
function logEvent(tag, message, meta = '') {
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`\x1b[36m[${time}]\x1b[0m \x1b[33m[${tag}]\x1b[0m ${message}`, meta ? meta : '');
}

// Request Logger Middleware
app.use((req, res, next) => {
  const action = req.body && req.body.action ? ` | Action: ${req.body.action}` : '';
  logEvent('HTTP REQUEST', `${req.method} ${req.url}${action}`);
  next();
});

const DB_FILE = path.join(__dirname, 'data', 'db.json');

function readDb() {
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

function writeDb(data) {
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

// Health Check
app.get('/api/health', (req, res) => {
  logEvent('HEALTH', 'System health check request received');
  res.json({ status: 'ok', service: 'SettleKnot Express Backend', timestamp: new Date().toISOString() });
});

// Database Export (Admin)
app.get('/api/db', (req, res) => {
  logEvent('ADMIN', 'Full database snapshot exported');
  res.json(readDb());
});

// AUTH API
app.get('/api/auth', (req, res) => {
  const db = readDb();
  res.json({ success: true, accounts: db.accounts });
});

app.post('/api/auth', (req, res) => {
  const { action, name, email, password, userId } = req.body;
  const db = readDb();

  if (action === 'login') {
    const account = db.accounts.find((a) => a.email && a.email.toLowerCase() === (email || '').toLowerCase());
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
    const existing = db.accounts.find((a) => a.email && a.email.toLowerCase() === email.toLowerCase());
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

    db.accounts.push(newAccount);
    writeDb(db);
    const token = `sk_tok_${newAccount.id}_${Date.now()}`;
    logEvent('AUTH REGISTER', `New user registered: '${newAccount.name}' (${newAccount.email})`);
    return res.json({ success: true, account: newAccount, token });
  }

  if (action === 'delete') {
    const target = db.accounts.find((a) => a && a.id === userId);
    if (target && target.email && target.email.toLowerCase() === 'settleknot@admin.in') {
      logEvent('ADMIN WARN', `Attempted deletion of System Admin blocked.`);
      return res.status(400).json({ success: false, error: 'System Admin account cannot be deleted.' });
    }

    db.accounts = db.accounts.filter((a) => a && a.id !== userId);

    if (db.rooms) {
      db.rooms.forEach((r) => {
        if (!r) return;
        if (Array.isArray(r.members)) {
          r.members = r.members.filter((m) => m && m.id !== userId);
        }
        if (Array.isArray(r.joinRequests)) {
          r.joinRequests = r.joinRequests.filter((m) => m && m.userId !== userId);
        }
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

    writeDb(db);
    logEvent('ADMIN DELETE', `User account deleted: '${target ? target.name : userId}'`);
    return res.json({ success: true, accounts: db.accounts, rooms: db.rooms });
  }

  return res.status(400).json({ success: false, error: 'Invalid auth action specified.' });
});

// ROOMS API
app.get('/api/rooms', (req, res) => {
  const db = readDb();
  res.json({ success: true, rooms: db.rooms });
});

app.post('/api/rooms', (req, res) => {
  const { action, roomData, code, userId, expense, joinCode, userName, userAvatar } = req.body;
  const db = readDb();

  if (action === 'create' || action === 'update') {
    const existingIndex = db.rooms.findIndex((r) => r.code === roomData.code);
    if (existingIndex >= 0) {
      db.rooms[existingIndex] = { ...db.rooms[existingIndex], ...roomData };
      logEvent('ROOM UPDATE', `Room '${roomData.name}' (${roomData.code}) updated.`);
    } else {
      db.rooms.push(roomData);
      logEvent('ROOM CREATE', `New Room created: '${roomData.name}' (Code: ${roomData.code})`);
    }
    writeDb(db);
    return res.json({ success: true, rooms: db.rooms });
  }

  if (action === 'delete') {
    db.rooms = db.rooms.filter((r) => r.code !== code);
    writeDb(db);
    logEvent('ADMIN DELETE', `Trip Room deleted: Code '${code}'`);
    return res.json({ success: true, rooms: db.rooms });
  }

  if (action === 'join') {
    const targetRoom = db.rooms.find((r) => r.code && r.code.toUpperCase() === (joinCode || '').toUpperCase());
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
      return res.json({ success: true, room: targetRoom, rooms: db.rooms, isApproved: true });
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
          rooms: db.rooms,
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
      writeDb(db);
    }
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  if (action === 'addExpense') {
    const targetRoom = db.rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.expenses = targetRoom.expenses || [];
    targetRoom.expenses.unshift(expense);
    writeDb(db);
    logEvent('EXPENSE ADD', `Logged expense '${expense.title}' (INR ${expense.amount}) in room '${targetRoom.code}'`);
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  if (action === 'addMember') {
    const { newMember } = req.body;
    const targetRoom = db.rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.members = targetRoom.members || [];
    if (!targetRoom.members.some((m) => m && m.id === newMember.id)) {
      targetRoom.members.push({ ...newMember, status: 'approved' });
      writeDb(db);
      logEvent('MEMBER ADD', `Host added member '${newMember.name}' to room '${targetRoom.code}'`);
    }
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  if (action === 'removeMember' || action === 'leaveRoom') {
    const { targetUserId } = req.body;
    const targetRoom = db.rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.members = (targetRoom.members || []).filter((m) => m && m.id !== targetUserId);
    targetRoom.joinRequests = (targetRoom.joinRequests || []).filter((r) => r && r.userId !== targetUserId);
    writeDb(db);
    logEvent('MEMBER ACTION', `User '${targetUserId}' removed/left from room '${targetRoom.code}'`);
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  if (action === 'deleteExpense') {
    const { expenseId } = req.body;
    const targetRoom = db.rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    if (targetRoom.expenses) {
      targetRoom.expenses = targetRoom.expenses.filter((e) => e && e.id !== expenseId);
    }
    writeDb(db);
    logEvent('EXPENSE DELETE', `Deleted expense ID '${expenseId}' from room '${code}'`);
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  if (action === 'approveJoinRequest') {
    const { requestId } = req.body;
    const targetRoom = db.rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.joinRequests = targetRoom.joinRequests || [];
    targetRoom.members = targetRoom.members || [];
    const reqItem = targetRoom.joinRequests.find((r) => r && r.id === requestId);
    if (reqItem) {
      reqItem.status = 'approved';
      if (!targetRoom.members.some((m) => m && m.id === reqItem.userId)) {
        targetRoom.members.push({ id: reqItem.userId, name: reqItem.userName, avatar: reqItem.avatar || '👤', status: 'approved' });
      }
      writeDb(db);
      logEvent('JOIN APPROVED', `Host approved join request for '${reqItem.userName}' in room '${targetRoom.code}'`);
    }
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  if (action === 'rejectJoinRequest') {
    const { requestId } = req.body;
    const targetRoom = db.rooms.find((r) => r.code === code);
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
      writeDb(db);
    }
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  if (action === 'cancelJoinRequest') {
    const { userId } = req.body;
    const targetRoom = db.rooms.find((r) => r.code === code);
    if (!targetRoom) return res.status(404).json({ success: false, error: 'Room not found.' });
    targetRoom.joinRequests = (targetRoom.joinRequests || []).filter((r) => r && r.userId !== userId);
    writeDb(db);
    logEvent('JOIN CANCELLED', `User '${userId}' cancelled join request for room '${targetRoom.code}'`);
    return res.json({ success: true, room: targetRoom, rooms: db.rooms });
  }

  return res.status(400).json({ success: false, error: 'Invalid room action.' });
});

app.listen(PORT, () => {
  console.log(`\x1b[32m⚡ SettleKnot Backend API running on port ${PORT}\x1b[0m`);
});
