import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('public/guide-screens');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome for guide screenshots...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // 1. Landing Page
  console.log('Capturing 01_landing_mobile.png...');
  await page.goto('http://localhost:5000/#/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1', { timeout: 5000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_mobile.png') });

  // 2. Open Auth / Login Page
  console.log('Capturing 02_auth_login.png...');
  await page.goto('http://localhost:5000/#/auth', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_auth_login.png') });

  // 3. Register Tab
  console.log('Capturing 03_auth_register.png...');
  // Click register tab if available
  const registerBtn = await page.$('button ::-p-text(Register)');
  if (registerBtn) {
    await registerBtn.click();
    await new Promise((r) => setTimeout(r, 600));
  } else {
    // try clicking register button on auth
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reg = btns.find((b) => b.innerText.includes('Register') || b.innerText.includes('Create'));
      if (reg) reg.click();
    });
    await new Promise((r) => setTimeout(r, 600));
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_auth_register.png') });

  // 4. Set local storage with demo user and sample trip room, then navigate to dashboard
  console.log('Setting demo user and capturing 04_dashboard.png...');
  await page.evaluate(() => {
    const demoUser = {
      id: 'usr_guide_demo',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      avatar: '🦊',
      createdAt: new Date().toISOString(),
    };
    const now = Date.now().toString();
    localStorage.setItem('settleknot_current_user', JSON.stringify(demoUser));
    sessionStorage.setItem('settleknot_current_user', JSON.stringify(demoUser));
    localStorage.setItem('settleknot_last_activity', now);
    sessionStorage.setItem('settleknot_last_activity', now);

    const demoRoom = {
      id: 'room_goa_2026',
      code: 'GOA26X',
      name: 'Goa Friends Reunion 🏖️',
      currency: '₹',
      hostId: 'usr_guide_demo',
      createdAt: new Date().toISOString(),
      joinRequests: [],
      members: [
        { id: 'usr_guide_demo', name: 'Alex Johnson (You)', avatar: '🦊', isHost: true, status: 'approved' },
        { id: 'usr_member_sam', name: 'Sam Rivera', avatar: '🐱', isHost: false, status: 'approved' },
        { id: 'usr_member_priya', name: 'Priya Sharma', avatar: '🦁', isHost: false, status: 'approved' },
      ],
      expenses: [
        {
          id: 'exp-1',
          title: 'Beachside Villa Resort (2 Nights)',
          amount: 12000,
          category: 'stay',
          paidBy: 'usr_guide_demo',
          paidByName: 'Alex Johnson (You)',
          isPersonal: false,
          splitType: 'equal',
          splitAmong: ['usr_guide_demo', 'usr_member_sam', 'usr_member_priya'],
          notes: 'Paid via GPay',
          dateFormatted: '10 Oct 2026',
          timeFormatted: '02:30 PM',
        },
        {
          id: 'exp-2',
          title: 'Seafood Shack Dinner',
          amount: 3600,
          category: 'food',
          paidBy: 'usr_member_sam',
          paidByName: 'Sam Rivera',
          isPersonal: false,
          splitType: 'equal',
          splitAmong: ['usr_guide_demo', 'usr_member_sam', 'usr_member_priya'],
          notes: 'Fish curry & beverages',
          dateFormatted: '10 Oct 2026',
          timeFormatted: '08:45 PM',
        },
      ],
      settlementHistory: [
        {
          id: 'pay_hist_1',
          fromId: 'usr_member_priya',
          fromName: 'Priya Sharma',
          toId: 'usr_guide_demo',
          toName: 'Alex Johnson (You)',
          amount: 2800,
          dateFormatted: '11 Oct 2026',
          timeFormatted: '10:15 AM',
          timestamp: new Date().toISOString(),
          status: 'PENDING',
        },
      ],
    };

    const existingRooms = JSON.parse(localStorage.getItem('settleknot_trip_rooms') || '[]');
    const filtered = existingRooms.filter((r) => r.code !== 'GOA26X');
    filtered.unshift(demoRoom);
    localStorage.setItem('settleknot_trip_rooms', JSON.stringify(filtered));
    localStorage.setItem('settleknot_active_room_code', 'GOA26X');
    sessionStorage.setItem('settleknot_active_room_code', 'GOA26X');
  });

  // Navigate to Dashboard with full reload
  await page.goto('http://localhost:5000/#/dashboard', { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dashboard.png') });

  // 5. Room Settlements Overview
  console.log('Capturing 05_room_settlements.png...');
  await page.goto('http://localhost:5000/#/room/GOA26X', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_room_settlements.png') });

  // 6. Log Expense Modal
  console.log('Capturing 06_log_expense_modal.png...');
  // Click on "Logged Expenses" tab first
  await page.evaluate(() => {
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const expTab = tabBtns.find((b) => b.innerText.includes('Logged Expenses'));
    if (expTab) expTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click Log Expense button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const logBtn = btns.find((b) => b.innerText.includes('Log Expense'));
    if (logBtn) logBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_log_expense_modal.png') });

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[title="Close"], .fixed button svg');
    if (closeBtn) closeBtn.closest('button').click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 7. Notifications & Payment Approvals Center
  console.log('Capturing 07_notifications_approvals.png...');
  await page.goto('http://localhost:5000/#/notifications', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_notifications_approvals.png') });

  // 8. Desktop Landscape Overview
  console.log('Capturing 08_desktop_overview.png...');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1.5 });
  await page.goto('http://localhost:5000/#/room/GOA26X', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_desktop_overview.png') });

  await browser.close();
  console.log('Screenshots captured successfully in:', SCREENSHOT_DIR);
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
