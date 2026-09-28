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
import type { CareerRecord } from '@/types/domain';

export function CareerContent() {
  const { records: appRecords, isLoading, isOnboarded } = useCurrentAppRecords();
  const { records, isLoading: recordsLoading } = useCareerRecords();
  const today = useToday();
  if (isLoading || recordsLoading) return <section className="dashboard-loading" aria-live="polite">Loading your local career history…</section>;
  const profile = appRecords?.profile;
  const salarySettings = appRecords?.salarySettings;
  if (!isOnboarded || !profile || !salarySettings) return <SetupRequired />;

  const historicalTotal = getCareerLifetimeEarnings(records);
  const currentMonthlySalary = getEstimatedMonthlySalary(salarySettings);
  const currentRoleEarnings = today ? calculateCurrentRoleEarnings(profile.joiningDate, currentMonthlySalary, today) : 0;

  return <section className="career-page"><header className="page-heading"><div><p className="eyebrow">CAREER HISTORY</p><h1>See the long view of your work.</h1><p className="page-subtitle">Past roles are archived here, separately from today&apos;s live salary and personal pocket.</p></div></header><section className="career-hero"><div><p className="eyebrow">ESTIMATED LIFETIME EARNINGS</p><strong>{formatCurrency(historicalTotal + currentRoleEarnings)}</strong><p>Historical roles plus your current role so far. Past-role totals use a simple 30-day monthly pro-rate.</p></div><div className="career-hero-stats"><span><b>{records.length}</b> past roles</span><span><b>{formatCurrency(historicalTotal)}</b> from history</span></div></section><section className="current-role-card"><div><span className="current-role-dot" /><div><p className="eyebrow">CURRENT ROLE</p><h2>{profile.designation || 'Current position'}</h2><p>{profile.firstName}&apos;s current role since {formatDate(profile.joiningDate)}</p></div></div><div><strong>{formatCurrency(currentMonthlySalary)}</strong><small>estimated monthly salary</small></div></section><div className="career-layout"><CareerForm /><CareerList records={records} /></div></section>;
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

function CareerForm() {
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
    if (!companyName.trim() || !designation.trim() || !startDate || !endDate || endDate < startDate || !Number.isFinite(parsedSalary) || parsedSalary <= 0) { setStatus('Complete each field, use an end date after the start, and enter a salary above zero.'); return; }
    setIsSaving(true); setStatus('');
    try {
      await addCareerRecord({ companyName: companyName.trim(), designation: designation.trim(), startDate, endDate, monthlySalary: parsedSalary, note: note.trim() });
      setCompanyName(''); setDesignation(''); setStartDate(''); setEndDate(''); setMonthlySalary(''); setNote(''); setStatus('Past role saved locally.');
    } catch { setStatus('Could not save this career record. Please try again.'); }
    finally { setIsSaving(false); }
  };
  return <section className="company-entry-form career-entry-form"><div><p className="eyebrow">ADD A PAST ROLE</p><h2>Keep your history complete.</h2><p>Add completed employment only. Your active role is calculated from your salary setup.</p></div><form onSubmit={submit}><label className="field"><span>Company</span><input value={companyName} maxLength={80} onChange={(event) => setCompanyName(event.target.value)} placeholder="Company name" required /></label><label className="field"><span>Designation</span><input value={designation} maxLength={80} onChange={(event) => setDesignation(event.target.value)} placeholder="Your role" required /></label><div className="form-grid compact-form-grid"><label className="field"><span>Start date</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label><label className="field"><span>End date</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required /></label></div><label className="field"><span>Monthly salary (PKR)</span><input type="number" min="1" value={monthlySalary} onChange={(event) => setMonthlySalary(event.target.value)} placeholder="0" required /></label><label className="field"><span>Note</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional achievement or detail" /></label><div className="editor-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save role'} <AppIcon name="plus" aria-hidden="true" size={17} /></button></div></form></section>;
}

function CareerList({ records }: { records: CareerRecord[] }) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const remove = async (record: CareerRecord) => {
    if (!window.confirm(`Remove ${record.companyName} from your career history?`)) return;
    setRemovingId(record.id);
    try { await deleteCareerRecord(record.id); }
    finally { setRemovingId(null); }
  };
  return <section className="career-history-list"><div className="panel-heading"><div><p className="eyebrow">PAST EMPLOYMENT</p><h2>Your history</h2></div><span className="progress-label">{records.length} roles</span></div>{records.length ? <ul>{records.map((record) => <li key={record.id}><div className="career-record-title"><strong>{record.companyName}</strong><span>{record.designation}</span></div><div className="career-record-meta"><span>{formatDate(record.startDate)} — {formatDate(record.endDate)}</span>{record.note ? <small>{record.note}</small> : null}</div><div className="career-record-amount"><b>{formatCurrency(calculateCareerRecordEarnings(record))}</b><small>estimated earned</small></div><button className="remove-button" type="button" onClick={() => remove(record)} disabled={removingId === record.id}>{removingId === record.id ? '…' : 'Remove'}</button></li>)}</ul> : <div className="ledger-empty"><AppIcon name="chart" aria-hidden="true" size={24} /><p>No past roles added yet.</p><span>Completed roles will build your local career history and lifetime estimate.</span></div>}</section>;
}

function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="chart" aria-hidden="true" size={28} /></span><p className="eyebrow">CAREER HISTORY</p><h1>Set up your workspace first.</h1><p>Your current role provides the starting point for a private employment history.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }
