import 'client-only';

import type { AttendanceRecord, CareerRecord, CompanyTransaction, PocketTransaction, SavingsGoal, UserProfile } from '@/types/domain';

export type LocalReportData = {
  generatedOn: string;
  profile: UserProfile;
  attendance: AttendanceRecord[];
  companyTransactions: CompanyTransaction[];
  pocketTransactions: PocketTransaction[];
  savingsGoals: SavingsGoal[];
  careerRecords: CareerRecord[];
  companyBalance: number;
  pocketBalance: number;
  lifetimeEarnings: number;
};

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvCell(value: string | number): string {
  const raw = String(value);
  return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

function csvRow(values: Array<string | number>): string {
  return values.map(csvCell).join(',');
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function downloadCsvReport(data: LocalReportData): void {
  const rows = [
    csvRow(['Section', 'Date', 'Type', 'Description', 'Amount (PKR)', 'Direction']),
    ...data.companyTransactions.map((transaction) => csvRow(['Company ledger', transaction.occurredOn, transaction.type, transaction.note, transaction.amount, transaction.type === 'credit' ? 'In' : 'Out'])),
    ...data.pocketTransactions.map((transaction) => csvRow(['Personal pocket', transaction.occurredOn, transaction.type, transaction.note, transaction.amount, ['expense', 'udhaar-given'].includes(transaction.type) ? 'Out' : 'In'])),
    ...data.careerRecords.map((record) => csvRow(['Career history', `${record.startDate} to ${record.endDate}`, record.designation, `${record.companyName}${record.note ? ` — ${record.note}` : ''}`, record.monthlySalary, 'Monthly salary'])),
    ...data.savingsGoals.map((goal) => csvRow(['Savings goal', goal.targetDate ?? '', 'Goal', goal.name, goal.savedAmount, `Saved of ${goal.targetAmount}`])),
  ];
  downloadBlob(new Blob([`\uFEFF${rows.join('\n')}\n`], { type: 'text/csv;charset=utf-8' }), `salary-workspace-${todayStamp()}.csv`);
}

function pdfCurrency(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

function clampText(value: string, maxLength = 72): string {
  return value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 1))}…` : value;
}

export async function downloadPdfReport(data: LocalReportData): Promise<void> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const document = await PDFDocument.create();
  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.04, 0.09, 0.06);
  const green = rgb(0.1, 0.72, 0.38);
  const muted = rgb(0.33, 0.39, 0.35);
  let y = 790;
  const line = (text: string, options?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) => {
    page.drawText(clampText(text), { x: 44, y, size: options?.size ?? 10, font: options?.bold ? bold : regular, color: options?.color ?? dark });
    y -= (options?.size ?? 10) + 8;
  };

  page.drawRectangle({ x: 0, y: 780, width: 595.28, height: 61.89, color: dark });
  page.drawText('Live Salary Ticker', { x: 44, y: 808, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Private local workspace report', { x: 44, y: 790, size: 9, font: regular, color: rgb(0.72, 0.79, 0.75) });
  y = 752;
  line(`Prepared for ${data.profile.firstName} ${data.profile.lastName}`, { bold: true, size: 14, color: green });
  line(`Generated ${new Date(data.generatedOn).toLocaleString('en-PK')}`, { size: 9, color: muted });
  y -= 8;
  line('WORKSPACE SNAPSHOT', { bold: true, size: 10, color: green });
  line(`Company balance: ${pdfCurrency(data.companyBalance)}`);
  line(`Personal pocket: ${pdfCurrency(data.pocketBalance)}`);
  line(`Estimated career earnings: ${pdfCurrency(data.lifetimeEarnings)}`);
  line(`Attendance records: ${data.attendance.length} | Past roles: ${data.careerRecords.length} | Savings goals: ${data.savingsGoals.length}`);
  y -= 8;
  line('RECENT COMPANY LEDGER', { bold: true, size: 10, color: green });
  if (data.companyTransactions.length) {
    data.companyTransactions.slice(0, 5).forEach((transaction) => line(`${transaction.occurredOn}  ${transaction.type}  ${pdfCurrency(transaction.amount)}  ${transaction.note || 'No note'}`, { size: 9 }));
  } else line('No company transactions recorded.', { size: 9, color: muted });
  y -= 8;
  line('RECENT PERSONAL POCKET', { bold: true, size: 10, color: green });
  if (data.pocketTransactions.length) {
    data.pocketTransactions.slice(0, 5).forEach((transaction) => line(`${transaction.occurredOn}  ${transaction.type}  ${pdfCurrency(transaction.amount)}  ${transaction.note || 'No note'}`, { size: 9 }));
  } else line('No pocket transactions recorded.', { size: 9, color: muted });
  y -= 8;
  line('SAVINGS GOALS', { bold: true, size: 10, color: green });
  if (data.savingsGoals.length) {
    data.savingsGoals.slice(0, 4).forEach((goal) => line(`${goal.name}: ${pdfCurrency(goal.savedAmount)} saved of ${pdfCurrency(goal.targetAmount)}`, { size: 9 }));
  } else line('No savings goals recorded.', { size: 9, color: muted });
  page.drawText('Generated locally. Your data stays on this device.', { x: 44, y: 30, size: 8, font: regular, color: muted });
  const bytes = Uint8Array.from(await document.save());
  downloadBlob(new Blob([bytes.buffer], { type: 'application/pdf' }), `salary-workspace-${todayStamp()}.pdf`);
}

function escapeSvg(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function downloadVoucherImage(transaction: CompanyTransaction, profile: UserProfile): void {
  const isCredit = transaction.type === 'credit';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><rect width="1200" height="760" fill="#07150d"/><rect x="38" y="38" width="1124" height="684" rx="26" fill="#0d2215" stroke="#2fd676" stroke-width="2"/><text x="90" y="126" fill="#d9fbe5" font-family="Arial, sans-serif" font-size="34" font-weight="700">Live Salary Ticker</text><text x="90" y="164" fill="#8cb79b" font-family="Arial, sans-serif" font-size="20">Local company voucher</text><line x1="90" y1="205" x2="1110" y2="205" stroke="#29553b" stroke-width="2"/><text x="90" y="270" fill="#8cb79b" font-family="Arial, sans-serif" font-size="18">ENTRY TYPE</text><text x="90" y="310" fill="#d9fbe5" font-family="Arial, sans-serif" font-size="30" font-weight="700">${escapeSvg(transaction.type.toUpperCase())}</text><text x="90" y="385" fill="#8cb79b" font-family="Arial, sans-serif" font-size="18">AMOUNT</text><text x="90" y="448" fill="${isCredit ? '#5af39a' : '#ff8d8d'}" font-family="Arial, sans-serif" font-size="54" font-weight="700">${isCredit ? '+' : '−'}PKR ${Math.round(transaction.amount).toLocaleString('en-PK')}</text><text x="710" y="270" fill="#8cb79b" font-family="Arial, sans-serif" font-size="18">DATE</text><text x="710" y="310" fill="#d9fbe5" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeSvg(transaction.occurredOn)}</text><text x="710" y="385" fill="#8cb79b" font-family="Arial, sans-serif" font-size="18">RECORDED FOR</text><text x="710" y="425" fill="#d9fbe5" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeSvg(`${profile.firstName} ${profile.lastName}`.trim())}</text><text x="90" y="550" fill="#8cb79b" font-family="Arial, sans-serif" font-size="18">NOTE</text><text x="90" y="590" fill="#d9fbe5" font-family="Arial, sans-serif" font-size="25">${escapeSvg(clampText(transaction.note || 'No note added', 78))}</text><text x="90" y="674" fill="#77a888" font-family="Arial, sans-serif" font-size="17">Saved locally • Printable image • ${escapeSvg(new Date().toLocaleDateString('en-PK'))}</text></svg>`;
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `voucher-${transaction.occurredOn}-${transaction.id.slice(0, 8)}.svg`);
}
