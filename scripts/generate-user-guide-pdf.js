import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('public/guide-screens');
const LOGO_PATH = path.resolve('public/logo.png');

function toBase64(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const ext = path.extname(filePath).replace('.', '');
  const data = fs.readFileSync(filePath);
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${data.toString('base64')}`;
}

const logoBase64 = toBase64(LOGO_PATH);
const imgLanding = toBase64(path.join(SCREENSHOT_DIR, '01_landing_mobile.png'));
const imgLogin = toBase64(path.join(SCREENSHOT_DIR, '02_auth_login.png'));
const imgRegister = toBase64(path.join(SCREENSHOT_DIR, '03_auth_register.png'));
const imgDashboard = toBase64(path.join(SCREENSHOT_DIR, '04_dashboard.png'));
const imgRoom = toBase64(path.join(SCREENSHOT_DIR, '05_room_settlements.png'));
const imgExpenseModal = toBase64(path.join(SCREENSHOT_DIR, '06_log_expense_modal.png'));
const imgNotifications = toBase64(path.join(SCREENSHOT_DIR, '07_notifications_approvals.png'));
const imgDesktop = toBase64(path.join(SCREENSHOT_DIR, '08_desktop_overview.png'));

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SettleKnot User Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

    :root {
      --primary: #ea580c;
      --primary-dark: #c2410c;
      --primary-light: #ffedd5;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-500: #64748b;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
      --emerald-600: #059669;
      --emerald-50: #ecfdf5;
      --amber-600: #d97706;
      --amber-50: #fffbeb;
      --rose-600: #e11d48;
      --rose-50: #fff1f2;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--slate-800);
      background-color: #ffffff;
      line-height: 1.6;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      padding: 42px 48px;
      page-break-after: always;
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-col;
      flex-direction: column;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Running Header & Footer */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 24px;
      border-bottom: 1.5px solid var(--slate-200);
      font-size: 11px;
      color: var(--slate-500);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
      font-weight: 800;
    }

    .header-brand img {
      width: 18px;
      height: 18px;
      border-radius: 4px;
    }

    .footer-bar {
      margin-top: auto;
      padding-top: 14px;
      border-top: 1px solid var(--slate-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: var(--slate-500);
    }

    .footer-url {
      font-family: 'JetBrains Mono', monospace;
      color: var(--primary);
      font-weight: 700;
    }

    /* Typography */
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.5px;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    h2 {
      font-size: 18px;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.3px;
      margin-top: 14px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3 {
      font-size: 14px;
      font-weight: 700;
      color: var(--slate-900);
      margin-top: 12px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 10px;
      color: var(--slate-700);
      font-size: 12.5px;
    }

    strong {
      color: var(--slate-900);
      font-weight: 700;
    }

    code, .mono {
      font-family: 'JetBrains Mono', monospace;
      background: var(--slate-100);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 11.5px;
      color: var(--primary-dark);
      font-weight: 600;
      border: 1px solid var(--slate-200);
    }

    /* Cover Page Styling */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 56px 48px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #292524 100%);
      color: white;
      min-height: 100vh;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }

    .cover-page::before {
      content: "";
      position: absolute;
      top: -100px;
      right: -100px;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(234, 88, 12, 0.25) 0%, rgba(234, 88, 12, 0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .cover-top {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .cover-logo {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.15);
    }

    .cover-brand-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }

    .cover-badge {
      display: inline-block;
      background: rgba(234, 88, 12, 0.2);
      color: #fb923c;
      border: 1px solid rgba(234, 88, 12, 0.4);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 16px;
    }

    .cover-title {
      font-size: 42px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -1px;
      color: #ffffff;
      margin-bottom: 14px;
    }

    .cover-title span {
      background: linear-gradient(90deg, #fb923c, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 16px;
      color: #cbd5e1;
      max-width: 520px;
      line-height: 1.5;
      font-weight: 400;
      margin-bottom: 24px;
    }

    .cover-url-box {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      padding: 14px 20px;
      display: inline-flex;
      align-items: center;
      gap: 14px;
      backdrop-filter: blur(10px);
      margin-bottom: 30px;
    }

    .cover-url-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #94a3b8;
      font-weight: 700;
    }

    .cover-url-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 700;
      color: #38bdf8;
    }

    .cover-features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 20px;
    }

    .cover-feature-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 14px;
    }

    .cover-feature-icon {
      font-size: 22px;
      margin-bottom: 8px;
    }

    .cover-feature-title {
      font-size: 12px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 4px;
    }

    .cover-feature-desc {
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .cover-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 11px;
      color: #94a3b8;
    }

    /* Layout Components */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: center;
      margin: 14px 0;
    }

    .grid-2-text-left {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 22px;
      align-items: center;
      margin: 14px 0;
    }

    .grid-2-text-right {
      display: grid;
      grid-template-columns: 0.85fr 1.15fr;
      gap: 22px;
      align-items: center;
      margin: 14px 0;
    }

    .shot-frame {
      background: #ffffff;
      border: 1.5px solid var(--slate-200);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
    }

    .shot-frame img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    .shot-caption {
      padding: 8px 12px;
      background: var(--slate-50);
      border-top: 1px solid var(--slate-200);
      font-size: 10px;
      font-weight: 600;
      color: var(--slate-600);
      text-align: center;
    }

    .card {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 14px;
      padding: 14px 16px;
      margin: 10px 0;
    }

    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--slate-900);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    /* Alerts and Callouts */
    .callout {
      border-left: 4px solid;
      padding: 12px 14px;
      border-radius: 0 12px 12px 0;
      margin: 12px 0;
      font-size: 11.5px;
    }

    .callout-info {
      border-color: #0284c7;
      background: #f0f9ff;
      color: #0369a1;
    }

    .callout-success {
      border-color: var(--emerald-600);
      background: var(--emerald-50);
      color: #065f46;
    }

    .callout-warning {
      border-color: var(--amber-600);
      background: var(--amber-50);
      color: #92400e;
    }

    .callout-danger {
      border-color: var(--rose-600);
      background: var(--rose-50);
      color: #9f1239;
    }

    .callout strong {
      display: block;
      margin-bottom: 3px;
      font-size: 12px;
    }

    /* Steps list */
    .steps-list {
      list-style: none;
      counter-reset: step-counter;
      margin: 12px 0;
    }

    .steps-list li {
      counter-increment: step-counter;
      position: relative;
      padding-left: 38px;
      margin-bottom: 12px;
      font-size: 12px;
      color: var(--slate-700);
    }

    .steps-list li::before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: -2px;
      width: 24px;
      height: 24px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-paid {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-declined {
      background: #ffe4e6;
      color: #9f1239;
      border: 1px solid #fecdd3;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11px;
    }

    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid var(--slate-200);
    }

    th {
      background: var(--slate-100);
      color: var(--slate-900);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) td {
      background: var(--slate-50);
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-top">
      ${logoBase64 ? `<img src="${logoBase64}" class="cover-logo" alt="SettleKnot Logo" />` : ''}
      <div>
        <div class="cover-brand-name">SettleKnot</div>
        <div style="font-size: 11px; color: #94a3b8; font-weight: 500;">Smart Trip Group Expense & Settlement Platform</div>
      </div>
    </div>

    <div class="cover-mid">
      <div class="cover-badge">Official User Manual • Release 2026</div>
      <h1 class="cover-title">
        SettleKnot<br />
        <span>User Guide</span>
      </h1>
      <p class="cover-subtitle">
        A comprehensive guide to accessing, installing as a mobile app, managing rooms, splitting expenses, and verifying two-step settlements.
      </p>

      <div class="cover-url-box">
        <span class="cover-url-label">App Web Address:</span>
        <span class="cover-url-val">https://settleknot.onrender.com</span>
      </div>

      <div class="cover-features">
        <div class="cover-feature-card">
          <div class="cover-feature-icon">📲</div>
          <div class="cover-feature-title">PWA Mobile App</div>
          <div class="cover-feature-desc">1-Click Chrome & Safari home-screen installation. Zero PlayStore hassle.</div>
        </div>
        <div class="cover-feature-card">
          <div class="cover-feature-icon">🔒</div>
          <div class="cover-feature-title">2-Step Settlements</div>
          <div class="cover-feature-desc">Payer marks Paid (⏳ Pending). Receiver approves (✓ Paid) to verify.</div>
        </div>
        <div class="cover-feature-card">
          <div class="cover-feature-icon">⚡</div>
          <div class="cover-feature-title">Realtime Cloud DB</div>
          <div class="cover-feature-desc">Supabase PostgreSQL permanent cloud synchronization across all devices.</div>
        </div>
      </div>
    </div>

    <div class="cover-meta">
      <div>
        <strong>Prepared For:</strong> All SettleKnot Travelers, Hosts & Room Members<br />
        <strong>Document Version:</strong> 2.4 (Enterprise Edition)
      </div>
      <div style="text-align: right;">
        <strong>Platform URL:</strong> settleknot.onrender.com<br />
        <strong>Published:</strong> October 2026
      </div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS & ARCHITECTURE -->
  <div class="page">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Table of Contents</span>
    </div>

    <h1>Table of Contents</h1>
    <p>Everything you need to master group expense tracking, payment reconciliations, and trip accountability.</p>

    <div class="grid-2" style="margin-top: 18px; align-items: start;">
      <div>
        <div class="card" style="background: white; border: 1.5px solid var(--slate-200);">
          <div class="card-title">📖 Section Breakdown</div>
          <table style="margin: 0;">
            <tbody>
              <tr>
                <td><strong>Chapter 1</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch1">Introduction & Core Concept</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 3</td>
              </tr>
              <tr>
                <td><strong>Chapter 2</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch2">Accessing URL & Installing PWA App</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 4</td>
              </tr>
              <tr>
                <td><strong>Chapter 3</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch3">Account Registration & Secure Login</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 5</td>
              </tr>
              <tr>
                <td><strong>Chapter 4</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch4">Dashboard & Trip Room Management</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 6</td>
              </tr>
              <tr>
                <td><strong>Chapter 5</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch5">Logging Expenses & Auto-Split Rules</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 7</td>
              </tr>
              <tr>
                <td><strong>Chapter 6</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch6">Two-Step Settlement Verification Workflow</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 8</td>
              </tr>
              <tr>
                <td><strong>Chapter 7</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch7">Notifications & Host Approval Center</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 9</td>
              </tr>
              <tr>
                <td><strong>Chapter 8</strong></td>
                <td><a style="color: var(--slate-800); text-decoration: none;" href="#ch8">Audit Reports, PDF Export & Support</a></td>
                <td style="text-align: right; color: var(--slate-500); font-weight: 700;">Page 10</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="callout callout-info">
          <strong>💡 Minimum Cash-Flow Algorithm</strong>
          SettleKnot calculates the optimal cash flow across the entire room. Instead of everyone paying each other multiple times, debts are minimized into the fewest possible peer-to-peer transfers!
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-title">✨ Key Features Highlights</div>
          <ul style="padding-left: 18px; font-size: 11.5px; color: var(--slate-700); line-height: 1.8;">
            <li><strong>Zero PlayStore Download:</strong> Instant Progressive Web App (PWA) with native launcher icon.</li>
            <li><strong>30-Day Session Persistence:</strong> Stay logged in on mobile without annoying daily logins.</li>
            <li><strong>Locked Payer Integrity:</strong> Payer is locked to the logged-in user so nobody can log fake expenses under others' names.</li>
            <li><strong>Anti-Fraud Settlement:</strong> Settlements require confirmation by the recipient before balance is deducted.</li>
            <li><strong>Creator-Only Deletion:</strong> Only the original payer has the authority to delete their logged expense.</li>
            <li><strong>PDF Trip Statements:</strong> Export full branded audit reports with timestamped transaction receipts.</li>
          </ul>
        </div>

        <div class="card" style="background: var(--slate-900); color: white; border: none;">
          <div class="card-title" style="color: #fb923c;">🌐 Official Production Web URL</div>
          <div class="mono" style="background: rgba(255,255,255,0.1); color: #38bdf8; border: none; padding: 6px 10px; font-size: 13px; display: block; text-align: center; margin: 8px 0;">
            https://settleknot.onrender.com
          </div>
          <p style="font-size: 10.5px; color: #94a3b8; margin: 0; text-align: center;">
            Works seamlessly in Mobile Chrome, Mobile Safari, Firefox, Edge, and Desktop Browsers.
          </p>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>SettleKnot User Manual • Confidential & Proprietary</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 2</span>
    </div>
  </div>

  <!-- CHAPTER 1: INTRODUCTION & OVERVIEW -->
  <div class="page" id="ch1">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 1: Overview</span>
    </div>

    <h1>Chapter 1: Welcome to SettleKnot</h1>
    <p>
      Managing group expenses on road trips, vacations, and shared apartment stays has historically been frustrating. Traditional split apps allow users to fabricate payments, lack real-time synchronization, or require clumsy app-store installations. SettleKnot solves these challenges with a cutting-edge, mobile-first web application.
    </p>

    <div class="grid-2-text-left">
      <div>
        <h2>Why SettleKnot is Different</h2>
        <p>
          SettleKnot was built from the ground up for high-trust trip groups. It incorporates mathematical optimization to reduce the number of peer-to-peer transfers, while offering strict session security and recipient verification.
        </p>

        <div class="card">
          <div class="card-title">🛡️ Built-in Integrity & Security Rules</div>
          <p style="font-size: 11.5px; margin-bottom: 6px;">
            <strong>1. Creator-Only Expense Deletion:</strong> Only the specific user who paid and logged an expense has permission to delete it. Other members cannot tamper with your logs.
          </p>
          <p style="font-size: 11.5px; margin-bottom: 6px;">
            <strong>2. Payer Locking:</strong> When logging an expense, the payer field is locked directly to your authenticated profile.
          </p>
          <p style="font-size: 11.5px; margin-bottom: 6px;">
            <strong>3. Receiver-Approved Settlements:</strong> When you mark an amount as paid, it stays in <span class="badge badge-pending">⏳ PENDING</span> until the receiving friend confirms receipt.
          </p>
          <p style="font-size: 11.5px; margin-bottom: 0;">
            <strong>4. Permanent Cloud Database:</strong> All data is permanently hosted on Supabase PostgreSQL so your balances are never lost.
          </p>
        </div>

        <div class="callout callout-success">
          <strong>🎯 Zero Installation Friction</strong>
          Users don't need to visit an App Store. Open the link <code class="mono">settleknot.onrender.com</code>, tap "Install App", and SettleKnot installs directly onto your phone's home screen!
        </div>
      </div>

      <div>
        <div class="shot-frame">
          <img src="${imgLanding}" alt="SettleKnot Mobile Landing Page" />
          <div class="shot-caption">Figure 1.1: SettleKnot Mobile Landing Screen on Android & iOS</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 1: Introduction & Overview</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 3</span>
    </div>
  </div>

  <!-- CHAPTER 2: ACCESSING URL & INSTALLING AS APP -->
  <div class="page" id="ch2">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 2: Installation Guide</span>
    </div>

    <h1>Chapter 2: Opening the URL & Installing as an App</h1>
    <p>
      SettleKnot is engineered as a <strong>Progressive Web App (PWA)</strong>. It provides all the benefits of a native mobile application (standalone full screen, desktop icon, smooth animations) without taking up megabytes of device storage.
    </p>

    <div class="card" style="background: var(--slate-900); color: white; border-color: var(--slate-700);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Step 1: Open Your Browser</div>
          <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 2px;">Type or Tap the Application URL</div>
        </div>
        <div class="mono" style="font-size: 14px; background: rgba(255,255,255,0.12); color: #38bdf8; border: none;">
          https://settleknot.onrender.com
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 14px; align-items: start;">
      <div>
        <h2>🤖 Installing on Android (Google Chrome)</h2>
        <ol class="steps-list">
          <li>
            <strong>Open URL in Chrome:</strong> Launch Google Chrome on your Android mobile device and navigate to <code class="mono">settleknot.onrender.com</code>.
          </li>
          <li>
            <strong>Look for the Install Banner:</strong> SettleKnot will automatically display an <em>"Install SettleKnot App"</em> prompt at the top right of your screen.
          </li>
          <li>
            <strong>Tap "Install":</strong> Tap the orange <strong>Install</strong> button. Chrome will prompt: <em>"Add to Home screen?"</em> Tap <strong>Add</strong> or <strong>Install</strong>.
          </li>
          <li>
            <strong>Manual Alternative:</strong> If the prompt doesn't show automatically, tap the <strong>three dots (⋮)</strong> at the top right corner of Chrome and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
          </li>
          <li>
            <strong>Launch from App Drawer:</strong> The SettleKnot icon will now appear on your home screen and app launcher. Tap it to launch full-screen!
          </li>
        </ol>

        <div class="callout callout-info">
          <strong>⚡ App Experience Advantage</strong>
          When launched from your home screen, the browser address bar and navigation controls disappear completely, giving you a full-bleed native app experience!
        </div>
      </div>

      <div>
        <h2>🍎 Installing on iPhone & iPad (Apple Safari)</h2>
        <ol class="steps-list">
          <li>
            <strong>Open Safari:</strong> Launch Safari on iOS and visit <code class="mono">settleknot.onrender.com</code>.
          </li>
          <li>
            <strong>Tap the Share Button:</strong> At the bottom toolbar of Safari, tap the <strong>Share icon</strong> (the square with an arrow pointing upwards ⎋).
          </li>
          <li>
            <strong>Select "Add to Home Screen":</strong> Scroll down the action menu and tap <strong>"Add to Home Screen"</strong> (icon with a plus sign ⊞).
          </li>
          <li>
            <strong>Confirm Name:</strong> Tap <strong>Add</strong> in the top-right corner. The SettleKnot icon will immediately be placed on your iOS desktop.
          </li>
        </ol>

        <div class="card">
          <div class="card-title">💻 Desktop (Chrome, Brave, Edge)</div>
          <p style="font-size: 11.5px; margin: 0;">
            On Windows or Mac, click the <strong>Install App icon (⊕)</strong> located on the right side of Chrome's address bar to install SettleKnot as a standalone desktop window.
          </p>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 2: Accessing URL & Installing PWA</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 4</span>
    </div>
  </div>

  <!-- CHAPTER 3: REGISTER & LOGIN -->
  <div class="page" id="ch3">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 3: Account Setup</span>
    </div>

    <h1>Chapter 3: Account Registration & Secure Login</h1>
    <p>
      SettleKnot provides individual accounts so your payments, expenses, and rooms are customized to your profile. Setting up an account takes less than 20 seconds.
    </p>

    <div class="grid-2" style="align-items: start; margin-top: 14px;">
      <div>
        <div class="shot-frame">
          <img src="${imgRegister}" alt="Registration Screen" />
          <div class="shot-caption">Figure 3.1: Account Registration Form</div>
        </div>

        <h3 style="margin-top: 14px;">Step-by-Step Registration:</h3>
        <ol class="steps-list">
          <li>Tap <strong>"Get Started"</strong> or <strong>"Register"</strong> on the landing page.</li>
          <li>Enter your <strong>Full Name</strong> (e.g., <em>Alex Johnson</em>).</li>
          <li>Enter your <strong>Email Address</strong> (e.g., <em>alex@example.com</em>).</li>
          <li>Create a secure <strong>Password</strong>.</li>
          <li>Tap <strong>"Create Account 🚀"</strong>. You will be automatically assigned an animal avatar and redirected to your Dashboard!</li>
        </ol>
      </div>

      <div>
        <div class="shot-frame">
          <img src="${imgLogin}" alt="Login Screen" />
          <div class="shot-caption">Figure 3.2: Secure Login Form</div>
        </div>

        <h3 style="margin-top: 14px;">Logging In & Session Security:</h3>
        <ol class="steps-list">
          <li>Select the <strong>"Sign In"</strong> tab on the authentication screen.</li>
          <li>Enter your registered Email Address and Password.</li>
          <li>Tap <strong>"Sign In ⚡"</strong> to access your trips and settlements.</li>
        </ol>

        <div class="callout callout-warning">
          <strong>🔒 30-Day Mobile Persistent Session</strong>
          SettleKnot maintains your session active for 30 days of inactivity on mobile devices. If you log out, SettleKnot's route guard prevents accessing protected data even if someone presses the browser's Back button!
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 3: Account Registration & Login</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 5</span>
    </div>
  </div>

  <!-- CHAPTER 4: DASHBOARD & TRIP ROOM MANAGEMENT -->
  <div class="page" id="ch4">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 4: Dashboard & Rooms</span>
    </div>

    <h1>Chapter 4: Dashboard & Trip Room Management</h1>
    <p>
      The Dashboard is your mission control. From here, you can create new trip rooms for upcoming holidays, join an existing room with a 6-character code, or view your active trip statistics.
    </p>

    <div class="grid-2-text-left">
      <div>
        <h2>Creating a New Trip Room</h2>
        <p>If you are the organizer or host of a trip:</p>
        <ol class="steps-list">
          <li>
            In the <strong>"Create Trip Room"</strong> card, enter your trip name (e.g., <em>Goa Reunion 🏖️</em> or <em>Manali Trekking</em>).
          </li>
          <li>
            Choose your preferred currency (defaults to <strong>₹ INR</strong>).
          </li>
          <li>
            Tap <strong>"Create Room ⚡"</strong>. SettleKnot instantly generates a unique <strong>6-character Room Code</strong> (e.g., <code class="mono">GOA26X</code>).
          </li>
          <li>
            Share the 6-character code or QR Code with your friends via WhatsApp, Telegram, or SMS.
          </li>
        </ol>

        <h2>Joining an Existing Trip Room</h2>
        <p>If your friend already created the room:</p>
        <ol class="steps-list">
          <li>
            In the <strong>"Join Trip Room"</strong> card, enter the 6-character code (e.g., <code class="mono">GOA26X</code>).
          </li>
          <li>
            Tap <strong>"Request to Join 🚀"</strong>.
          </li>
          <li>
            Your join request is immediately sent to the Room Host. Once the host taps <strong>Approve</strong>, you have full access to view debts and log expenses!
          </li>
        </ol>

        <div class="callout callout-info">
          <strong>👥 Host Protection Rule</strong>
          Travelers cannot view or tamper with private room finances until the Host approves their join request. Repeated spam requests (3 rejections) will automatically block unauthorized users.
        </div>
      </div>

      <div>
        <div class="shot-frame">
          <img src="${imgDashboard}" alt="SettleKnot Dashboard" />
          <div class="shot-caption">Figure 4.1: SettleKnot Trip Rooms Dashboard</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 4: Dashboard & Trip Rooms</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 6</span>
    </div>
  </div>

  <!-- CHAPTER 5: LOGGING EXPENSES & AUTO-SPLIT -->
  <div class="page" id="ch5">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 5: Logging Expenses</span>
    </div>

    <h1>Chapter 5: Logging Expenses & Auto-Split Rules</h1>
    <p>
      Whenever someone pays for lunch, fuel, villa rental, or drinks, log it immediately into the room. SettleKnot simplifies this process with automatic member selection and locked payer security.
    </p>

    <div class="grid-2-text-left">
      <div>
        <h2>Step-by-Step Expense Logging</h2>
        <ol class="steps-list">
          <li>
            Inside the Trip Room, navigate to the <strong>Logged Expenses</strong> tab and tap the orange <strong>"+ Log Expense"</strong> button.
          </li>
          <li>
            <strong>Expense Title:</strong> Enter what was purchased (e.g., <em>Beach Villa Resort (2 Nights)</em>).
          </li>
          <li>
            <strong>Amount (₹):</strong> Enter the total cost (e.g., <em>12,000</em>).
          </li>
          <li>
            <strong>Category:</strong> Select from Stay 🏨, Food 🍔, Transport 🚕, Activities 🏄, or Misc 🏷️.
          </li>
          <li>
            <strong>Locked Payer:</strong> Notice that the <em>"Paid By"</em> field is automatically locked to your user name. You cannot accidentally assign payments to other members.
          </li>
          <li>
            <strong>Split Method:</strong> Choose <strong>"Equal Split"</strong> or <strong>"Custom Split"</strong>. Tapping "Equal Split" automatically includes all approved members with a single tap!
          </li>
          <li>
            <strong>Notes / Tag:</strong> Optionally add payment notes (e.g., <em>Paid via Google Pay</em>).
          </li>
          <li>
            Tap <strong>"Log Expense ⚡"</strong>. A celebratory confetti animation will confirm the transaction!
          </li>
        </ol>

        <div class="callout callout-warning">
          <strong>🗑️ Expense Deletion Security</strong>
          Only the specific member who paid and logged the expense has the delete trash icon enabled. If any other member tries to delete it, SettleKnot blocks the action with a permission error.
        </div>
      </div>

      <div>
        <div class="shot-frame">
          <img src="${imgExpenseModal}" alt="Log Expense Modal" />
          <div class="shot-caption">Figure 5.1: Log Expense Modal with Auto Equal-Split</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 5: Logging Expenses & Auto-Split</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 7</span>
    </div>
  </div>

  <!-- CHAPTER 6: TWO-STEP SETTLEMENT VERIFICATION WORKFLOW -->
  <div class="page" id="ch6">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 6: Two-Step Settlement</span>
    </div>

    <h1>Chapter 6: Two-Step Settlement Verification Workflow</h1>
    <p>
      In ordinary split apps, anyone can tap "settle" and falsely erase a debt without actually sending money. SettleKnot introduces a <strong>Two-Step Settlement Verification Workflow</strong> that guarantees both parties agree before a debt is marked clear.
    </p>

    <div class="grid-2-text-left">
      <div>
        <h2>How the 2-Step Workflow Works:</h2>

        <div class="card" style="border-left: 4px solid var(--amber-600);">
          <div class="card-title" style="color: var(--amber-600);">
            Step 1: Payer Sends Money & Taps "Mark Paid"
          </div>
          <p style="font-size: 11.5px; margin: 0;">
            After transferring the funds via UPI (GPay/PhonePe), the debtor taps <strong>"Mark Paid"</strong> on the settlement card.
            The settlement status immediately switches to <span class="badge badge-pending">⏳ PENDING</span>. The debt is <em>not</em> erased yet, but held in escrow waiting for confirmation.
          </p>
        </div>

        <div class="card" style="border-left: 4px solid var(--emerald-600);">
          <div class="card-title" style="color: var(--emerald-600);">
            Step 2: Receiver Verifies Bank & Approves
          </div>
          <p style="font-size: 11.5px; margin: 0;">
            The person who was owed money gets an alert in their Notification Center and on the Room Settlements tab. After checking their bank account:
            <br />• <strong>Tap "Approve ✓":</strong> Status turns to <span class="badge badge-paid">✓ PAID</span>, and the balance is permanently settled!
            <br />• <strong>Tap "Decline ✕":</strong> If the money was not received, the receiver taps Decline. The status changes to <span class="badge badge-declined">✕ DECLINED</span>, and the debtor receives a <strong>"Pay Again"</strong> button.
          </p>
        </div>

        <div class="callout callout-success">
          <strong>📱 Mobile-Optimized Action Buttons</strong>
          All settlement action buttons ("Mark Paid", "Approve ✓", "Decline ✕") are sized and styled with responsive wrapping so they never overflow mobile screens!
        </div>
      </div>

      <div>
        <div class="shot-frame">
          <img src="${imgRoom}" alt="Room Settlements Screen" />
          <div class="shot-caption">Figure 6.1: Debt Settlements & Verification Statuses</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 6: Two-Step Settlement Workflow</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 8</span>
    </div>
  </div>

  <!-- CHAPTER 7: NOTIFICATIONS & HOST APPROVAL CENTER -->
  <div class="page" id="ch7">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 7: Notifications & Approvals</span>
    </div>

    <h1>Chapter 7: Notifications & Host Approvals Center</h1>
    <p>
      The Notifications screen serves as an inbox for all pending settlement approvals and membership join requests across every room you participate in.
    </p>

    <div class="grid-2-text-left">
      <div>
        <h2>Centralized Action Inbox</h2>
        <p>
          You don't need to manually click into individual rooms to check whether someone paid you. Navigate to <strong>Notifications 🔔</strong> in the sidebar or bottom menu:
        </p>

        <div class="card">
          <div class="card-title">📥 Payments Awaiting Your Verification</div>
          <p style="font-size: 11.5px;">
            Displays cards for every friend who marked a payment as paid to you. Each card shows the <strong>Trip Room Name</strong>, the <strong>Sender's Name</strong>, the <strong>Amount (₹)</strong>, and exact timestamp.
          </p>
          <p style="font-size: 11.5px; margin: 0;">
            Simply tap <strong style="color: var(--emerald-600);">Approve ✓</strong> or <strong style="color: var(--rose-600);">Decline ✕</strong> directly from this screen.
          </p>
        </div>

        <div class="card">
          <div class="card-title">📤 Payments You Claimed as Paid</div>
          <p style="font-size: 11.5px; margin: 0;">
            Displays payments you sent to others that are currently awaiting the receiver's verification. Shows the pulsing <span class="badge badge-pending">⏳ PENDING</span> badge until approved.
          </p>
        </div>

        <div class="callout callout-info">
          <strong>⚡ Zero-Action Realtime Synchronization</strong>
          SettleKnot polls the Supabase Cloud backend every 3 seconds in the background. As soon as your friend approves a payment or joins a room, your screen updates instantly without requiring a manual browser refresh!
        </div>
      </div>

      <div>
        <div class="shot-frame">
          <img src="${imgNotifications}" alt="Notifications and Approvals Center" />
          <div class="shot-caption">Figure 7.1: Notifications & Payment Approvals Inbox</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 7: Notifications & Approvals</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 9</span>
    </div>
  </div>

  <!-- CHAPTER 8: AUDIT REPORTS, PDF EXPORT & FAQ -->
  <div class="page" id="ch8">
    <div class="header-bar">
      <div class="header-brand">
        ${logoBase64 ? `<img src="${logoBase64}" alt="SettleKnot" />` : ''}
        <span>SettleKnot Manual</span>
      </div>
      <span>Chapter 8: Reports & FAQ</span>
    </div>

    <h1>Chapter 8: PDF Reports, Audit Statements & FAQ</h1>
    <p>
      At the end of your trip, you can download a full, professional trip statement PDF for your records, group chats, or accounting.
    </p>

    <div class="grid-2" style="margin-top: 14px; align-items: start;">
      <div>
        <h2>📄 Generating a Trip PDF Report</h2>
        <ol class="steps-list">
          <li>Open your Trip Room in SettleKnot.</li>
          <li>At the top header bar, tap the green <strong>"Export PDF"</strong> button.</li>
          <li>
            SettleKnot immediately compiles all group expenses, member contributions, net balances, and verified settlement transfers into a beautiful, downloadable PDF!
          </li>
          <li>Save the PDF to your phone files or share directly into your WhatsApp group.</li>
        </ol>

        <div class="shot-frame" style="margin-top: 14px;">
          <img src="${imgDesktop}" alt="Desktop View Overview" />
          <div class="shot-caption">Figure 8.1: Full Desktop and Tablet Dashboard View</div>
        </div>
      </div>

      <div>
        <h2>Frequently Asked Questions (FAQ)</h2>
        <div class="card">
          <div class="card-title">❓ Do my friends need an account to join?</div>
          <p style="font-size: 11px; margin: 0;">
            Yes. Creating an account takes only 15 seconds. Once signed up, they can enter your 6-character room code to request access.
          </p>
        </div>

        <div class="card">
          <div class="card-title">❓ Is our data saved permanently?</div>
          <p style="font-size: 11px; margin: 0;">
            Yes! SettleKnot is integrated with Supabase Cloud Database (PostgreSQL). Your trip records, expenses, and payments remain permanently safe.
          </p>
        </div>

        <div class="card">
          <div class="card-title">❓ Can someone delete my expense?</div>
          <p style="font-size: 11px; margin: 0;">
            No. SettleKnot strictly enforces creator-only deletion. Only the logged-in user who paid for an expense has the option to delete it.
          </p>
        </div>

        <div class="card">
          <div class="card-title">❓ What happens if a payment is declined?</div>
          <p style="font-size: 11px; margin: 0;">
            If the recipient didn't receive the money and taps Decline, the status updates to <span class="badge badge-declined">✕ DECLINED</span>. The payer can then tap "Pay Again" to resubmit.
          </p>
        </div>

        <div class="card" style="background: var(--slate-900); color: white; border: none; margin-top: 12px;">
          <div class="card-title" style="color: #fb923c;">🎉 Start Settling Seamlessly Today!</div>
          <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
            Bookmark or install SettleKnot on your mobile device now:
            <br /><strong style="color: #38bdf8; font-family: 'JetBrains Mono', monospace;">https://settleknot.onrender.com</strong>
          </p>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Chapter 8: Reports, Statements & FAQ</span>
      <span class="footer-url">settleknot.onrender.com</span>
      <span>Page 10</span>
    </div>
  </div>

</body>
</html>
`;

async function generatePdf() {
  console.log('Generating SettleKnot User Guide PDF via Chrome Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Destination PDF files
  const rootPdfPath = path.resolve('SettleKnot_User_Guide.pdf');
  const rootPdfPathSpaced = path.resolve('SettleKnot User Guide.pdf');
  const publicPdfPath = path.resolve('public/SettleKnot_User_Guide.pdf');

  console.log('Rendering PDF to A4 with print background...');
  await page.pdf({
    path: rootPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    },
  });

  // Copy to spaced name and public folder
  fs.copyFileSync(rootPdfPath, rootPdfPathSpaced);
  fs.copyFileSync(rootPdfPath, publicPdfPath);

  await browser.close();
  console.log('PDF successfully created at:');
  console.log('1.', rootPdfPath);
  console.log('2.', rootPdfPathSpaced);
  console.log('3.', publicPdfPath);
}

generatePdf().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
