'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { useAttendanceRecords } from '@/hooks/use-attendance-records';
import { findNextUnrecordedWorkday } from '@/lib/attendance/attendance-workflows';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { fillWorkdaysForMonth, saveAttendanceRecord } from '@/lib/database/repository';
import { formatDate, formatMonth, getLocalDateValue, getMonthValue } from '@/lib/formatting/date';
import type { AttendanceRecord, AttendanceStatus, SalarySettings } from '@/types/domain';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const statusLabels: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  'half-day': 'Half day',
  leave: 'Leave',
  'weekly-off': 'Weekly off',
};

export function AttendanceContent() {
  const { records: appRecords, isLoading, isOnboarded } = useCurrentAppRecords();
  const [month, setMonth] = useState(getMonthValue);
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const { records, isLoading: attendanceLoading } = useAttendanceRecords(month);
  const [bulkStatus, setBulkStatus] = useState('');
  const profile = appRecords?.profile;
  const salarySettings = appRecords?.salarySettings;

  if (isLoading || attendanceLoading) return <section className="dashboard-loading" aria-live="polite">Loading your local attendance…</section>;
  if (!isOnboarded || !profile || !salarySettings) return <SetupRequired />;

  const recordByDate = new Map(records.map((record) => [record.date, record]));
  const selectedRecord = recordByDate.get(selectedDate);
  const stats = getAttendanceStats(records);
  const filteredRecordCount = statusFilter === 'all' ? records.length : records.filter((record) => record.status === statusFilter).length;
  const goToMonth = (offset: number) => {
    const [year, monthIndex] = month.split('-').map(Number);
    const next = new Date(year, monthIndex - 1 + offset, 1);
    setMonth(getMonthValue(next));
    setSelectedDate(getLocalDateValue(next));
    setBulkStatus('');
  };
  const focusNextUnrecordedWorkday = () => {
    const nextDate = findNextUnrecordedWorkday({ month, selectedDate, records, weeklyOffDay: salarySettings.weeklyOffDay, joiningDate: profile.joiningDate, throughDate: getLocalDateValue() });
    if (!nextDate) { setBulkStatus('Every scheduled workday through today is already recorded.'); return; }
    setSelectedDate(nextDate);
    setBulkStatus(`Selected the next unrecorded workday: ${formatDate(nextDate)}.`);
  };
  const fillMonth = async () => {
    setBulkStatus('');
    try {
      const count = await fillWorkdaysForMonth({ month, weeklyOffDay: salarySettings.weeklyOffDay, joiningDate: profile.joiningDate, throughDate: getLocalDateValue() });
      setBulkStatus(count ? `${count} workday${count === 1 ? '' : 's'} marked present.` : 'All past workdays are already recorded.');
    } catch {
      setBulkStatus('Could not update attendance locally. Please try again.');
    }
  };

  return (
    <section className="attendance-page">
      <header className="page-heading"><div><p className="eyebrow">ATTENDANCE</p><h1>Your time, on record.</h1><p className="page-subtitle">Mark each day your way. Automatic defaults never replace what you record yourself.</p></div></header>
      <div className="attendance-summary" aria-label="Monthly attendance summary"><SummaryCard label="Recorded" value={String(records.length)} detail="days this month" /><SummaryCard label="Present" value={String(stats.present)} detail="full days" /><SummaryCard label="Time off" value={String(stats.absent + stats.leave)} detail="absent or leave" /><SummaryCard label="Overtime" value={formatOvertime(stats.overtimeMinutes)} detail="recorded" /></div>
      <section className="attendance-calendar-section">
        <div className="calendar-toolbar"><div><p className="eyebrow">MONTH VIEW</p><h2>{formatMonth(month)}</h2></div><div className="calendar-controls"><button className="icon-button" type="button" aria-label="Previous month" onClick={() => goToMonth(-1)}>←</button><button className="secondary-button" type="button" onClick={() => { setMonth(getMonthValue()); setSelectedDate(getLocalDateValue()); setBulkStatus(''); }}>Today</button><button className="icon-button" type="button" aria-label="Next month" onClick={() => goToMonth(1)}>→</button></div></div>
        <div className="attendance-filter-bar"><label className="field"><span>Show saved status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | 'all')}><option value="all">All recorded statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><div><strong>{filteredRecordCount}</strong><span>{statusFilter === 'all' ? 'records this month' : `${statusLabels[statusFilter]} record${filteredRecordCount === 1 ? '' : 's'} shown`}</span></div>{statusFilter !== 'all' ? <button className="secondary-button" type="button" onClick={() => setStatusFilter('all')}>Clear filter</button> : null}</div>
        <div className="calendar-weekdays" aria-hidden="true">{weekdayLabels.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="attendance-calendar">{getCalendarDays(month).map((day, index) => day ? <DayButton key={day.date} day={day} record={recordByDate.get(day.date)} selected={selectedDate === day.date} weeklyOffDay={salarySettings.weeklyOffDay} isFilteredOut={statusFilter !== 'all' && recordByDate.get(day.date)?.status !== statusFilter} onSelect={setSelectedDate} /> : <span className="calendar-blank" key={`blank-${index}`} />)}</div>
        <div className="calendar-legend"><span><i className="attendance-status-dot status-present" />Present</span><span><i className="attendance-status-dot status-half-day" />Half day</span><span><i className="attendance-status-dot status-absent" />Away</span><span><i className="attendance-status-dot status-weekly-off" />Weekly off</span></div>
        <div className="attendance-bulk"><div><strong>Fill past scheduled workdays</strong><small>Only blank workdays through today are marked present. Existing entries stay untouched.</small></div><div className="attendance-workflow-actions"><button className="secondary-button" type="button" onClick={focusNextUnrecordedWorkday}>Next unrecorded workday</button><button className="secondary-button" type="button" onClick={fillMonth} disabled={month > getMonthValue()}>Fill unrecorded days</button></div></div>
        {bulkStatus && <p className="form-status" role="status">{bulkStatus}</p>}
      </section>
      <AttendanceEditor key={`${selectedDate}:${selectedRecord?.updatedAt ?? 'new'}`} date={selectedDate} record={selectedRecord} salarySettings={salarySettings} />
    </section>
  );
}

function AttendanceEditor({ date, record, salarySettings }: { date: string; record?: AttendanceRecord; salarySettings: SalarySettings }) {
  const defaultStatus: AttendanceStatus = new Date(`${date}T00:00:00`).getDay() === salarySettings.weeklyOffDay ? 'weekly-off' : 'present';
  const [status, setStatus] = useState<AttendanceStatus>(record?.status ?? defaultStatus);
  const [checkIn, setCheckIn] = useState(record?.checkIn ?? '');
  const [checkOut, setCheckOut] = useState(record?.checkOut ?? '');
  const [overtimeHours, setOvertimeHours] = useState(record ? String(record.overtimeMinutes / 60) : '0');
  const [note, setNote] = useState(record?.note ?? '');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const overtimeMinutes = Math.max(0, Math.round((Number(overtimeHours) || 0) * 60));
    setIsSaving(true); setMessage('');
    try {
      await saveAttendanceRecord({ date, status, checkIn: checkIn || null, checkOut: checkOut || null, overtimeMinutes, note: note.trim() });
      setMessage('Attendance saved locally.');
    } catch {
      setMessage('Could not save this attendance record. Please try again.');
    } finally { setIsSaving(false); }
  };

  return <section className="attendance-editor"><div className="editor-heading"><div><p className="eyebrow">DAY RECORD</p><h2>{formatDate(date)}</h2><p>{record ? 'Update a saved record.' : 'No saved record yet—choose the status that fits this day.'}</p></div><span className={`status-label status-${status}`}>{statusLabels[status]}</span></div><form onSubmit={submit}><div className="form-grid"><label className="field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field"><span>Overtime (hours)</span><input type="number" min="0" step="0.25" inputMode="decimal" value={overtimeHours} onChange={(event) => setOvertimeHours(event.target.value)} /></label><label className="field"><span>Check in</span><input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label><label className="field"><span>Check out</span><input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label></div><label className="field attendance-note"><span>Note</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional context for this day" /></label><div className="editor-actions"><span role="status">{message}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save day'} <AppIcon name="shield" aria-hidden="true" size={17} /></button></div></form></section>;
}

function DayButton({ day, record, selected, weeklyOffDay, isFilteredOut, onSelect }: { day: CalendarDay; record?: AttendanceRecord; selected: boolean; weeklyOffDay: number; isFilteredOut: boolean; onSelect: (date: string) => void }) {
  const status = record?.status ?? (day.weekday === weeklyOffDay ? 'weekly-off' : '');
  return <button className={`calendar-day${selected ? ' calendar-day-selected' : ''}${status ? ` calendar-day-${status}` : ''}${isFilteredOut ? ' calendar-day-filtered' : ''}`} type="button" onClick={() => onSelect(day.date)} aria-label={`${formatDate(day.date)}${status ? `, ${statusLabels[status as AttendanceStatus]}` : ', no record'}${isFilteredOut ? ', excluded by active filter' : ''}`}><time dateTime={day.date}>{day.day}</time>{status && <i className={`attendance-status-dot status-${status}`} aria-hidden="true" />}</button>;
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <article><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }

function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="calendar" aria-hidden="true" size={28} /></span><p className="eyebrow">ATTENDANCE</p><h1>Set up your workspace first.</h1><p>Attendance follows the shift and weekly-off rules you choose during setup.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }

type CalendarDay = { day: number; date: string; weekday: number };

function getCalendarDays(month: string): Array<CalendarDay | null> {
  const [year, monthIndex] = month.split('-').map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1).getDay();
  const lastDay = new Date(year, monthIndex, 0).getDate();
  const days: Array<CalendarDay | null> = Array.from({ length: firstDay }, () => null);
  for (let day = 1; day <= lastDay; day += 1) days.push({ day, date: `${month}-${String(day).padStart(2, '0')}`, weekday: new Date(year, monthIndex - 1, day).getDay() });
  return days;
}

function getAttendanceStats(records: AttendanceRecord[]) {
  return records.reduce((stats, record) => ({ ...stats, present: stats.present + Number(record.status === 'present'), absent: stats.absent + Number(record.status === 'absent'), leave: stats.leave + Number(record.status === 'leave'), overtimeMinutes: stats.overtimeMinutes + record.overtimeMinutes }), { present: 0, absent: 0, leave: 0, overtimeMinutes: 0 });
}

function formatOvertime(minutes: number): string {
  if (!minutes) return '0h';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}
