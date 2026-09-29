'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { BackupPanel } from '@/components/settings/backup-panel';
import { SecurityPanel } from '@/components/settings/security-panel';
import { AppIcon } from '@/components/ui/app-icon';
import { updateAppSettings, updateProfile, updateSalarySettings } from '@/lib/database/repository';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import type { AppSettings, SalarySettings, UserProfile } from '@/types/domain';

export function SettingsContent() {
  const { records, isLoading, isOnboarded } = useCurrentAppRecords();

  if (isLoading) return <section className="dashboard-loading" aria-live="polite">Loading local settings…</section>;
  const profile = records?.profile;
  const salary = records?.salarySettings;
  const preferences = records?.appSettings;
  if (!isOnboarded || !profile || !salary || !preferences) return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="settings" aria-hidden="true" size={28} /></span><p className="eyebrow">SETTINGS</p><h1>Set up your workspace first.</h1><p>Profile and salary rules are stored locally after onboarding.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>;

  return <SettingsForm key={`${profile.updatedAt}:${salary.updatedAt}:${preferences.updatedAt}`} initialProfile={profile} initialSalary={salary} initialPreferences={preferences} />;
}

function SettingsForm({ initialProfile, initialSalary, initialPreferences }: { initialProfile: UserProfile; initialSalary: SalarySettings; initialPreferences: AppSettings }) {
  const [profile, setProfile] = useState(initialProfile);
  const [salary, setSalary] = useState(initialSalary);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true); setStatus('');
    try { await Promise.all([updateProfile(profile), updateSalarySettings(salary), updateAppSettings(preferences)]); setStatus('Saved locally.'); }
    catch { setStatus('Could not save changes locally. Please try again.'); }
    finally { setIsSaving(false); }
  };

  return (
    <section className="settings-page">
      <header className="page-heading"><div><p className="eyebrow">SETTINGS</p><h1>Rules you control.</h1><p className="page-subtitle">Update your profile and salary rules. Changes remain on this device.</p></div></header>
      <div className="settings-stack">
        <SettingsSection eyebrow="PROFILE" title="Work identity"><div className="form-grid"><TextField label="First name" value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} /><TextField label="Last name" value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} /><TextField label="Employee ID" value={profile.employeeId} onChange={(value) => setProfile({ ...profile, employeeId: value })} /><TextField label="Designation" value={profile.designation} onChange={(value) => setProfile({ ...profile, designation: value })} /><label className="field"><span>Joining date</span><input type="date" value={profile.joiningDate} onChange={(event) => setProfile({ ...profile, joiningDate: event.target.value })} /></label></div></SettingsSection>
        <SettingsSection eyebrow="SALARY" title="Earning rules"><div className="form-grid"><label className="field"><span>Salary mode</span><select value={salary.salaryMode} onChange={(event) => setSalary({ ...salary, salaryMode: event.target.value as SalarySettings['salaryMode'] })}><option value="fixed-monthly">Fixed monthly</option><option value="daily-rate">Daily rate</option></select></label><label className="field"><span>Base salary (PKR)</span><input type="number" min="1" value={salary.baseSalary} onChange={(event) => setSalary({ ...salary, baseSalary: Number(event.target.value) || 0 })} /></label>{salary.salaryMode === 'daily-rate' && <label className="field"><span>Daily rate (PKR)</span><input type="number" min="1" value={salary.dailyRate ?? ''} onChange={(event) => setSalary({ ...salary, dailyRate: Number(event.target.value) || null })} /></label>}<label className="field"><span>Daily calculation rule</span><select value={salary.salaryCalculationRule} onChange={(event) => setSalary({ ...salary, salaryCalculationRule: event.target.value as SalarySettings['salaryCalculationRule'] })}><option value="30-days">30-day rule</option><option value="26-working-days">26-working-day rule</option><option value="calendar-days">Calendar-day rule</option></select></label></div></SettingsSection>
        <SettingsSection eyebrow="ATTENDANCE" title="Shift defaults"><div className="form-grid"><label className="field"><span>Duty starts</span><input type="time" value={salary.dutyStart} onChange={(event) => setSalary({ ...salary, dutyStart: event.target.value })} /></label><label className="field"><span>Duty ends</span><input type="time" value={salary.dutyEnd} onChange={(event) => setSalary({ ...salary, dutyEnd: event.target.value })} /></label><label className="field"><span>Shift duration (hours)</span><input type="number" min="1" max="24" value={salary.shiftDurationHours} onChange={(event) => setSalary({ ...salary, shiftDurationHours: Number(event.target.value) || 0 })} /></label><label className="field"><span>Weekly off</span><select value={salary.weeklyOffDay} onChange={(event) => setSalary({ ...salary, weeklyOffDay: Number(event.target.value) })}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label className="field"><span>Auto-attendance</span><select value={salary.autoAttendanceRule} onChange={(event) => setSalary({ ...salary, autoAttendanceRule: event.target.value as SalarySettings['autoAttendanceRule'], autoAttendanceTime: event.target.value === 'custom-time' ? salary.autoAttendanceTime ?? '09:00' : null })}><option value="off">Off — manual only</option><option value="midnight">At midnight</option><option value="shift-end">At shift end</option><option value="custom-time">At a custom time</option></select></label>{salary.autoAttendanceRule === 'custom-time' && <label className="field"><span>Custom attendance time</span><input type="time" value={salary.autoAttendanceTime ?? ''} onChange={(event) => setSalary({ ...salary, autoAttendanceTime: event.target.value || null })} /></label>}</div><p className="form-hint">Automatic attendance checks while this workspace is open or when you return to it. It only fills a blank eligible day and never changes manual entries.</p><div className="form-switches"><Switch label="Weekly off is paid" description="Counts the selected weekly off as a full paid day." checked={salary.isWeeklyOffPaid} onChange={(checked) => setSalary({ ...salary, isWeeklyOffPaid: checked })} /><Switch label="Privacy mode at startup" description="Blurs financial figures until you reveal them." checked={preferences.isPrivacyModeEnabled} onChange={(checked) => setPreferences({ ...preferences, isPrivacyModeEnabled: checked })} /></div></SettingsSection>
        <SettingsSection eyebrow="POCKET" title="Cash alert"><div className="form-grid compact-grid"><label className="field"><span>Low-cash threshold (PKR)</span><input type="number" min="0" value={preferences.lowCashThreshold} onChange={(event) => setPreferences({ ...preferences, lowCashThreshold: Number(event.target.value) || 0 })} /></label></div><p className="form-hint">Set zero to turn the local low-cash alert off. Alerts appear in the pocket view while the app is open.</p></SettingsSection>
        <SettingsSection eyebrow="SECURITY" title="Local app lock"><SecurityPanel displayName={`${profile.firstName} ${profile.lastName}`.trim() || 'Live Salary Ticker user'} /></SettingsSection>
        <SettingsSection eyebrow="BACKUP" title="Encrypted backup and restore"><BackupPanel /></SettingsSection>
        <SettingsSection eyebrow="DISPLAY" title="Preferences"><div className="form-grid compact-grid"><label className="field"><span>Language</span><select value={preferences.language} onChange={(event) => setPreferences({ ...preferences, language: event.target.value as AppSettings['language'] })}><option value="en">English</option><option value="ur">Urdu (RTL ready)</option></select></label><label className="field"><span>Theme</span><select value={preferences.theme} onChange={(event) => setPreferences({ ...preferences, theme: event.target.value as AppSettings['theme'] })}><option value="dark">Dark neon</option><option value="light">Light</option></select></label></div></SettingsSection>
      </div>
      <div className="settings-save-bar"><span role="status">{status}</span><button className="primary-button" type="button" disabled={isSaving} onClick={save}>{isSaving ? 'Saving…' : 'Save changes'} <AppIcon name="shield" aria-hidden="true" size={17} /></button></div>
    </section>
  );
}

function SettingsSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) { return <section className="settings-section"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</section>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Switch({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="switch-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="switch-control" aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span></label>; }
