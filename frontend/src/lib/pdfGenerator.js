import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateSettlements } from './store.js';

export function sanitizePdfText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    // Strip all Unicode Emojis and Symbols
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    // Strip non-ASCII / corrupted control characters for jsPDF standard fonts
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

export function generateTripPDF(room) {
  if (!room) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currencySymbol = 'INR ';
  const settlements = calculateSettlements(room);
  
  const allExpenses = room.expenses || [];
  const groupExpenses = allExpenses.filter((e) => !e.isPersonal);
  const personalExpenses = allExpenses.filter((e) => e.isPersonal);

  const totalTripSpend = groupExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const approvedMembers = (room.members || []).filter((m) => m && m.status === 'approved');
  const approvedMembersCount = approvedMembers.length;
  const avgSpendPerPerson = approvedMembersCount > 0 ? totalTripSpend / approvedMembersCount : 0;
  const hostMember = (room.members || []).find((m) => m && m.id === room.hostId);

  const sanitizedRoomName = sanitizePdfText(room.name) || 'Trip Room';
  const sanitizedHostName = sanitizePdfText(hostMember?.name) || 'Host';

  const headerBg = [234, 88, 12];
  const orangeAccent = [249, 115, 22];
  const emeraldAccent = [5, 150, 105];
  const amberAccent = [217, 119, 6];
  const purpleAccent = [147, 51, 234];

  // HEADER BANNER
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SettleKnot', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 243, 199);
  doc.text('Official Trip Expense & Settlement Audit Report', 14, 25);

  const reportDate = `${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  doc.setFontSize(8);
  doc.text(`Generated: ${reportDate}`, 140, 25);

  let currentY = 40;

  // SECTION 1: Details (Trip Room Summary & Audit Overview)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 24, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`1. Trip Details: ${sanitizedRoomName}`, 18, currentY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Room Code: ${room.code}   |   Host: ${sanitizedHostName}   |   Approved Members: ${approvedMembersCount}`, 18, currentY + 13);
  doc.text(`Total Group Spend: ${currencySymbol}${totalTripSpend.toFixed(2)}   |   Avg / Person: ${currencySymbol}${avgSpendPerPerson.toFixed(2)}   |   Logged Items: ${allExpenses.length}`, 18, currentY + 19);

  currentY += 32;

  // SECTION 2: Expenses Logs (Group Trip Expenditures History)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(orangeAccent[0], orangeAccent[1], orangeAccent[2]);
  doc.text('2. Group Expenses Logs History', 14, currentY);
  currentY += 4;

  if (groupExpenses.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('No group expenses logged for this trip room.', 14, currentY + 4);
    currentY += 10;
  } else {
    const groupRows = groupExpenses.map((exp) => {
      const payer = room.members.find((m) => m && m.id === exp.paidBy);
      const splitTypeStr = exp.splitType === 'custom' ? 'Custom Amounts' : 'Equal Split';
      const catClean = sanitizePdfText(exp.category) || 'General';
      const catFormatted = catClean.charAt(0).toUpperCase() + catClean.slice(1);

      return [
        exp.dateFormatted ? `${exp.dateFormatted} ${exp.timeFormatted || ''}` : 'N/A',
        sanitizePdfText(exp.title),
        sanitizePdfText(payer?.name || 'Unknown'),
        catFormatted,
        splitTypeStr,
        `${currencySymbol}${Number(exp.amount || 0).toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Date & Time', 'Expense Title', 'Paid By', 'Category', 'Split Mode', 'Amount']],
      body: groupRows,
      theme: 'striped',
      headStyles: { fillColor: orangeAccent, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 54, fontStyle: 'bold' },
        2: { cellWidth: 32 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: [194, 65, 12] },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // SECTION 3: Individual Expenses (Private Personal Log)
  if (currentY + 35 > 275) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(purpleAccent[0], purpleAccent[1], purpleAccent[2]);
  doc.text('3. Individual Expenses Logs (Personal Private Items)', 14, currentY);
  currentY += 4;

  if (personalExpenses.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('No individual personal expenses logged.', 14, currentY + 4);
    currentY += 10;
  } else {
    const personalRows = personalExpenses.map((exp) => {
      const owner = room.members.find((m) => m && m.id === exp.paidBy);
      const catClean = sanitizePdfText(exp.category) || 'General';
      const catFormatted = catClean.charAt(0).toUpperCase() + catClean.slice(1);

      return [
        exp.dateFormatted ? `${exp.dateFormatted} ${exp.timeFormatted || ''}` : 'N/A',
        sanitizePdfText(exp.title),
        sanitizePdfText(owner?.name || 'User'),
        catFormatted,
        `${currencySymbol}${Number(exp.amount || 0).toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Date & Time', 'Expense Title', 'Logged By (User)', 'Category', 'Amount']],
      body: personalRows,
      theme: 'grid',
      headStyles: { fillColor: purpleAccent, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 62, fontStyle: 'bold' },
        2: { cellWidth: 36 },
        3: { cellWidth: 26 },
        4: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [126, 34, 206] },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // SECTION 4: Expenses Transactions Person-to-Person LOGS HISTORY
  if (currentY + 45 > 275) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
  doc.text('4. Expenses Transactions Person-to-Person LOGS HISTORY', 14, currentY);
  currentY += 4;

  // 4A. Member Net Financial Balances Table
  const memberBalances = approvedMembers.map((m) => {
    const totalPaid = groupExpenses
      .filter((e) => e.paidBy === m.id)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const receive = settlements
      .filter((s) => s.toId === m.id)
      .reduce((sum, s) => sum + s.amount, 0);

    const pay = settlements
      .filter((s) => s.fromId === m.id)
      .reduce((sum, s) => sum + s.amount, 0);

    const net = receive - pay;
    const statusStr = net > 0.01 ? `Owed +${currencySymbol}${net.toFixed(2)}` : net < -0.01 ? `Owes -${currencySymbol}${Math.abs(net).toFixed(2)}` : 'Settled (0.00)';
    const roleStr = m.id === room.hostId ? 'Host' : 'Member';

    return [
      sanitizePdfText(m.name),
      roleStr,
      `${currencySymbol}${totalPaid.toFixed(2)}`,
      statusStr,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Member Name', 'Role', 'Total Group Paid', 'Net Financial Balance Status']],
    body: memberBalances,
    theme: 'grid',
    headStyles: { fillColor: amberAccent, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 46, halign: 'right' },
      3: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 4B. Person-to-Person Active Settlement Plan Table
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Pending Person-to-Person Cash Transfers', 14, currentY);
  currentY += 3;

  if (settlements.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('All pending debts are 100% cleared! No active transfers needed.', 14, currentY + 4);
    currentY += 10;
  } else {
    const settlementRows = settlements.map((s) => [
      sanitizePdfText(s.fromName),
      '---> MUST PAY --->',
      sanitizePdfText(s.toName),
      `${currencySymbol}${s.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Payer (Debtor)', 'Action', 'Receiver (Creditor)', 'Exact Amount']],
      body: settlementRows,
      theme: 'grid',
      headStyles: { fillColor: emeraldAccent, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 46, fontStyle: 'bold' },
        1: { cellWidth: 36, halign: 'center', fontStyle: 'bold', textColor: [185, 28, 28] },
        2: { cellWidth: 46, fontStyle: 'bold' },
        3: { cellWidth: 54, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 4C. Settlement Payment History Log (Marked Paid Transactions)
  const settlementHistory = room.settlementHistory || [];
  if (currentY + 25 > 275) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Completed Settlement Payment History Log', 14, currentY);
  currentY += 3;

  if (settlementHistory.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('No settlement payments marked as paid yet.', 14, currentY + 4);
    currentY += 10;
  } else {
    const historyRows = settlementHistory.map((p) => [
      p.dateFormatted ? `${p.dateFormatted} ${p.timeFormatted || ''}` : 'N/A',
      sanitizePdfText(p.fromName),
      '---> PAID --->',
      sanitizePdfText(p.toName),
      `${currencySymbol}${Number(p.amount || 0).toFixed(2)}`,
      p.status || 'PAID',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Date & Time', 'From (Payer)', 'Action', 'To (Receiver)', 'Amount', 'Status']],
      body: historyRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 28, halign: 'center', textColor: [5, 150, 105] },
        3: { cellWidth: 40, fontStyle: 'bold' },
        4: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
        5: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105] },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // FOOTER
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`SettleKnot Trip Expense Audit Report | Page ${i} of ${pageCount}`, 14, 290);
  }

  doc.save(`SettleKnot_${room.code}_Expense_Report.pdf`);
}
