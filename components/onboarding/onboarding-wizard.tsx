'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon } from '@/components/ui/app-icon';
import { LocalizedSurface } from '@/components/layout/localized-surface';
import { defaultAppSettings, defaultSalarySettings } from '@/lib/database/repository';
import { upsertProfile, upsertAppSettings } from '@/lib/supabase/repository';
import { useAuth } from '@/hooks/use-auth';
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
const stepLabelsUr = ['شناخت', 'تنخواہ کے اصول', 'طریقۂ کار'];
const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayLabelsUr = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];

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
  const { userId } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isUrdu = form.language === 'ur';
  const steps = isUrdu ? stepLabelsUr : stepLabels;
  const update = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((previous) => ({ ...previous, [key]: value } as FormState));

  const validationError = () => {
    if (step === 0 && (!form.firstName.trim() || !form.employeeId.trim() || !form.designation.trim())) {
      return isUrdu ? 'آگے بڑھنے کے لیے اپنا نام، ملازم آئی ڈی اور عہدہ درج کریں۔' : 'Add your first name, employee ID, and designation to continue.';
    }
    if (step === 1 && (Number(form.baseSalary) <= 0 || (form.salaryMode === 'daily-rate' && Number(form.dailyRate) <= 0))) {
      return isUrdu ? 'آگے بڑھنے کے لیے درست تنخواہ کی رقم درج کریں۔' : 'Enter a valid salary amount to continue.';
    }
    if (step === 2 && (Number(form.shiftHours) < 1 || Number(form.shiftHours) > 24)) {
      return isUrdu ? 'شفٹ کا دورانیہ 1 سے 24 گھنٹے کے درمیان ہونا چاہیے۔' : 'Shift duration must be between 1 and 24 hours.';
    }
    return '';
  };

  const continueSetup = () => {
    const validation = validationError();
    if (validation) { setError(validation); return; }
    setError('');
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const finishSetup = async () => {
    const validation = validationError();
    if (validation) { setError(validation); return; }
    if (!userId) { setError('You must be signed in to save your workspace.'); return; }
    setError(''); setIsSaving(true);
    try {
      const profilePayload = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        employee_id: form.employeeId.trim(),
        designation: form.designation.trim(),
        joining_date: form.joiningDate,
        salary_mode: form.salaryMode,
        base_salary: Number(form.baseSalary),
        daily_rate: form.salaryMode === 'daily-rate' ? Number(form.dailyRate) : null,
        salary_calculation_rule: form.calculationRule,
        duty_start: form.dutyStart,
        duty_end: form.dutyEnd,
        shift_duration_hours: Number(form.shiftHours),
        weekly_off_day: Number(form.weeklyOff),
        is_weekly_off_paid: form.weeklyOffPaid,
        auto_attendance_rule: form.autoAttendance,
        auto_attendance_time: form.autoAttendance === 'custom-time' ? form.autoAttendanceTime || null : null,
        half_day_factor: 0.5,
        currency: 'PKR',
      };
      const settingsPayload = {
        theme: form.theme,
        language: form.language,
        is_privacy_mode_enabled: form.privacyMode,
        low_cash_threshold: 0,
      };
      const [profileResult, settingsResult] = await Promise.all([
        upsertProfile(userId, profilePayload),
        upsertAppSettings(userId, settingsPayload),
      ]);
      if (profileResult.error) throw new Error(profileResult.error);
      if (settingsResult.error) throw new Error(settingsResult.error);
      router.replace('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(isUrdu
        ? `آپ کا ڈیٹا محفوظ نہیں ہو سکا: ${msg}`
        : `Your data could not be saved: ${msg}`);
      setIsSaving(false);
    }
  };

  return (
    <section className="wizard-shell" aria-labelledby="onboarding-title" dir={isUrdu ? 'rtl' : undefined} data-localized-surface>
      <LocalizedSurface language={form.language} />
      <div className="wizard-intro"><p className="eyebrow">{isUrdu ? 'آن بورڈنگ' : 'ONBOARDING'}</p><h1 id="onboarding-title">{isUrdu ? 'ورک اسپیس کو اپنا بنائیں۔' : 'Make the workspace yours.'}</h1><p>{isUrdu ? 'سب کچھ اسی ڈیوائس پر رہتا ہے۔ آپ بعد میں ترتیبات میں ہر اصول تبدیل کر سکتے ہیں۔' : 'Everything stays on this device. You can adjust every rule in Settings later.'}</p></div>
      <ol className="wizard-steps" aria-label={isUrdu ? 'آن بورڈنگ کی پیشرفت' : 'Onboarding progress'}>{steps.map((label, index) => <li className={index === step ? 'wizard-step wizard-step-active' : index < step ? 'wizard-step wizard-step-done' : 'wizard-step'} key={label}><span>{index < step ? '✓' : index + 1}</span>{label}</li>)}</ol>
      <div className="wizard-card">
        {step === 0 && <IdentityStep form={form} update={update} isUrdu={isUrdu} />}
        {step === 1 && <SalaryStep form={form} update={update} isUrdu={isUrdu} />}
        {step === 2 && <WorkStep form={form} update={update} isUrdu={isUrdu} />}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="wizard-actions">
          <button className="secondary-button" type="button" disabled={step === 0 || isSaving} onClick={() => { setError(''); setStep((current) => Math.max(current - 1, 0)); }}>{isUrdu ? 'پیچھے' : 'Back'}</button>
          {step === 2 ? (
            <button className="primary-button" type="button" disabled={isSaving} onClick={finishSetup}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'سیٹ اپ مکمل کریں' : 'Finish setup')} <AppIcon name="shield" aria-hidden="true" size={17} /></button>
          ) : (
            <button className="primary-button" type="button" onClick={continueSetup}>{isUrdu ? 'جاری رکھیں' : 'Continue'} <AppIcon name="arrow-right" aria-hidden="true" size={17} /></button>
          )}
        </div>
      </div>
    </section>
  );
}

function IdentityStep({ form, update, isUrdu }: { form: FormState; update: (key: keyof FormState, value: FormState[keyof FormState]) => void; isUrdu: boolean }) {
  return (
    <div className="form-section">
      <div><p className="eyebrow">{isUrdu ? 'مرحلہ 1 از 3' : 'STEP 1 OF 3'}</p><h2>{isUrdu ? 'یہ ورک اسپیس کس کے لیے ہے؟' : 'Who is this workspace for?'}</h2><p>{isUrdu ? 'اپنی دفتری شناخت استعمال کریں — عوامی نام نہیں۔' : 'Use your work identity—not a public username.'}</p></div>
      <div className="form-grid">
        <Field label={isUrdu ? 'پہلا نام' : 'First name'} required isUrdu={isUrdu}><input autoComplete="given-name" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} placeholder={isUrdu ? 'محمد' : 'Muhammad'} /></Field>
        <Field label={isUrdu ? 'آخری نام' : 'Last name'} isUrdu={isUrdu}><input autoComplete="family-name" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} placeholder={isUrdu ? 'نعیم' : 'Naeem'} /></Field>
        <Field label={isUrdu ? 'ملازم آئی ڈی / رول نمبر' : 'Employee ID / roll number'} required isUrdu={isUrdu}><input value={form.employeeId} onChange={(event) => update('employeeId', event.target.value)} placeholder="1042" /></Field>
        <Field label={isUrdu ? 'عہدہ' : 'Designation'} required isUrdu={isUrdu}><input value={form.designation} onChange={(event) => update('designation', event.target.value)} placeholder={isUrdu ? 'اکاؤنٹنٹ' : 'Junior Accountant'} /></Field>
        <Field label={isUrdu ? 'شمولیت کی تاریخ' : 'Joining date'} isUrdu={isUrdu}><input type="date" max={today} value={form.joiningDate} onChange={(event) => update('joiningDate', event.target.value)} /></Field>
      </div>
    </div>
  );
}

function SalaryStep({ form, update, isUrdu }: { form: FormState; update: (key: keyof FormState, value: FormState[keyof FormState]) => void; isUrdu: boolean }) {
  return (
    <div className="form-section">
      <div><p className="eyebrow">{isUrdu ? 'مرحلہ 2 از 3' : 'STEP 2 OF 3'}</p><h2>{isUrdu ? 'تنخواہ کے اصول طے کریں۔' : 'Set your salary rules.'}</h2><p>{isUrdu ? 'مقررہ ماہانہ تنخواہ کیلنڈر کے دنوں سے قطع نظر یکساں رہتی ہے۔' : 'Fixed monthly salary stays constant regardless of the calendar month length.'}</p></div>
      <div className="form-grid">
        <Field label={isUrdu ? 'تنخواہ کا طریقہ' : 'Salary mode'} isUrdu={isUrdu}>
          <select value={form.salaryMode} onChange={(event) => update('salaryMode', event.target.value as SalaryMode)}>
            <option value="fixed-monthly">{isUrdu ? 'مقررہ ماہانہ' : 'Fixed monthly'}</option>
            <option value="daily-rate">{isUrdu ? 'یومیہ شرح' : 'Daily rate'}</option>
          </select>
        </Field>
        <Field label={form.salaryMode === 'fixed-monthly' ? (isUrdu ? 'بنیادی ماہانہ تنخواہ (PKR)' : 'Base monthly salary (PKR)') : (isUrdu ? 'حوالہ ماہانہ تنخواہ (PKR)' : 'Reference monthly salary (PKR)')} required isUrdu={isUrdu}>
          <input type="number" min="1" inputMode="decimal" value={form.baseSalary} onChange={(event) => update('baseSalary', event.target.value)} />
        </Field>
        {form.salaryMode === 'daily-rate' && (
          <Field label={isUrdu ? 'یومیہ شرح (PKR)' : 'Daily rate (PKR)'} required isUrdu={isUrdu}>
            <input type="number" min="1" inputMode="decimal" value={form.dailyRate} onChange={(event) => update('dailyRate', event.target.value)} />
          </Field>
        )}
        <Field label={isUrdu ? 'یومیہ حساب کا اصول' : 'Daily calculation rule'} isUrdu={isUrdu}>
          <select value={form.calculationRule} onChange={(event) => update('calculationRule', event.target.value as SalaryCalculationRule)}>
            <option value="30-days">{isUrdu ? '30 دن کا اصول' : '30-day rule'}</option>
            <option value="26-working-days">{isUrdu ? '26 کام کے دنوں کا اصول' : '26-working-day rule'}</option>
            <option value="calendar-days">{isUrdu ? 'کیلنڈر کے دنوں کا اصول' : 'Calendar-day rule'}</option>
          </select>
        </Field>
      </div>
      <p className="form-hint">{isUrdu ? 'ڈیفالٹ: ماہانہ تنخواہ ÷ 30۔ آپ ماضی کے ریکارڈ کو بدلے بغیر بعد میں اسے تبدیل کر سکتے ہیں۔' : 'Default: monthly salary ÷ 30. You can revise this rule later without altering historical records.'}</p>
    </div>
  );
}

function WorkStep({ form, update, isUrdu }: { form: FormState; update: (key: keyof FormState, value: FormState[keyof FormState]) => void; isUrdu: boolean }) {
  const weekdays = isUrdu ? weekdayLabelsUr : weekdayLabels;
  return (
    <div className="form-section">
      <div><p className="eyebrow">{isUrdu ? 'مرحلہ 3 از 3' : 'STEP 3 OF 3'}</p><h2>{isUrdu ? 'اپنا طریقۂ کار مکمل کریں۔' : 'Finish your work style.'}</h2><p>{isUrdu ? 'خودکار حاضری ایپ کھلی ہونے یا واپس آنے پر چلتی ہے۔ یہ صرف خالی دن پر کرتی ہے اور دستی اندراجات کو تبدیل نہیں کرتی۔' : 'Automatic attendance runs while this workspace is open or when you return to it. It only fills blank workdays and never overwrites manual entries.'}</p></div>
      <div className="form-grid">
        <Field label={isUrdu ? 'ڈیوٹی شروع' : 'Duty starts'} isUrdu={isUrdu}><input type="time" value={form.dutyStart} onChange={(event) => update('dutyStart', event.target.value)} /></Field>
        <Field label={isUrdu ? 'ڈیوٹی ختم' : 'Duty ends'} isUrdu={isUrdu}><input type="time" value={form.dutyEnd} onChange={(event) => update('dutyEnd', event.target.value)} /></Field>
        <Field label={isUrdu ? 'شفٹ دورانیہ (گھنٹے)' : 'Shift duration (hours)'} isUrdu={isUrdu}><input type="number" min="1" max="24" value={form.shiftHours} onChange={(event) => update('shiftHours', event.target.value)} /></Field>
        <Field label={isUrdu ? 'ہفتہ وار چھٹی' : 'Weekly off'} isUrdu={isUrdu}>
          <select value={form.weeklyOff} onChange={(event) => update('weeklyOff', event.target.value)}>
            {weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}
          </select>
        </Field>
        <Field label={isUrdu ? 'خودکار حاضری' : 'Auto-attendance'} isUrdu={isUrdu}>
          <select value={form.autoAttendance} onChange={(event) => update('autoAttendance', event.target.value as AutoAttendanceRule)}>
            <option value="off">{isUrdu ? 'بند — صرف دستی' : 'Off — manual only'}</option>
            <option value="midnight">{isUrdu ? 'آدھی رات کو' : 'At midnight'}</option>
            <option value="shift-end">{isUrdu ? 'شفٹ کے اختتام پر' : 'At shift end'}</option>
            <option value="custom-time">{isUrdu ? 'مخصوص وقت پر' : 'At a custom time'}</option>
          </select>
        </Field>
        {form.autoAttendance === 'custom-time' && (
          <Field label={isUrdu ? 'مخصوص حاضری کا وقت' : 'Custom attendance time'} isUrdu={isUrdu}><input type="time" value={form.autoAttendanceTime} onChange={(event) => update('autoAttendanceTime', event.target.value)} /></Field>
        )}
      </div>
      <div className="form-switches">
        <Switch label={isUrdu ? 'با معاوضہ ہفتہ وار چھٹی' : 'Weekly off is paid'} description={isUrdu ? 'طے شدہ ہفتہ وار چھٹی کو مکمل با معاوضہ دن شمار کرتا ہے۔' : 'Counts the configured weekly off as a full paid day.'} checked={form.weeklyOffPaid} onChange={(checked) => update('weeklyOffPaid', checked)} />
        <Switch label={isUrdu ? 'شروع میں رازداری موڈ' : 'Privacy mode at startup'} description={isUrdu ? 'مالی رقوم کو دکھانے تک دھندلا رکھیں۔' : 'Keep financial figures hidden until you reveal them.'} checked={form.privacyMode} onChange={(checked) => update('privacyMode', checked)} />
      </div>
      <div className="form-grid compact-grid">
        <Field label={isUrdu ? 'زبان' : 'Language'} isUrdu={isUrdu}>
          <select value={form.language} onChange={(event) => update('language', event.target.value as AppLanguage)}>
            <option value="en">English</option>
            <option value="ur">{isUrdu ? 'اردو (دائیں سے بائیں)' : 'Urdu (RTL ready)'}</option>
          </select>
        </Field>
        <Field label={isUrdu ? 'تھیم' : 'Theme'} isUrdu={isUrdu}>
          <select value={form.theme} onChange={(event) => update('theme', event.target.value as AppTheme)}>
            <option value="dark">{isUrdu ? 'گہرا نیون' : 'Dark neon'}</option>
            <option value="light">{isUrdu ? 'روشن' : 'Light'}</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, required = false, isUrdu = false, children }: { label: string; required?: boolean; isUrdu?: boolean; children: ReactNode }) {
  return <label className="field"><span>{label}{required && <em>{isUrdu ? 'لازمی' : 'Required'}</em>}</span>{children}</label>;
}

function Switch({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="switch-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="switch-control" aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span></label>;
}
