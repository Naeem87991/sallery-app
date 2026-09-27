'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/ui/app-icon';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { formatCurrency } from '@/lib/formatting/currency';

const checklist = [
  ['Create your profile', 'Name, employee ID, and designation'],
  ['Set salary rules', 'Monthly, daily, and weekly-off rules'],
  ['Start tracking', 'Attendance and cash activity stay on-device'],
];

export function DashboardContent() {
  const { records, isLoading, isOnboarded } = useCurrentAppRecords();

  if (isLoading) return <section className="dashboard-loading" aria-live="polite">Preparing your local workspace…</section>;
  if (!isOnboarded || !records?.profile || !records.salarySettings) return <EmptyDashboard />;

  const { profile, salarySettings } = records;
  const salaryAmount = salarySettings.salaryMode === 'daily-rate'
    ? salarySettings.dailyRate ?? 0
    : salarySettings.baseSalary;

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
        <div className="ticker-topline"><div><p className="eyebrow ticker-label" id="ticker-title">NET LIVE EARNINGS</p><span className="ticker-period">Live calculation begins in Phase 3</span></div><span className="local-pill"><span className="pulse-dot" />Saved locally</span></div>
        <div className="ticker-amount" aria-label="Live salary calculation starts in Phase 3"><span className="currency">PKR</span><span>0.00</span></div>
        <div className="ticker-footer"><span className="rate-badge"><AppIcon name="arrow-up-right" aria-hidden="true" size={15} />{salarySettings.salaryMode === 'fixed-monthly' ? 'Fixed monthly' : 'Daily rate'} configured</span><span className="shift-badge"><AppIcon name="calendar" aria-hidden="true" size={15} />{salarySettings.shiftDurationHours}h shift</span></div>
      </section>

      <section className="overview-grid" aria-label="Salary configuration overview">
        <article className="metric-card"><div className="metric-icon company-icon"><AppIcon name="dollar" aria-hidden="true" size={20} /></div><div><p>Base salary</p><strong>{formatCurrency(salaryAmount)}</strong><span>{salarySettings.salaryMode === 'fixed-monthly' ? 'Per month' : 'Per day'}</span></div></article>
        <article className="metric-card"><div className="metric-icon pocket-icon"><AppIcon name="wallet" aria-hidden="true" size={20} /></div><div><p>Weekly off</p><strong>{salarySettings.isWeeklyOffPaid ? 'Paid' : 'Unpaid'}</strong><span>Attendance defaults ready</span></div></article>
      </section>

      <section className="content-panel next-phase-panel" aria-labelledby="next-title"><div className="panel-heading"><div><p className="eyebrow">UP NEXT</p><h2 id="next-title">Your setup is safely stored.</h2></div><span className="progress-label">Phase 2 complete</span></div><p>Attendance, exact timestamp-based earning, and company balances will activate in the next implementation phase.</p><Link className="secondary-button" href="/settings">Review salary settings <AppIcon name="arrow-right" aria-hidden="true" size={16} /></Link></section>
    </>
  );
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
