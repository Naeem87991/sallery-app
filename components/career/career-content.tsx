'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { calculateCareerRecordEarnings, calculateCurrentRoleEarnings, getCareerLifetimeEarnings, getEstimatedMonthlySalary } from '@/lib/calculations/career-earnings';
import { addCareerRecord, deleteCareerRecord } from '@/lib/database/repository';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatDate } from '@/lib/formatting/date';
import { useCareerRecords } from '@/hooks/use-career-records';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { useAppTranslation } from '@/hooks/use-app-translation';
import type { AppLanguage, CareerRecord } from '@/types/domain';

export function CareerContent() {
  const { t } = useAppTranslation();
  const { records: appRecords, isLoading, isOnboarded } = useCurrentAppRecords();
  const { records, isLoading: recordsLoading } = useCareerRecords();
  const today = useToday();
  if (isLoading || recordsLoading) return <section className="dashboard-loading" aria-live="polite">{t('loadingCareer')}</section>;
  const profile = appRecords?.profile;
  const salarySettings = appRecords?.salarySettings;
  if (!isOnboarded || !profile || !salarySettings) return <SetupRequired />;

  const language = appRecords?.appSettings?.language;
  const isUrdu = language === 'ur';
  const historicalTotal = getCareerLifetimeEarnings(records);
  const currentMonthlySalary = getEstimatedMonthlySalary(salarySettings);
  const currentRoleEarnings = today ? calculateCurrentRoleEarnings(profile.joiningDate, currentMonthlySalary, today) : 0;

  return (
    <section className="career-page">
      <header className="page-heading"><div><p className="eyebrow">{t('careerPage')}</p><h1>{t('careerTitle')}</h1><p className="page-subtitle">{t('careerSubtitle')}</p></div></header>
      <section className="career-hero">
        <div><p className="eyebrow">{t('estimatedLifetimeEarnings')}</p><strong>{formatCurrency(historicalTotal + currentRoleEarnings)}</strong><p>{isUrdu ? 'گزشتہ عہدے مع موجودہ ملازمت۔ گزشتہ عہدوں کے کل کے لیے 30 دن کا ماہانہ حساب لاگو ہوتا ہے۔' : 'Historical roles plus your current role so far. Past-role totals use a simple 30-day monthly pro-rate.'}</p></div>
        <div className="career-hero-stats"><span><b>{records.length}</b> {t('historicalRoles')}</span><span><b>{formatCurrency(historicalTotal)}</b> {t('fromHistory')}</span></div>
      </section>
      <section className="current-role-card">
        <div><span className="current-role-dot" /><div><p className="eyebrow">{t('currentRole')}</p><h2 data-user-content>{profile.designation || t('currentPosition')}</h2><p><span data-user-content>{profile.firstName}</span> {t('currentRoleSince')} {formatDate(profile.joiningDate)}</p></div></div>
        <div><strong>{formatCurrency(currentMonthlySalary)}</strong><small>{t('estimatedMonthlySalary')}</small></div>
      </section>
      <div className="career-layout"><CareerForm language={language} /><CareerList records={records} language={language} /></div>
    </section>
  );
}

function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const refresh = () => setToday(new Date());
    const initialTimer = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 3_600_000);
    return () => { window.clearTimeout(initialTimer); window.clearInterval(interval); };
  }, []);
  return today;
}

function CareerForm({ language }: { language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedSalary = Number(monthlySalary);
    if (!companyName.trim() || !designation.trim() || !startDate || !endDate || endDate < startDate || !Number.isFinite(parsedSalary) || parsedSalary <= 0) {
      setStatus(isUrdu ? 'ہر فیلڈ کو مکمل کریں، شروع کے بعد کی آخری تاریخ منتخب کریں اور صفر سے زیادہ تنخواہ درج کریں۔' : 'Complete each field, use an end date after the start, and enter a salary above zero.');
      return;
    }
    setIsSaving(true); setStatus('');
    try {
      await addCareerRecord({ companyName: companyName.trim(), designation: designation.trim(), startDate, endDate, monthlySalary: parsedSalary, note: note.trim() });
      setCompanyName(''); setDesignation(''); setStartDate(''); setEndDate(''); setMonthlySalary(''); setNote('');
      setStatus(isUrdu ? 'گزشتہ عہدہ مقامی طور پر محفوظ ہو گیا۔' : 'Past role saved locally.');
    } catch {
      setStatus(isUrdu ? 'یہ کیریئر ریکارڈ محفوظ نہیں ہو سکا۔ دوبارہ کوشش کریں۔' : 'Could not save this career record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <section className="company-entry-form career-entry-form">
      <div><p className="eyebrow">{isUrdu ? 'گزشتہ عہدہ شامل کریں' : 'ADD A PAST ROLE'}</p><h2>{isUrdu ? 'اپنی تاریخ مکمل رکھیں۔' : 'Keep your history complete.'}</h2><p>{isUrdu ? 'صرف مکمل شدہ ملازمت شامل کریں۔ فعال عہدے کا حساب تنخواہ کے سیٹ اپ سے ہوتا ہے۔' : 'Add completed employment only. Your active role is calculated from your salary setup.'}</p></div>
      <form onSubmit={submit}>
        <label className="field"><span>{isUrdu ? 'کمپنی' : 'Company'}</span><input value={companyName} maxLength={80} onChange={(event) => setCompanyName(event.target.value)} placeholder={isUrdu ? 'کمپنی کا نام' : 'Company name'} required /></label>
        <label className="field"><span>{isUrdu ? 'عہدہ' : 'Designation'}</span><input value={designation} maxLength={80} onChange={(event) => setDesignation(event.target.value)} placeholder={isUrdu ? 'آپ کا عہدہ' : 'Your role'} required /></label>
        <div className="form-grid compact-form-grid"><label className="field"><span>{isUrdu ? 'شروع کی تاریخ' : 'Start date'}</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label><label className="field"><span>{isUrdu ? 'ختم ہونے کی تاریخ' : 'End date'}</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required /></label></div>
        <label className="field"><span>{isUrdu ? 'ماہانہ تنخواہ (PKR)' : 'Monthly salary (PKR)'}</span><input type="number" min="1" value={monthlySalary} onChange={(event) => setMonthlySalary(event.target.value)} placeholder="0" required /></label>
        <label className="field"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اختیاری کارنامہ یا تفصیل' : 'Optional achievement or detail'} /></label>
        <div className="editor-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'عہدہ محفوظ کریں' : 'Save role')} <AppIcon name="plus" aria-hidden="true" size={17} /></button></div>
      </form>
    </section>
  );
}

function CareerList({ records, language }: { records: CareerRecord[]; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [removingId, setRemovingId] = useState<string | null>(null);
  const remove = async (record: CareerRecord) => {
    if (!window.confirm(isUrdu ? `کیا آپ اپنے کیریئر ریکارڈ سے ${record.companyName} کو ہٹانا چاہتے ہیں؟` : `Remove ${record.companyName} from your career history?`)) return;
    setRemovingId(record.id);
    try { await deleteCareerRecord(record.id); }
    finally { setRemovingId(null); }
  };
  return (
    <section className="career-history-list">
      <div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'گزشتہ ملازمت' : 'PAST EMPLOYMENT'}</p><h2>{isUrdu ? 'آپ کی تاریخ' : 'Your history'}</h2></div><span className="progress-label">{records.length} {isUrdu ? 'عہدے' : 'roles'}</span></div>
      {records.length ? (
        <ul>
          {records.map((record) => (
            <li key={record.id}>
              <div className="career-record-title"><strong data-user-content>{record.companyName}</strong><span data-user-content>{record.designation}</span></div>
              <div className="career-record-meta"><span>{formatDate(record.startDate)} — {formatDate(record.endDate)}</span>{record.note ? <small data-user-content>{record.note}</small> : null}</div>
              <div className="career-record-amount"><b>{formatCurrency(calculateCareerRecordEarnings(record))}</b><small>{isUrdu ? 'تخمینی کمائی' : 'estimated earned'}</small></div>
              <button className="remove-button" type="button" onClick={() => remove(record)} disabled={removingId === record.id}>{removingId === record.id ? '…' : (isUrdu ? 'ہٹائیں' : 'Remove')}</button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ledger-empty"><AppIcon name="chart" aria-hidden="true" size={24} /><p>{isUrdu ? 'ابھی کوئی گزشتہ عہدہ شامل نہیں ہے۔' : 'No past roles added yet.'}</p><span>{isUrdu ? 'مکمل شدہ ملازمتیں آپ کی مقامی کیریئر تاریخ اور زندگی بھر کا تخمینہ بنائیں گی۔' : 'Completed roles will build your local career history and lifetime estimate.'}</span></div>
      )}
    </section>
  );
}

function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="chart" aria-hidden="true" size={28} /></span><p className="eyebrow">CAREER HISTORY</p><h1>Set up your workspace first.</h1><p>Your current role provides the starting point for a private employment history.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }
