'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { useAttendanceRecords } from '@/hooks/use-attendance-records';
import { findNextUnrecordedWorkday } from '@/lib/attendance/attendance-workflows';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { useAppTranslation } from '@/hooks/use-app-translation';
import { useAuth } from '@/hooks/use-auth';
import { upsertAttendanceRecord, bulkUpsertAttendance } from '@/lib/supabase/repository';
import { formatDate, formatMonth, getLocalDateValue, getMonthValue } from '@/lib/formatting/date';
import type { AppLanguage, AttendanceRecord, AttendanceStatus, SalarySettings } from '@/types/domain';

const weekdayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdayLabelsUr = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];

const statusLabels: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  'half-day': 'Half day',
  leave: 'Leave',
  'weekly-off': 'Weekly off',
};

const statusLabelsUr: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent: 'غیر حاضر',
  'half-day': 'آدھا دن',
  leave: 'چھٹی',
  'weekly-off': 'ہفتہ وار چھٹی',
};

export function AttendanceContent() {
  const { t } = useAppTranslation();
  const { userId } = useAuth();
  const { records: appRecords, isLoading, isOnboarded } = useCurrentAppRecords();
  const [month, setMonth] = useState(getMonthValue);
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const { records, isLoading: attendanceLoading, refetch: refetchAttendance } = useAttendanceRecords(month);
  const [bulkStatus, setBulkStatus] = useState('');
  const profile = appRecords?.profile;
  const salarySettings = appRecords?.salarySettings;
  const language = appRecords?.appSettings?.language;
  const isUrdu = language === 'ur';
  const activeStatusLabels = isUrdu ? statusLabelsUr : statusLabels;
  const activeWeekdays = isUrdu ? weekdayLabelsUr : weekdayLabelsEn;

  if (isLoading || attendanceLoading) return <section className="dashboard-loading" aria-live="polite">{t('loadingAttendance')}</section>;
  if (!isOnboarded || !profile || !salarySettings || !userId) return <SetupRequired />;

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
    if (!nextDate) { setBulkStatus(isUrdu ? 'آج تک کے تمام طے شدہ کام کے دن پہلے سے ریکارڈ ہیں۔' : 'Every scheduled workday through today is already recorded.'); return; }
    setSelectedDate(nextDate);
    setBulkStatus(isUrdu ? `اگلا غیر ریکارڈ شدہ کام کا دن منتخب کیا گیا: ${formatDate(nextDate)}۔` : `Selected the next unrecorded workday: ${formatDate(nextDate)}.`);
  };
  const fillMonth = async () => {
    if (!userId) return;
    setBulkStatus('');
    try {
      const [year, monthIndex] = month.split('-').map(Number);
      const lastDay = new Date(year, monthIndex, 0).getDate();
      const throughDate = getLocalDateValue();
      const newRecords = [];
      for (let day = 1; day <= lastDay; day++) {
        const date = `${month}-${String(day).padStart(2, '0')}`;
        const localDate = new Date(year, monthIndex - 1, day);
        if (date < profile.joiningDate || date > throughDate) continue;
        if (localDate.getDay() === salarySettings.weeklyOffDay) continue;
        if (recordByDate.has(date)) continue;
        newRecords.push({ date, status: 'present' as const, check_in: null, check_out: null, overtime_minutes: 0, note: '' });
      }
      if (newRecords.length) {
        const result = await bulkUpsertAttendance(userId, newRecords);
        if (result.error) throw new Error(result.error);
        refetchAttendance();
      }
      setBulkStatus(newRecords.length
        ? (isUrdu ? `${newRecords.length} کام کے دن حاضر درج کر دیے گئے۔` : `${newRecords.length} workday${newRecords.length === 1 ? '' : 's'} marked present.`)
        : (isUrdu ? 'آج تک کے تمام گزشتہ کام کے دن پہلے سے ریکارڈ ہیں۔' : 'All past workdays are already recorded.'));
    } catch {
      setBulkStatus(isUrdu ? 'حاضری اپ ڈیٹ نہیں ہو سکی۔' : 'Could not update attendance. Please try again.');
    }
  };

  return (
    <section className="attendance-page">
      <header className="page-heading"><div><p className="eyebrow">{t('attendancePage')}</p><h1>{t('attendanceTitle')}</h1><p className="page-subtitle">{t('attendanceSubtitle')}</p></div></header>
      <div className="attendance-summary cards-grid" aria-label={isUrdu ? 'ماہانہ حاضری کا خلاصہ' : 'Monthly attendance summary'}>
        <SummaryCard label={isUrdu ? 'ریکارڈ شدہ' : 'Recorded'} value={String(records.length)} detail={isUrdu ? 'اس ماہ کے دن' : 'days this month'} />
        <SummaryCard label={isUrdu ? 'حاضر' : 'Present'} value={String(stats.present)} detail={isUrdu ? 'مکمل دن' : 'full days'} />
        <SummaryCard label={isUrdu ? 'چھٹی' : 'Time off'} value={String(stats.absent + stats.leave)} detail={isUrdu ? 'غیر حاضر یا رخصت' : 'absent or leave'} />
        <SummaryCard label={isUrdu ? 'اوور ٹائم' : 'Overtime'} value={formatOvertime(stats.overtimeMinutes, language)} detail={isUrdu ? 'ریکارڈ شدہ' : 'recorded'} />
      </div>
      <section className="attendance-calendar-section">
        <div className="calendar-toolbar"><div><p className="eyebrow">{isUrdu ? 'ماہانہ منظر' : 'MONTH VIEW'}</p><h2>{formatMonth(month)}</h2></div><div className="calendar-controls"><button className="icon-button" type="button" aria-label={isUrdu ? 'پچھلا مہینہ' : 'Previous month'} onClick={() => goToMonth(-1)}>{isUrdu ? '→' : '←'}</button><button className="secondary-button" type="button" onClick={() => { setMonth(getMonthValue()); setSelectedDate(getLocalDateValue()); setBulkStatus(''); }}>{isUrdu ? 'آج' : 'Today'}</button><button className="icon-button" type="button" aria-label={isUrdu ? 'اگلا مہینہ' : 'Next month'} onClick={() => goToMonth(1)}>{isUrdu ? '←' : '→'}</button></div></div>
        <div className="attendance-filter-bar">
          <label className="field">
            <span>{isUrdu ? 'محفوظ شدہ حالت دکھائیں' : 'Show saved status'}</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | 'all')}>
              <option value="all">{isUrdu ? 'تمام ریکارڈ شدہ حالات' : 'All recorded statuses'}</option>
              {Object.entries(activeStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <div>
            <strong>{filteredRecordCount}</strong>
            <span>{statusFilter === 'all' ? (isUrdu ? 'اس ماہ کے ریکارڈز' : 'records this month') : (isUrdu ? `${activeStatusLabels[statusFilter]} کے ${filteredRecordCount} ریکارڈز` : `${statusLabels[statusFilter]} record${filteredRecordCount === 1 ? '' : 's'} shown`)}</span>
          </div>
          {statusFilter !== 'all' ? <button className="secondary-button" type="button" onClick={() => setStatusFilter('all')}>{isUrdu ? 'فلٹر صاف کریں' : 'Clear filter'}</button> : null}
        </div>
        <div className="calendar-weekdays" aria-hidden="true">{activeWeekdays.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="attendance-calendar">{getCalendarDays(month).map((day, index) => day ? <DayButton key={day.date} day={day} record={recordByDate.get(day.date)} selected={selectedDate === day.date} weeklyOffDay={salarySettings.weeklyOffDay} isFilteredOut={statusFilter !== 'all' && recordByDate.get(day.date)?.status !== statusFilter} onSelect={setSelectedDate} language={language} statusLabels={activeStatusLabels} /> : <span className="calendar-blank" key={`blank-${index}`} />)}</div>
        <div className="calendar-legend"><span><i className="attendance-status-dot status-present" />{isUrdu ? 'حاضر' : 'Present'}</span><span><i className="attendance-status-dot status-half-day" />{isUrdu ? 'آدھا دن' : 'Half day'}</span><span><i className="attendance-status-dot status-absent" />{isUrdu ? 'غیر حاضر' : 'Away'}</span><span><i className="attendance-status-dot status-leave" />{isUrdu ? 'رخصت' : 'Leave'}</span><span><i className="attendance-status-dot status-weekly-off" />{isUrdu ? 'ہفتہ وار چھٹی' : 'Weekly off'}</span></div>
        <div className="attendance-bulk"><div><strong>{isUrdu ? 'گزشتہ کام کے دن درج کریں' : 'Fill past scheduled workdays'}</strong><small>{isUrdu ? 'صرف آج تک کے خالی کام کے دنوں کو حاضر لگایا جاتا ہے۔ پہلے سے موجود اندراجات محفوظ رہتے ہیں۔' : 'Only blank workdays through today are marked present. Existing entries stay untouched.'}</small></div><div className="attendance-workflow-actions"><button className="secondary-button" type="button" onClick={focusNextUnrecordedWorkday}>{isUrdu ? 'اگلا غیر ریکارڈ شدہ دن' : 'Next unrecorded workday'}</button><button className="secondary-button" type="button" onClick={fillMonth} disabled={month > getMonthValue()}>{isUrdu ? 'غیر ریکارڈ شدہ دن پر کریں' : 'Fill unrecorded days'}</button></div></div>
        {bulkStatus && <p className="form-status" role="status">{bulkStatus}</p>}
      </section>
      <AttendanceEditor key={`${selectedDate}:${selectedRecord?.updatedAt ?? 'new'}`} date={selectedDate} record={selectedRecord} salarySettings={salarySettings} language={language} userId={userId} onSaved={refetchAttendance} />
    </section>
  );
}

function AttendanceEditor({ date, record, salarySettings, language, userId, onSaved }: { date: string; record?: AttendanceRecord; salarySettings: SalarySettings; language?: AppLanguage; userId: string; onSaved: () => void }) {
  const isUrdu = language === 'ur';
  const activeStatusLabels = isUrdu ? statusLabelsUr : statusLabels;
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
      const result = await upsertAttendanceRecord(userId, {
        date,
        status,
        check_in: checkIn || null,
        check_out: checkOut || null,
        overtime_minutes: overtimeMinutes,
        note: note.trim(),
      });
      if (result.error) throw new Error(result.error);
      setMessage(isUrdu ? 'حاضری محفوظ ہو گئی۔' : 'Attendance saved.');
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : (isUrdu ? 'حاضری محفوظ نہیں ہو سکی۔' : 'Could not save. Please try again.'));
    } finally { setIsSaving(false); }
  };

  return <section className="attendance-editor"><div className="editor-heading"><div><p className="eyebrow">{isUrdu ? 'حاضری ایڈیٹر' : 'DAY RECORD'}</p><h2>{formatDate(date)}</h2><p>{record ? (isUrdu ? 'محفوظ شدہ ریکارڈ میں ترمیم کریں۔' : 'Update a saved record.') : (isUrdu ? 'ابھی کوئی ریکارڈ نہیں — اس دن کے لیے مناسب حالت منتخب کریں۔' : 'No saved record yet—choose the status that fits this day.')}</p></div><span className={`status-label status-${status}`}>{activeStatusLabels[status]}</span></div><form onSubmit={submit}><div className="form-grid"><label className="field"><span>{isUrdu ? 'حالت' : 'Status'}</span><select value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus)}>{Object.entries(activeStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field"><span>{isUrdu ? 'اوور ٹائم (گھنٹے)' : 'Overtime (hours)'}</span><input type="number" min="0" step="0.25" inputMode="decimal" value={overtimeHours} onChange={(event) => setOvertimeHours(event.target.value)} /></label><label className="field"><span>{isUrdu ? 'چیک اِن' : 'Check in'}</span><input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label><label className="field"><span>{isUrdu ? 'چیک آؤٹ' : 'Check out'}</span><input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label></div><label className="field attendance-note"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اس دن کی اضافی تفصیل یا وضاحت' : 'Optional context for this day'} /></label><div className="editor-actions"><span role="status">{message}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'دن محفوظ کریں' : 'Save day')} <AppIcon name="shield" aria-hidden="true" size={17} /></button></div></form></section>;
}

function DayButton({ day, record, selected, weeklyOffDay, isFilteredOut, onSelect, language, statusLabels: labels = statusLabels }: { day: CalendarDay; record?: AttendanceRecord; selected: boolean; weeklyOffDay: number; isFilteredOut: boolean; onSelect: (date: string) => void; language?: AppLanguage; statusLabels?: Record<AttendanceStatus, string> }) {
  const status = record?.status ?? (day.weekday === weeklyOffDay ? 'weekly-off' : '');
  const isUrdu = language === 'ur';
  const today = new Date().toISOString().slice(0, 10);
  const isToday = day.date === today;

  // Short label for the chip (3–4 chars max)
  const chipLabel: Record<string, string> = {
    present: 'In', absent: 'Out', 'half-day': 'Half', leave: 'Leave', 'weekly-off': 'Off',
  };

  const cellClass = [
    'calendar-day',
    selected ? 'calendar-day-selected' : '',
    isToday && !selected ? 'calendar-day-today' : '',
    status ? `has-${status}` : '',
    isFilteredOut ? 'calendar-day-filtered' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={cellClass}
      type="button"
      onClick={() => onSelect(day.date)}
      aria-label={`${formatDate(day.date)}${status ? `, ${labels[status as AttendanceStatus]}` : (isUrdu ? '، کوئی ریکارڈ نہیں' : ', no record')}${isFilteredOut ? (isUrdu ? '، فعال فلٹر کے تحت خارج' : ', excluded by active filter') : ''}`}
    >
      <time dateTime={day.date}>{day.day}</time>
      {status && (
        <span className={`attendance-status-chip status-${status}`} aria-hidden="true">
          {chipLabel[status] ?? status}
        </span>
      )}
    </button>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }

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

function formatOvertime(minutes: number, language?: AppLanguage): string {
  if (!minutes) return language === 'ur' ? '0 گھنٹے' : '0h';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (language === 'ur') {
    if (!hours) return `${remainder} منٹ`;
    if (!remainder) return `${hours} گھنٹے`;
    return `${hours} گھنٹے ${remainder} منٹ`;
  }
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

