'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { useCompanyTransactions } from '@/hooks/use-company-transactions';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { usePocketRecords } from '@/hooks/use-pocket-records';
import { calculateLiveEarnings, type LiveEarningsSnapshot } from '@/lib/calculations/earnings';
import { getCompanyBalance } from '@/lib/calculations/company-balance';
import { getPocketBalance } from '@/lib/calculations/pocket-balance';
import { formatCurrency, formatCurrencyAmount } from '@/lib/formatting/currency';

const checklist = [
  ['Create your profile', 'Name, employee ID, and designation'],
  ['Set salary rules', 'Monthly, daily, and weekly-off rules'],
  ['Start tracking', 'Attendance and cash activity stay on-device'],
];

export function DashboardContent() {
  const { records, isLoading, isOnboarded } = useCurrentAppRecords();
  const { transactions, isLoading: companyLoading } = useCompanyTransactions();
  const { transactions: pocketTransactions, isLoading: pocketLoading } = usePocketRecords();
  const now = useLiveClock();

  if (isLoading) return <section className="dashboard-loading" aria-live="polite">Preparing your local workspace…</section>;
  if (!isOnboarded || !records?.profile || !records.salarySettings) return <EmptyDashboard />;

  const { profile, salarySettings } = records;
  const liveEarnings = now ? calculateLiveEarnings(salarySettings, profile, now) : null;
  const salaryAmount = salarySettings.salaryMode === 'daily-rate'
    ? salarySettings.dailyRate ?? 0
    : salarySettings.baseSalary;
  const companyBalance = getCompanyBalance(transactions);
  const pocketBalance = getPocketBalance(pocketTransactions);

  return (
    <>
      <section className="page-heading dashboard-profile-heading">
        <div className="profile-heading-copy">
          <span className="profile-avatar" aria-hidden="true">{profile.firstName.slice(0, 1).toUpperCase()}</span>
          <div>
            <p className="eyebrow">PRIVATE FINANCE WORKSPACE</p>
            <h1>Welcome, {profile.firstName}.</h1>
            <p className="page-subtitle">{profile.designation} · ID {profile.employeeId}</p>
          </div>
        </div>
        <Link className="icon-button" href="/settings" aria-label="Open profile settings"><AppIcon name="settings" aria-hidden="true" size={18} /></Link>
      </section>

      <section className="ticker-card" aria-labelledby="ticker-title">
        <div className="ticker-orb ticker-orb-left" /><div className="ticker-orb ticker-orb-right" />
        <div className="ticker-topline"><div><p className="eyebrow ticker-label" id="ticker-title">NET LIVE EARNINGS</p><span className="ticker-period">{liveEarnings ? getEarningsMessage(liveEarnings) : 'Syncing your local clock…'}</span></div><span className="local-pill"><span className="pulse-dot" />Local live rate</span></div>
        <div className="ticker-amount" aria-label={liveEarnings ? `Today’s earned salary: ${formatCurrency(liveEarnings.earned)}` : 'Calculating today’s earned salary'}><span className="currency">PKR</span><span>{liveEarnings ? formatCurrencyAmount(liveEarnings.earned) : '0.00'}</span></div>
        <div className="ticker-footer"><span className="rate-badge"><AppIcon name="arrow-up-right" aria-hidden="true" size={15} />{liveEarnings ? `${formatCurrency(liveEarnings.hourlyRate)} / hour` : 'Calculating rate'}</span><span className="shift-badge"><AppIcon name="calendar" aria-hidden="true" size={15} />{liveEarnings ? getShiftBadge(liveEarnings) : `${salarySettings.shiftDurationHours}h shift`}</span></div>
        {liveEarnings && <div className="ticker-progress" aria-label={`Shift progress: ${Math.round(liveEarnings.progress * 100)} percent`}><span><i style={{ width: `${liveEarnings.progress * 100}%` }} /></span><small>{Math.round(liveEarnings.progress * 100)}% of today&apos;s shift</small></div>}
      </section>

      <section className="overview-grid" aria-label="Salary configuration overview">
        <Link className="metric-card metric-card-link" href="/company"><div className="metric-icon company-icon"><AppIcon name="building" aria-hidden="true" size={20} /></div><div><p>Company balance</p><strong>{companyLoading ? 'PKR —' : formatCurrency(companyBalance)}</strong><span>{companyBalance < 0 ? 'Deductions exceed credits' : 'Available credit'}</span></div></Link>
        <Link className="metric-card metric-card-link" href="/pocket"><div className="metric-icon pocket-icon"><AppIcon name="wallet" aria-hidden="true" size={20} /></div><div><p>Personal pocket</p><strong>{pocketLoading ? 'PKR —' : formatCurrency(pocketBalance)}</strong><span>{pocketBalance < 0 ? 'Outgoing entries exceed cash in' : 'Local personal cash'}</span></div></Link>
        <article className="metric-card"><div className="metric-icon company-icon"><AppIcon name="dollar" aria-hidden="true" size={20} /></div><div><p>Base salary</p><strong>{formatCurrency(salaryAmount)}</strong><span>{salarySettings.salaryMode === 'fixed-monthly' ? 'Per month' : 'Per day'}</span></div></article>
        <article className="metric-card"><div className="metric-icon pocket-icon"><AppIcon name="wallet" aria-hidden="true" size={20} /></div><div><p>Today&apos;s scheduled pay</p><strong>{liveEarnings ? formatCurrency(liveEarnings.dailyRate) : 'PKR —'}</strong><span>{salarySettings.isWeeklyOffPaid ? 'Weekly off is paid' : 'Weekly off is unpaid'}</span></div></article>
      </section>

      <section className="content-panel next-phase-panel" aria-labelledby="next-title"><div className="panel-heading"><div><p className="eyebrow">LIVE NOW</p><h2 id="next-title">Your private workspace is complete.</h2></div><span className="progress-label">Phases 4–8 active</span></div><p>Track work, company money, personal cash, savings, career history, and local exports from one offline-first workspace.</p><Link className="secondary-button" href="/reports">Open reports <AppIcon name="arrow-right" aria-hidden="true" size={16} /></Link></section>
    </>
  );
}

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const stop = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };

    const tick = () => {
      const currentTime = new Date();
      setNow(currentTime);
      if (document.visibilityState === 'hidden') return;
      timer = window.setTimeout(tick, 1_000 - (currentTime.getTime() % 1_000) + 12);
    };

    const handleVisibilityChange = () => {
      stop();
      if (document.visibilityState !== 'hidden') tick();
    };

    tick();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return now;
}

function getEarningsMessage(snapshot: LiveEarningsSnapshot): string {
  switch (snapshot.status) {
    case 'earning': return `Earning since ${formatTime(snapshot.shiftStart)}`;
    case 'before-shift': return `Your shift starts at ${formatTime(snapshot.shiftStart)}`;
    case 'shift-complete': return `Today’s shift ended at ${formatTime(snapshot.shiftEnd)}`;
    case 'weekly-off-paid': return 'Paid weekly off';
    case 'weekly-off-unpaid': return 'Weekly off — no scheduled pay';
    case 'before-joining': return 'Earnings begin on your joining date';
  }
}

function getShiftBadge(snapshot: LiveEarningsSnapshot): string {
  if (snapshot.status === 'earning') return `${Math.round(snapshot.progress * 100)}% through shift`;
  if (snapshot.status === 'weekly-off-paid') return 'Paid weekly off';
  if (snapshot.status === 'weekly-off-unpaid') return 'Weekly off';
  return `${formatTime(snapshot.shiftStart)} – ${formatTime(snapshot.shiftEnd)}`;
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit' }).format(value);
}

function EmptyDashboard() {
  return (
    <>
      <section className="page-heading"><div><p className="eyebrow">PRIVATE FINANCE WORKSPACE</p><h1>Good evening.</h1><p className="page-subtitle">Your salary, attendance, and cash—always within reach.</p></div></section>
      <section className="ticker-card" aria-labelledby="ticker-title"><div className="ticker-orb ticker-orb-left" /><div className="ticker-orb ticker-orb-right" /><div className="ticker-topline"><div><p className="eyebrow ticker-label" id="ticker-title">NET LIVE EARNINGS</p><span className="ticker-period">Set up your salary to begin</span></div><span className="local-pill"><span className="pulse-dot" />Local only</span></div><div className="ticker-amount"><span className="currency">PKR</span><span>0.00</span></div><div className="ticker-footer"><span className="rate-badge"><AppIcon name="arrow-up-right" aria-hidden="true" size={15} />Rate ready after setup</span><span className="shift-badge"><AppIcon name="calendar" aria-hidden="true" size={15} />No shift configured</span></div></section>
      <section className="action-strip" aria-label="Primary action"><div><p className="eyebrow">FIRST TIME HERE?</p><h2>Build your private salary wallet.</h2></div><Link className="primary-button" href="/onboarding"><AppIcon name="plus" aria-hidden="true" size={18} />Set up now</Link></section>
      <section className="content-panel setup-panel" aria-labelledby="setup-title"><div className="panel-heading"><div><p className="eyebrow">GET STARTED</p><h2 id="setup-title">Your workspace checklist</h2></div><span className="progress-label">0 / 3 complete</span></div><div className="checklist">{checklist.map(([label, detail], index) => <Link className="checklist-row" href="/onboarding" key={label}><span className="step-number" aria-hidden="true">{index + 1}</span><div><h3>{label}</h3><p>{detail}</p></div><span className="row-arrow" aria-hidden="true">→</span></Link>)}</div></section>
    </>
  );
}
