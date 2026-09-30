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
import { formatTime } from '@/lib/formatting/date';
import { useAppTranslation } from '@/hooks/use-app-translation';
import type { AppLanguage } from '@/types/domain';

const checklist = [
  ['Create your profile', 'Name, employee ID, and designation'],
  ['Set salary rules', 'Monthly, daily, and weekly-off rules'],
  ['Start tracking', 'Attendance and cash activity stay on-device'],
];

const checklistUr = [
  ['اپنا پروفائل بنائیں', 'نام، ملازم آئی ڈی اور عہدہ'],
  ['تنخواہ کے اصول طے کریں', 'ماہانہ، یومیہ اور ہفتہ وار چھٹی کے اصول'],
  ['ٹریکنگ شروع کریں', 'حاضری اور نقد کی سرگرمی ڈیوائس پر رہتی ہے'],
];

export function DashboardContent() {
  const { t } = useAppTranslation();
  const { records, isLoading, isOnboarded } = useCurrentAppRecords();
  const { transactions, isLoading: companyLoading } = useCompanyTransactions();
  const { transactions: pocketTransactions, isLoading: pocketLoading } = usePocketRecords();
  const now = useLiveClock();
  const language = records?.appSettings?.language;

  if (isLoading) return <section className="dashboard-loading" aria-live="polite">{language === 'ur' ? 'آپ کا مقامی ورک اسپیس تیار ہو رہا ہے…' : 'Preparing your local workspace…'}</section>;
  if (!isOnboarded || !records?.profile || !records.salarySettings) return <EmptyDashboard language={language} />;

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
            <p className="eyebrow">{t('privateWorkspace')}</p>
            <h1>{t('welcome')}, {profile.firstName}.</h1>
            <p className="page-subtitle">{profile.designation} · ID {profile.employeeId}</p>
          </div>
        </div>
        <Link className="icon-button" href="/settings" aria-label={language === 'ur' ? 'پروفائل کی ترتیبات کھولیں' : 'Open profile settings'}><AppIcon name="settings" aria-hidden="true" size={18} /></Link>
      </section>

      <section className="ticker-card" aria-labelledby="ticker-title">
        <div className="ticker-orb ticker-orb-left" /><div className="ticker-orb ticker-orb-right" />
        <div className="ticker-topline"><div><p className="eyebrow ticker-label" id="ticker-title">NET LIVE EARNINGS</p><span className="ticker-period">{liveEarnings ? getEarningsMessage(liveEarnings, language) : (language === 'ur' ? 'آپ کی گھڑی ہم آہنگ ہو رہی ہے…' : 'Syncing your local clock…')}</span></div><span className="local-pill"><span className="pulse-dot" />{language === 'ur' ? 'مقامی لائیو شرح' : 'Local live rate'}</span></div>
        <div className="ticker-amount" aria-label={liveEarnings ? (language === 'ur' ? `آج کی کمائی ہوئی تنخواہ: ${formatCurrency(liveEarnings.earned)}` : `Today’s earned salary: ${formatCurrency(liveEarnings.earned)}`) : (language === 'ur' ? 'آج کی کمائی ہوئی تنخواہ کا حساب ہو رہا ہے' : 'Calculating today’s earned salary')}><span className="currency">PKR</span><span>{liveEarnings ? formatCurrencyAmount(liveEarnings.earned) : '0.00'}</span></div>
        <div className="ticker-footer"><span className="rate-badge"><AppIcon name="arrow-up-right" aria-hidden="true" size={15} />{liveEarnings ? `${formatCurrency(liveEarnings.hourlyRate)} / ${language === 'ur' ? 'گھنٹہ' : 'hour'}` : (language === 'ur' ? 'شرح کا حساب ہو رہا ہے' : 'Calculating rate')}</span><span className="shift-badge"><AppIcon name="calendar" aria-hidden="true" size={15} />{liveEarnings ? getShiftBadge(liveEarnings, language) : `${salarySettings.shiftDurationHours}${language === 'ur' ? ' گھنٹے کی شفٹ' : 'h shift'}`}</span></div>
        {liveEarnings && <div className="ticker-progress" aria-label={language === 'ur' ? `شفٹ کی پیشرفت: ${Math.round(liveEarnings.progress * 100)} فیصد` : `Shift progress: ${Math.round(liveEarnings.progress * 100)} percent`}><span><i style={{ width: `${liveEarnings.progress * 100}%` }} /></span><small>{language === 'ur' ? `آج کی شفٹ کا ${Math.round(liveEarnings.progress * 100)}%` : `${Math.round(liveEarnings.progress * 100)}% of today's shift`}</small></div>}
      </section>

      <section className="overview-grid" aria-label={language === 'ur' ? 'تنخواہ کی تشکیل کا جائزہ' : 'Salary configuration overview'}>
        <Link className="metric-card metric-card-link" href="/company"><div className="metric-icon company-icon"><AppIcon name="building" aria-hidden="true" size={20} /></div><div><p>{t('companyBalance')}</p><strong>{companyLoading ? 'PKR —' : formatCurrency(companyBalance)}</strong><span>{companyBalance < 0 ? (language === 'ur' ? 'کٹوتیاں کریڈٹس سے زیادہ ہیں' : 'Deductions exceed credits') : t('availableCredit')}</span></div></Link>
        <Link className="metric-card metric-card-link" href="/pocket"><div className="metric-icon pocket-icon"><AppIcon name="wallet" aria-hidden="true" size={20} /></div><div><p>{t('personalPocket')}</p><strong>{pocketLoading ? 'PKR —' : formatCurrency(pocketBalance)}</strong><span>{pocketBalance < 0 ? (language === 'ur' ? 'اخراجات وصول شدہ رقم سے زیادہ ہیں' : 'Outgoing entries exceed cash in') : (language === 'ur' ? 'مقامی ذاتی نقد رقم' : 'Local personal cash')}</span></div></Link>
        <article className="metric-card"><div className="metric-icon company-icon"><AppIcon name="dollar" aria-hidden="true" size={20} /></div><div><p>{t('baseSalary')}</p><strong>{formatCurrency(salaryAmount)}</strong><span>{salarySettings.salaryMode === 'fixed-monthly' ? t('perMonth') : t('perDay')}</span></div></article>
        <article className="metric-card"><div className="metric-icon pocket-icon"><AppIcon name="wallet" aria-hidden="true" size={20} /></div><div><p>{language === 'ur' ? 'آج کی طے شدہ رقم' : "Today's scheduled pay"}</p><strong>{liveEarnings ? formatCurrency(liveEarnings.dailyRate) : 'PKR —'}</strong><span>{salarySettings.isWeeklyOffPaid ? (language === 'ur' ? 'ہفتہ وار چھٹی با معاوضہ ہے' : 'Weekly off is paid') : (language === 'ur' ? 'ہفتہ وار چھٹی بغیر معاوضہ ہے' : 'Weekly off is unpaid')}</span></div></article>
      </section>

      <section className="content-panel next-phase-panel" aria-labelledby="next-title"><div className="panel-heading"><div><p className="eyebrow">{language === 'ur' ? 'ابھی لائیو' : 'LIVE NOW'}</p><h2 id="next-title">{language === 'ur' ? 'آپ کا نجی ورک اسپیس مکمل ہے۔' : 'Your private workspace is complete.'}</h2></div><span className="progress-label">{language === 'ur' ? 'مراحل فعال ہیں' : 'Phases 4–8 active'}</span></div><p>{language === 'ur' ? 'کام، کمپنی رقم، ذاتی کیش، بچت، کیریئر تاریخ اور مقامی ایکسپورٹس سب ایک آف لائن ورک اسپیس سے ٹریک کریں۔' : 'Track work, company money, personal cash, savings, career history, and local exports from one offline-first workspace.'}</p><Link className="secondary-button" href="/reports">{t('openReports')} <AppIcon name="arrow-right" aria-hidden="true" size={16} /></Link></section>
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

function getEarningsMessage(snapshot: LiveEarningsSnapshot, language?: AppLanguage): string {
  if (language === 'ur') {
    switch (snapshot.status) {
      case 'earning': return `کمائی جاری از ${formatTime(snapshot.shiftStart)}`;
      case 'before-shift': return `آپ کی شفٹ شروع ہوگی بوقت ${formatTime(snapshot.shiftStart)}`;
      case 'shift-complete': return `آج کی شفٹ ختم ہوئی بوقت ${formatTime(snapshot.shiftEnd)}`;
      case 'weekly-off-paid': return 'با معاوضہ ہفتہ وار چھٹی';
      case 'weekly-off-unpaid': return 'ہفتہ وار چھٹی — کوئی طے شدہ رقم نہیں';
      case 'before-joining': return 'آمدنی شمولیت کی تاریخ سے شروع ہوتی ہے';
    }
  }
  switch (snapshot.status) {
    case 'earning': return `Earning since ${formatTime(snapshot.shiftStart)}`;
    case 'before-shift': return `Your shift starts at ${formatTime(snapshot.shiftStart)}`;
    case 'shift-complete': return `Today’s shift ended at ${formatTime(snapshot.shiftEnd)}`;
    case 'weekly-off-paid': return 'Paid weekly off';
    case 'weekly-off-unpaid': return 'Weekly off — no scheduled pay';
    case 'before-joining': return 'Earnings begin on your joining date';
  }
}

function getShiftBadge(snapshot: LiveEarningsSnapshot, language?: AppLanguage): string {
  if (language === 'ur') {
    if (snapshot.status === 'earning') return `شفٹ ${Math.round(snapshot.progress * 100)}% مکمل`;
    if (snapshot.status === 'weekly-off-paid') return 'با معاوضہ ہفتہ وار چھٹی';
    if (snapshot.status === 'weekly-off-unpaid') return 'ہفتہ وار چھٹی';
    return `${formatTime(snapshot.shiftStart)} – ${formatTime(snapshot.shiftEnd)}`;
  }
  if (snapshot.status === 'earning') return `${Math.round(snapshot.progress * 100)}% through shift`;
  if (snapshot.status === 'weekly-off-paid') return 'Paid weekly off';
  if (snapshot.status === 'weekly-off-unpaid') return 'Weekly off';
  return `${formatTime(snapshot.shiftStart)} – ${formatTime(snapshot.shiftEnd)}`;
}

function EmptyDashboard({ language }: { language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const list = isUrdu ? checklistUr : checklist;

  return (
    <>
      <section className="page-heading"><div><p className="eyebrow">PRIVATE FINANCE WORKSPACE</p><h1>{isUrdu ? 'خوش آمدید۔' : 'Good evening.'}</h1><p className="page-subtitle">{isUrdu ? 'آپ کی تنخواہ، حاضری اور کیش — ہمیشہ آپ کی پہنچ میں۔' : 'Your salary, attendance, and cash—always within reach.'}</p></div></section>
      <section className="ticker-card" aria-labelledby="ticker-title"><div className="ticker-orb ticker-orb-left" /><div className="ticker-orb ticker-orb-right" /><div className="ticker-topline"><div><p className="eyebrow ticker-label" id="ticker-title">NET LIVE EARNINGS</p><span className="ticker-period">{isUrdu ? 'شروع کرنے کے لیے اپنی تنخواہ سیٹ اپ کریں' : 'Set up your salary to begin'}</span></div><span className="local-pill"><span className="pulse-dot" />{isUrdu ? 'صرف مقامی' : 'Local only'}</span></div><div className="ticker-amount"><span className="currency">PKR</span><span>0.00</span></div><div className="ticker-footer"><span className="rate-badge"><AppIcon name="arrow-up-right" aria-hidden="true" size={15} />{isUrdu ? 'سیٹ اپ کے بعد شرح تیار ہے' : 'Rate ready after setup'}</span><span className="shift-badge"><AppIcon name="calendar" aria-hidden="true" size={15} />{isUrdu ? 'کوئی شفٹ طے نہیں' : 'No shift configured'}</span></div></section>
      <section className="action-strip" aria-label={isUrdu ? 'بنیادی کارروائی' : 'Primary action'}><div><p className="eyebrow">{isUrdu ? 'پہلی بار آئے ہیں؟' : 'FIRST TIME HERE?'}</p><h2>{isUrdu ? 'اپنا نجی سیلری والٹ بنائیں۔' : 'Build your private salary wallet.'}</h2></div><Link className="primary-button" href="/onboarding"><AppIcon name="plus" aria-hidden="true" size={18} />{isUrdu ? 'ابھی سیٹ اپ کریں' : 'Set up now'}</Link></section>
      <section className="content-panel setup-panel" aria-labelledby="setup-title"><div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'شروع کریں' : 'GET STARTED'}</p><h2 id="setup-title">{isUrdu ? 'آپ کی ورک اسپیس فہرست' : 'Your workspace checklist'}</h2></div><span className="progress-label">{isUrdu ? '0 / 3 مکمل' : '0 / 3 complete'}</span></div><div className="checklist">{list.map(([label, detail], index) => <Link className="checklist-row" href="/onboarding" key={label}><span className="step-number" aria-hidden="true">{index + 1}</span><div><h3>{label}</h3><p>{detail}</p></div><span className="row-arrow" aria-hidden="true">→</span></Link>)}</div></section>
    </>
  );
}
