'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon } from '@/components/ui/app-icon';
import { defaultAppSettings, defaultSalarySettings, saveOnboarding } from '@/lib/database/repository';
import type { AppLanguage, AppTheme, AutoAttendanceRule, SalaryCalculationRule, SalaryMode } from '@/types/domain';

type FormState = {
  firstName: string;
  lastName: string;
  employeeId: string;
  designation: string;
  joiningDate: string;
  salaryMode: SalaryMode;
  baseSalary: string;
  dailyRate: string;
  calculationRule: SalaryCalculationRule;
  dutyStart: string;
  dutyEnd: string;
  shiftHours: string;
  weeklyOff: string;
  weeklyOffPaid: boolean;
  autoAttendance: AutoAttendanceRule;
  autoAttendanceTime: string;
  theme: AppTheme;
  language: AppLanguage;
  privacyMode: boolean;
};

const today = new Date().toISOString().slice(0, 10);
const stepLabels = ['Identity', 'Salary rules', 'Work style'];
const initialForm: FormState = {
  firstName: '', lastName: '', employeeId: '', designation: '', joiningDate: today,
  salaryMode: defaultSalarySettings.salaryMode, baseSalary: String(defaultSalarySettings.baseSalary), dailyRate: '',
  calculationRule: defaultSalarySettings.salaryCalculationRule, dutyStart: defaultSalarySettings.dutyStart,
  dutyEnd: defaultSalarySettings.dutyEnd, shiftHours: String(defaultSalarySettings.shiftDurationHours),
  weeklyOff: String(defaultSalarySettings.weeklyOffDay), weeklyOffPaid: defaultSalarySettings.isWeeklyOffPaid,
  autoAttendance: defaultSalarySettings.autoAttendanceRule, autoAttendanceTime: '',
  theme: defaultAppSettings.theme, language: defaultAppSettings.language, privacyMode: defaultAppSettings.isPrivacyModeEnabled,
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const update = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((previous) => ({ ...previous, [key]: value } as FormState));

  const validationError = () => {
    if (step === 0 && (!form.firstName.trim() || !form.employeeId.trim() || !form.designation.trim())) return 'Add your first name, employee ID, and designation to continue.';
    if (step === 1 && (Number(form.baseSalary) <= 0 || (form.salaryMode === 'daily-rate' && Number(form.dailyRate) <= 0))) return 'Enter a valid salary amount to continue.';
    if (step === 2 && (Number(form.shiftHours) < 1 || Number(form.shiftHours) > 24)) return 'Shift duration must be between 1 and 24 hours.';
    return '';
  };

  const continueSetup = () => {
    const validation = validationError();
    if (validation) { setError(validation); return; }
    setError('');
    setStep((current) => Math.min(current + 1, stepLabels.length - 1));
  };

  const finishSetup = async () => {
    const validation = validationError();
    if (validation) { setError(validation); return; }
    setError(''); setIsSaving(true);
    try {
      await saveOnboarding({
        profile: { firstName: form.firstName.trim(), lastName: form.lastName.trim(), employeeId: form.employeeId.trim(), designation: form.designation.trim(), joiningDate: form.joiningDate },
        salarySettings: { salaryMode: form.salaryMode, baseSalary: Number(form.baseSalary), dailyRate: form.salaryMode === 'daily-rate' ? Number(form.dailyRate) : null, salaryCalculationRule: form.calculationRule, dutyStart: form.dutyStart, dutyEnd: form.dutyEnd, shiftDurationHours: Number(form.shiftHours), weeklyOffDay: Number(form.weeklyOff), isWeeklyOffPaid: form.weeklyOffPaid, autoAttendanceRule: form.autoAttendance, autoAttendanceTime: form.autoAttendance === 'custom-time' ? form.autoAttendanceTime || null : null, halfDayFactor: 0.5, currency: 'PKR' },
        appSettings: { theme: form.theme, language: form.language, isPrivacyModeEnabled: form.privacyMode },
      });
      router.replace('/');
    } catch {
      setError('Your data could not be saved locally. Check private browsing permissions and try again.');
      setIsSaving(false);
    }
  };

  return (
    <section className="wizard-shell" aria-labelledby="onboarding-title">
      <div className="wizard-intro"><p className="eyebrow">ONBOARDING</p><h1 id="onboarding-title">Make the workspace yours.</h1><p>Everything stays on this device. You can adjust every rule in Settings later.</p></div>
      <ol className="wizard-steps" aria-label="Onboarding progress">{stepLabels.map((label, index) => <li className={index === step ? 'wizard-step wizard-step-active' : index < step ? 'wizard-step wizard-step-done' : 'wizard-step'} key={label}><span>{index < step ? '✓' : index + 1}</span>{label}</li>)}</ol>
      <div className="wizard-card">
        {step === 0 && <IdentityStep form={form} update={update} />}
        {step === 1 && <SalaryStep form={form} update={update} />}
        {step === 2 && <WorkStep form={form} update={update} />}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="wizard-actions"><button className="secondary-button" type="button" disabled={step === 0 || isSaving} onClick={() => { setError(''); setStep((current) => Math.max(current - 1, 0)); }}>Back</button>{step === 2 ? <button className="primary-button" type="button" disabled={isSaving} onClick={finishSetup}>{isSaving ? 'Saving locally…' : 'Finish setup'} <AppIcon name="shield" aria-hidden="true" size={17} /></button> : <button className="primary-button" type="button" onClick={continueSetup}>Continue <AppIcon name="arrow-right" aria-hidden="true" size={17} /></button>}</div>
      </div>
    </section>
  );
}

function IdentityStep({ form, update }: { form: FormState; update: (key: keyof FormState, value: FormState[keyof FormState]) => void }) {
  return <div className="form-section"><div><p className="eyebrow">STEP 1 OF 3</p><h2>Who is this workspace for?</h2><p>Use your work identity—not a public username.</p></div><div className="form-grid"><Field label="First name" required><input autoComplete="given-name" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} placeholder="Muhammad" /></Field><Field label="Last name"><input autoComplete="family-name" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} placeholder="Naeem" /></Field><Field label="Employee ID / roll number" required><input value={form.employeeId} onChange={(event) => update('employeeId', event.target.value)} placeholder="1042" /></Field><Field label="Designation" required><input value={form.designation} onChange={(event) => update('designation', event.target.value)} placeholder="Junior Accountant" /></Field><Field label="Joining date"><input type="date" max={today} value={form.joiningDate} onChange={(event) => update('joiningDate', event.target.value)} /></Field></div></div>;
}

function SalaryStep({ form, update }: { form: FormState; update: (key: keyof FormState, value: FormState[keyof FormState]) => void }) {
  return <div className="form-section"><div><p className="eyebrow">STEP 2 OF 3</p><h2>Set your salary rules.</h2><p>Fixed monthly salary stays constant regardless of the calendar month length.</p></div><div className="form-grid"><Field label="Salary mode"><select value={form.salaryMode} onChange={(event) => update('salaryMode', event.target.value as SalaryMode)}><option value="fixed-monthly">Fixed monthly</option><option value="daily-rate">Daily rate</option></select></Field><Field label={form.salaryMode === 'fixed-monthly' ? 'Base monthly salary (PKR)' : 'Reference monthly salary (PKR)'} required><input type="number" min="1" inputMode="decimal" value={form.baseSalary} onChange={(event) => update('baseSalary', event.target.value)} /></Field>{form.salaryMode === 'daily-rate' && <Field label="Daily rate (PKR)" required><input type="number" min="1" inputMode="decimal" value={form.dailyRate} onChange={(event) => update('dailyRate', event.target.value)} /></Field>}<Field label="Daily calculation rule"><select value={form.calculationRule} onChange={(event) => update('calculationRule', event.target.value as SalaryCalculationRule)}><option value="30-days">30-day rule</option><option value="26-working-days">26-working-day rule</option><option value="calendar-days">Calendar-day rule</option></select></Field></div><p className="form-hint">Default: monthly salary ÷ 30. You can revise this rule later without altering historical records.</p></div>;
}

function WorkStep({ form, update }: { form: FormState; update: (key: keyof FormState, value: FormState[keyof FormState]) => void }) {
  return <div className="form-section"><div><p className="eyebrow">STEP 3 OF 3</p><h2>Finish your work style.</h2><p>Automatic attendance runs while this workspace is open or when you return to it. It only fills blank workdays and never overwrites manual entries.</p></div><div className="form-grid"><Field label="Duty starts"><input type="time" value={form.dutyStart} onChange={(event) => update('dutyStart', event.target.value)} /></Field><Field label="Duty ends"><input type="time" value={form.dutyEnd} onChange={(event) => update('dutyEnd', event.target.value)} /></Field><Field label="Shift duration (hours)"><input type="number" min="1" max="24" value={form.shiftHours} onChange={(event) => update('shiftHours', event.target.value)} /></Field><Field label="Weekly off"><select value={form.weeklyOff} onChange={(event) => update('weeklyOff', event.target.value)}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <option value={index} key={day}>{day}</option>)}</select></Field><Field label="Auto-attendance"><select value={form.autoAttendance} onChange={(event) => update('autoAttendance', event.target.value as AutoAttendanceRule)}><option value="off">Off — manual only</option><option value="midnight">At midnight</option><option value="shift-end">At shift end</option><option value="custom-time">At a custom time</option></select></Field>{form.autoAttendance === 'custom-time' && <Field label="Custom attendance time"><input type="time" value={form.autoAttendanceTime} onChange={(event) => update('autoAttendanceTime', event.target.value)} /></Field>}</div><div className="form-switches"><Switch label="Weekly off is paid" description="Counts the configured weekly off as a full paid day." checked={form.weeklyOffPaid} onChange={(checked) => update('weeklyOffPaid', checked)} /><Switch label="Privacy mode at startup" description="Keep financial figures hidden until you reveal them." checked={form.privacyMode} onChange={(checked) => update('privacyMode', checked)} /></div><div className="form-grid compact-grid"><Field label="Language"><select value={form.language} onChange={(event) => update('language', event.target.value as AppLanguage)}><option value="en">English</option><option value="ur">Urdu (RTL ready)</option></select></Field><Field label="Theme"><select value={form.theme} onChange={(event) => update('theme', event.target.value as AppTheme)}><option value="dark">Dark neon</option><option value="light">Light</option></select></Field></div></div>;
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="field"><span>{label}{required && <em>Required</em>}</span>{children}</label>;
}

function Switch({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="switch-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="switch-control" aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span></label>;
}
