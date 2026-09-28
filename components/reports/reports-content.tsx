'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { calculateCurrentRoleEarnings, getCareerLifetimeEarnings, getEstimatedMonthlySalary } from '@/lib/calculations/career-earnings';
import { getCompanyBalance } from '@/lib/calculations/company-balance';
import { getPocketBalance } from '@/lib/calculations/pocket-balance';
import { downloadCsvReport, downloadPdfReport, downloadVoucherImage, type LocalReportData } from '@/lib/reports/local-exports';
import { formatCurrency } from '@/lib/formatting/currency';
import { useAllAttendanceRecords } from '@/hooks/use-all-attendance-records';
import { useCareerRecords } from '@/hooks/use-career-records';
import { useCompanyTransactions } from '@/hooks/use-company-transactions';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { usePocketRecords } from '@/hooks/use-pocket-records';

export function ReportsContent() {
  const { records: appRecords, isLoading, isOnboarded } = useCurrentAppRecords();
  const { records: attendance, isLoading: attendanceLoading } = useAllAttendanceRecords();
  const { transactions: companyTransactions, isLoading: companyLoading } = useCompanyTransactions();
  const { transactions: pocketTransactions, goals: savingsGoals, isLoading: pocketLoading } = usePocketRecords();
  const { records: careerRecords, isLoading: careerLoading } = useCareerRecords();
  const [voucherId, setVoucherId] = useState('');
  const [status, setStatus] = useState('');
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);

  const profile = appRecords?.profile;
  const salarySettings = appRecords?.salarySettings;
  const reportTemplate = useMemo<Omit<LocalReportData, 'generatedOn' | 'lifetimeEarnings'> | null>(() => profile ? ({ profile, attendance, companyTransactions, pocketTransactions, savingsGoals, careerRecords, companyBalance: getCompanyBalance(companyTransactions), pocketBalance: getPocketBalance(pocketTransactions) }) : null, [attendance, careerRecords, companyTransactions, pocketTransactions, profile, savingsGoals]);
  const selectedVoucher = companyTransactions.find((transaction) => transaction.id === voucherId) ?? companyTransactions[0];

  if (isLoading || attendanceLoading || companyLoading || pocketLoading || careerLoading) return <section className="dashboard-loading" aria-live="polite">Preparing your local report data…</section>;
  if (!isOnboarded || !profile || !salarySettings || !reportTemplate) return <SetupRequired />;

  const createReport = (): LocalReportData => {
    const now = new Date();
    return { ...reportTemplate, generatedOn: now.toISOString(), lifetimeEarnings: getCareerLifetimeEarnings(careerRecords) + calculateCurrentRoleEarnings(profile.joiningDate, getEstimatedMonthlySalary(salarySettings), now) };
  };
  const exportCsv = () => { downloadCsvReport(createReport()); setStatus('CSV report downloaded.'); };
  const exportPdf = async () => {
    setIsPreparingPdf(true); setStatus('');
    try { await downloadPdfReport(createReport()); setStatus('PDF report downloaded.'); }
    catch { setStatus('The PDF could not be created. Please try again.'); }
    finally { setIsPreparingPdf(false); }
  };
  const exportVoucher = () => {
    if (!selectedVoucher) { setStatus('Add a company entry before making a voucher image.'); return; }
    downloadVoucherImage(selectedVoucher, profile); setStatus('Printable voucher image downloaded.');
  };

  return <section className="reports-page"><header className="page-heading"><div><p className="eyebrow">LOCAL REPORTS</p><h1>Take your records with you.</h1><p className="page-subtitle">Exports are prepared in your browser from this device&apos;s records. Nothing is sent to a server.</p></div></header><section className="reports-overview"><ReportMetric label="Company balance" value={formatCurrency(reportTemplate.companyBalance)} /><ReportMetric label="Personal pocket" value={formatCurrency(reportTemplate.pocketBalance)} /><ReportMetric label="Saved records" value={String(attendance.length + companyTransactions.length + pocketTransactions.length + careerRecords.length)} /></section><section className="report-export-grid"><article className="report-export-card"><span className="report-icon"><AppIcon name="file" aria-hidden="true" size={24} /></span><p className="eyebrow">SPREADSHEET READY</p><h2>CSV report</h2><p>Download company, pocket, career, and savings records in a spreadsheet-friendly CSV file.</p><button className="primary-button" type="button" onClick={exportCsv}>Download CSV <AppIcon name="arrow-right" aria-hidden="true" size={17} /></button></article><article className="report-export-card report-export-emphasis"><span className="report-icon"><AppIcon name="file" aria-hidden="true" size={24} /></span><p className="eyebrow">PRINTABLE SUMMARY</p><h2>PDF report</h2><p>Get a clean one-page snapshot of balances, attendance, and recent local activity.</p><button className="primary-button" type="button" onClick={exportPdf} disabled={isPreparingPdf}>{isPreparingPdf ? 'Preparing…' : 'Download PDF'} <AppIcon name="arrow-right" aria-hidden="true" size={17} /></button></article><article className="report-export-card"><span className="report-icon"><AppIcon name="building" aria-hidden="true" size={24} /></span><p className="eyebrow">VOUCHER IMAGE</p><h2>Printable voucher</h2><p>Choose a company entry and save a crisp SVG image that can be printed or shared.</p><label className="field"><span>Company entry</span><select value={selectedVoucher?.id ?? ''} onChange={(event) => setVoucherId(event.target.value)} disabled={!companyTransactions.length}><option value="">{companyTransactions.length ? 'Most recent entry' : 'No company entries yet'}</option>{companyTransactions.map((transaction) => <option key={transaction.id} value={transaction.id}>{transaction.occurredOn} · {transaction.type} · {formatCurrency(transaction.amount)}</option>)}</select></label><button className="secondary-button" type="button" onClick={exportVoucher} disabled={!companyTransactions.length}>Download voucher</button></article></section><p className="report-status" role="status">{status}</p><section className="report-contents"><div><p className="eyebrow">INCLUDED IN PDF</p><h2>Clear, local, useful.</h2></div><ul><li>Current company and personal balances</li><li>Attendance, career, and savings counts</li><li>Five most recent company and pocket entries</li><li>Up to four savings-goal progress summaries</li></ul></section></section>;
}

function ReportMetric({ label, value }: { label: string; value: string }) { return <article><span>{label}</span><strong>{value}</strong><small>from local records</small></article>; }

function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="file" aria-hidden="true" size={28} /></span><p className="eyebrow">LOCAL REPORTS</p><h1>Set up your workspace first.</h1><p>Reports use the private records created after local salary setup.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }
