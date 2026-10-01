'use client';

/* eslint-disable @next/next/no-img-element -- Receipt images are local data URLs and must not be sent to an image optimizer. */

import Link from 'next/link';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { getPocketBalance, isPocketDebit } from '@/lib/calculations/pocket-balance';
import { addPocketTransaction, addSavingsGoal, addSavingsTransfer, clearUdhaarReminder, deletePocketTransaction, deleteSavingsGoal, updateSavingsGoal } from '@/lib/database/repository';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatDate, getLocalDateValue } from '@/lib/formatting/date';
import { MAX_RECEIPT_DATA_URL_LENGTH, pocketCategories } from '@/lib/validation/domain';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { usePocketRecords } from '@/hooks/use-pocket-records';
import { useAppTranslation } from '@/hooks/use-app-translation';
import type { AppLanguage, PocketCategory, PocketTransaction, PocketTransactionType, SavingsGoal } from '@/types/domain';

const transactionLabels: Record<PocketTransactionType, string> = { 'cash-in': 'Cash in', expense: 'Expense', receipt: 'Receipt', 'udhaar-given': 'Udhaar given', 'udhaar-received': 'Udhaar received', 'savings-transfer-out': 'To savings', 'savings-transfer-in': 'From savings' };
const transactionLabelsUr: Record<PocketTransactionType, string> = { 'cash-in': 'کیش آمد', expense: 'خرچہ', receipt: 'رسید', 'udhaar-given': 'دیا گیا ادھار', 'udhaar-received': 'وصول شدہ ادھار', 'savings-transfer-out': 'بچت میں بھیجی گئی', 'savings-transfer-in': 'بچت سے نکالی گئی' };
const categoryLabels: Record<PocketCategory, string> = { income: 'Income', food: 'Food', transport: 'Transport', bills: 'Bills', shopping: 'Shopping', health: 'Health', education: 'Education', family: 'Family', entertainment: 'Entertainment', other: 'Other' };
const categoryLabelsUr: Record<PocketCategory, string> = { income: 'آمدنی', food: 'کھانا پینا', transport: 'آمد و رفت', bills: 'بلز', shopping: 'خریداری', health: 'صحت', education: 'تعلیم', family: 'خاندان', entertainment: 'تفریح', other: 'دیگر' };
const entryTypes: PocketTransactionType[] = ['cash-in', 'expense', 'receipt', 'udhaar-given', 'udhaar-received'];
const maxReceiptBytes = 1_000_000;

export function PocketContent() {
  const { t } = useAppTranslation();
  const { records, isLoading, isOnboarded } = useCurrentAppRecords();
  const { transactions, goals, isLoading: recordsLoading } = usePocketRecords();
  if (isLoading || recordsLoading) return <section className="dashboard-loading" aria-live="polite">Loading your private pocket…</section>;
  if (!isOnboarded) return <SetupRequired />;

  const language = records?.appSettings?.language;
  const isUrdu = language === 'ur';
  const balance = getPocketBalance(transactions);
  const incoming = transactions.filter((transaction) => !isPocketDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);
  const outgoing = transactions.filter((transaction) => isPocketDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);
  const saved = goals.reduce((total, goal) => total + goal.savedAmount, 0);
  const threshold = records?.appSettings?.lowCashThreshold ?? 0;
  const reminders = transactions.filter((transaction) => transaction.type === 'udhaar-given' && transaction.reminderOn).sort((first, second) => (first.reminderOn ?? '').localeCompare(second.reminderOn ?? ''));

  return (
    <section className="pocket-page">
      <header className="page-heading"><div><p className="eyebrow">{isUrdu ? 'ذاتی رقم' : 'PERSONAL POCKET'}</p><h1>{isUrdu ? 'اپنی ذاتی رقم کا واضح حساب رکھیں۔' : 'Keep your personal money clear.'}</h1><p className="page-subtitle">{isUrdu ? 'کیش، رسیدیں، ٹرانسفرز، ادھار اور بچت اسی ڈیوائس پر رہتے ہیں اور کمپنی بیلنس کو تبدیل نہیں کرتے۔' : 'Cash, receipts, transfers, Udhaar, and savings stay on this device and never change your company balance.'}</p></div></header>
      <section className="pocket-balance-card"><div><p className="eyebrow">{isUrdu ? 'دستیاب کیش' : 'AVAILABLE CASH'}</p><strong className={balance < 0 ? 'balance-negative' : ''}>{formatCurrency(balance)}</strong><p>{balance >= 0 ? (isUrdu ? 'مقامی طور پر ریکارڈ شدہ ذاتی رقم' : 'Personal money recorded locally') : (isUrdu ? 'اخراجات وصول شدہ رقم سے زیادہ ہیں' : 'Outgoing entries exceed incoming money')}</p></div><span className="local-pill"><span className="pulse-dot" />{isUrdu ? 'نجی اور مقامی' : 'Private & local'}</span></section>
      {threshold > 0 && balance <= threshold ? <section className="pocket-alert" role="status"><AppIcon name="wallet" aria-hidden="true" size={20} /><div><strong>{t('lowCashAlert')}</strong><span>{isUrdu ? `${formatCurrency(balance)} آپ کی مقرر کردہ حد ${formatCurrency(threshold)} کے برابر یا اس سے کم ہے۔` : `${formatCurrency(balance)} is at or below your ${formatCurrency(threshold)} threshold.`}</span></div><Link href="/settings" className="secondary-button">{t('adjust')}</Link></section> : null}
      <div className="company-summary pocket-summary"><SummaryCard label={isUrdu ? 'آمد' : 'Money in'} amount={incoming} tone="credit" language={language} /><SummaryCard label={isUrdu ? 'اخراجات' : 'Money out'} amount={outgoing} tone="debit" language={language} /><SummaryCard label={isUrdu ? 'بچت کا ہدف' : 'Saved toward goals'} amount={saved} tone="neutral" language={language} /></div>
      {reminders.length ? <UdhaarReminderPanel reminders={reminders} language={language} /> : null}
      <div className="pocket-layout"><TransactionForm language={language} /><TransactionList transactions={transactions} goals={goals} language={language} /></div>
      <section className="transfer-section"><div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'سیونگ ٹرانسفر' : 'SAVINGS TRANSFER'}</p><h2>{isUrdu ? 'پیسے منتقل کریں بغیر ٹریک کھوئے۔' : 'Move money without losing the trail.'}</h2></div></div><SavingsTransferForm goals={goals} language={language} /></section>
      <section className="savings-section"><div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'سیونگز گولز' : 'SAVINGS GOALS'}</p><h2>{isUrdu ? 'ہر بچت کو ایک مقصد دیں۔' : 'Give every saving a purpose.'}</h2></div><span className="progress-label">{goals.length} {isUrdu ? 'گولز' : 'goals'}</span></div><div className="savings-layout"><SavingsGoalForm language={language} /><div className="savings-goal-list">{goals.length ? goals.map((goal) => <SavingsGoalCard key={goal.id} goal={goal} language={language} />) : <div className="ledger-empty"><AppIcon name="wallet" aria-hidden="true" size={24} /><p>{isUrdu ? 'ابھی کوئی سیونگ گول نہیں ہے۔' : 'No savings goals yet.'}</p><span>{isUrdu ? 'ذاتی کیش منتقل کرنے سے پہلے ایک ہدف بنائیں۔' : 'Create a target before moving pocket cash into it.'}</span></div>}</div></div></section>
    </section>
  );
}

function TransactionForm({ language }: { language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [type, setType] = useState<PocketTransactionType>('cash-in'); const [amount, setAmount] = useState(''); const [occurredOn, setOccurredOn] = useState(getLocalDateValue); const [category, setCategory] = useState<PocketCategory>('other'); const [note, setNote] = useState(''); const [reminderOn, setReminderOn] = useState(''); const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null); const [status, setStatus] = useState(''); const [isSaving, setIsSaving] = useState(false);
  const selectReceipt = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxReceiptBytes) { setStatus(isUrdu ? '1 MB سے کم سائز کی JPG, PNG یا WebP رسید منتخب کریں۔' : 'Choose a JPG, PNG, or WebP receipt no larger than 1 MB.'); return; } try { const dataUrl = await readReceipt(file); if (dataUrl.length > MAX_RECEIPT_DATA_URL_LENGTH) throw new Error(); setReceiptDataUrl(dataUrl); setStatus(isUrdu ? 'رسید کی تصویر تیار ہے اور صرف اسی ڈیوائس پر رہے گی۔' : 'Receipt image is ready and will stay on this device.'); } catch { setStatus(isUrdu ? 'رسید کی تصویر نہیں پڑھی جا سکی۔' : 'Could not read that receipt image.'); } };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const parsedAmount = Number(amount); if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setStatus(isUrdu ? 'صفر سے زیادہ رقم درج کریں۔' : 'Enter an amount greater than zero.'); return; } setIsSaving(true); setStatus(''); try { await addPocketTransaction({ type, amount: parsedAmount, occurredOn, category, note: note.trim(), receiptDataUrl, savingsGoalId: null, reminderOn: type === 'udhaar-given' ? reminderOn || null : null }); setAmount(''); setNote(''); setCategory('other'); setReminderOn(''); setReceiptDataUrl(null); setStatus(isUrdu ? 'اندراج مقامی طور پر محفوظ ہو گیا۔' : 'Pocket entry saved locally.'); } catch (error) { setStatus(error instanceof Error ? error.message : (isUrdu ? 'اندراج محفوظ نہیں ہو سکا۔' : 'Could not save this pocket entry.')); } finally { setIsSaving(false); } };
  return (
    <section className="company-entry-form">
      <div><p className="eyebrow">{isUrdu ? 'نیا اندراج' : 'NEW POCKET ENTRY'}</p><h2>{isUrdu ? 'رقم درج کریں۔' : 'Record a movement.'}</h2><p>{isUrdu ? 'زمرہ جات، رسیدوں کی تصاویر اور ادھار یاد دہانیاں صرف اسی ڈیوائس پر رہتی ہیں۔' : 'Categories, receipt images, and Udhaar reminders remain only on this device.'}</p></div>
      <form onSubmit={submit}>
        <label className="field"><span>{isUrdu ? 'اندراج کی قسم' : 'Entry type'}</span><select value={type} onChange={(event) => setType(event.target.value as PocketTransactionType)}>{entryTypes.map((value) => <option value={value} key={value}>{isUrdu ? transactionLabelsUr[value] : transactionLabels[value]}</option>)}</select></label>
        <div className="form-grid compact-form-grid"><label className="field"><span>{isUrdu ? 'رقم (PKR)' : 'Amount (PKR)'}</span><input type="number" min="1" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></label><label className="field"><span>{isUrdu ? 'تاریخ' : 'Date'}</span><input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></label></div>
        <label className="field"><span>{isUrdu ? 'زمرہ' : 'Category'}</span><select value={category} onChange={(event) => setCategory(event.target.value as PocketCategory)}>{pocketCategories.map((value) => <option value={value} key={value}>{isUrdu ? categoryLabelsUr[value] : categoryLabels[value]}</option>)}</select></label>
        {type === 'udhaar-given' ? <label className="field"><span>{isUrdu ? 'یاد دہانی کی تاریخ اختیاری' : 'Reminder date optional'}</span><input type="date" value={reminderOn} onChange={(event) => setReminderOn(event.target.value)} /></label> : null}
        <label className="field"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اختیاری تفصیل' : 'Optional detail'} /></label>
        <div className="receipt-picker"><div><strong>{isUrdu ? 'رسید کی تصویر' : 'Receipt image'}</strong><small>{isUrdu ? 'اختیاری JPG, PNG یا WebP · زیادہ سے زیادہ 1 MB' : 'Optional JPG, PNG, or WebP · max 1 MB'}</small></div><label className="secondary-button"><span>{receiptDataUrl ? (isUrdu ? 'رسید تبدیل کریں' : 'Replace receipt') : (isUrdu ? 'رسید منسلک کریں' : 'Attach receipt')}</span><input accept="image/jpeg,image/png,image/webp" type="file" onChange={selectReceipt} /></label>{receiptDataUrl ? <><img src={receiptDataUrl} alt={isUrdu ? 'منتخب رسید کا پریویو' : 'Selected receipt preview'} /><button className="remove-button" type="button" onClick={() => { setReceiptDataUrl(null); setStatus(isUrdu ? 'محفوظ کرنے سے پہلے رسید ہٹا دی گئی۔' : 'Receipt removed before saving.'); }}>{isUrdu ? 'رسید ہٹائیں' : 'Remove receipt'}</button></> : null}</div>
        <div className="editor-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'اندراج شامل کریں' : 'Add entry')} <AppIcon name="plus" aria-hidden="true" size={17} /></button></div>
      </form>
    </section>
  );
}

function SavingsTransferForm({ goals, language }: { goals: SavingsGoal[]; language?: AppLanguage }) {
  const { t } = useAppTranslation();
  const isUrdu = language === 'ur';
  const [direction, setDirection] = useState<'to-goal' | 'from-goal'>('to-goal'); const [goalId, setGoalId] = useState(''); const [amount, setAmount] = useState(''); const [occurredOn, setOccurredOn] = useState(getLocalDateValue); const [note, setNote] = useState(''); const [status, setStatus] = useState(''); const [isSaving, setIsSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = Number(amount); if (!goalId || !Number.isFinite(value) || value <= 0) { setStatus(isUrdu ? 'گول منتخب کریں اور صفر سے زیادہ رقم درج کریں۔' : 'Choose a goal and enter an amount greater than zero.'); return; } setIsSaving(true); setStatus(''); try { await addSavingsTransfer({ direction, savingsGoalId: goalId, amount: value, occurredOn, note: note.trim() }); setAmount(''); setNote(''); setStatus(t('transferSaved')); } catch (error) { setStatus(error instanceof Error ? error.message : (isUrdu ? 'یہ ٹرانسفر محفوظ نہیں ہو سکا۔' : 'Could not save this transfer.')); } finally { setIsSaving(false); } };
  if (!goals.length) return <p className="form-hint">{isUrdu ? 'پہلے سیونگ گول بنائیں۔ پھر ٹرانسفرز خودکار طور پر لیجر اور گول کو اپ ڈیٹ کر دیں گے۔' : 'Create a savings goal first. Transfers then create a linked pocket ledger entry and update that goal automatically.'}</p>;
  return (
    <form className="transfer-form" onSubmit={submit}>
      <label className="field"><span>{isUrdu ? 'سمت' : 'Direction'}</span><select value={direction} onChange={(event) => setDirection(event.target.value as 'to-goal' | 'from-goal')}><option value="to-goal">{isUrdu ? 'ذاتی کیش → سیونگ گول' : 'Pocket cash → savings goal'}</option><option value="from-goal">{isUrdu ? 'سیونگ گول → ذاتی کیش' : 'Savings goal → pocket cash'}</option></select></label>
      <label className="field"><span>{isUrdu ? 'سیونگز گول' : 'Savings goal'}</span><select value={goalId} onChange={(event) => setGoalId(event.target.value)} required><option value="">{isUrdu ? 'گول منتخب کریں' : 'Choose a goal'}</option>{goals.map((goal) => <option value={goal.id} key={goal.id}>{goal.name} · {formatCurrency(goal.savedAmount)}</option>)}</select></label>
      <div className="form-grid compact-form-grid"><label className="field"><span>{isUrdu ? 'رقم (PKR)' : 'Amount (PKR)'}</span><input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label className="field"><span>{isUrdu ? 'تاریخ' : 'Date'}</span><input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></label></div>
      <label className="field"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اختیاری تفصیل' : 'Optional detail'} /></label>
      <div className="editor-actions"><span role="status">{status}</span><button className="secondary-button" type="submit" disabled={isSaving}>{isSaving ? t('saving') : t('saveTransfer')}</button></div>
    </form>
  );
}

function UdhaarReminderPanel({ reminders, language }: { reminders: PocketTransaction[]; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [clearingId, setClearingId] = useState<string | null>(null); const [status, setStatus] = useState(''); const today = getLocalDateValue();
  const clear = async (id: string) => { setClearingId(id); setStatus(''); try { await clearUdhaarReminder(id); setStatus(isUrdu ? 'یاد دہانی صاف ہو گئی؛ ادھار کا اندراج محفوظ رہے گا۔' : 'Reminder cleared; the Udhaar ledger entry remains saved.'); } catch (error) { setStatus(error instanceof Error ? error.message : (isUrdu ? 'یاد دہانی صاف نہیں ہو سکی۔' : 'Could not clear this reminder.')); } finally { setClearingId(null); } };
  return (
    <section className="udhaar-reminders">
      <div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'ادھار یاد دہانیاں' : 'UDHAAR REMINDERS'}</p><h2>{isUrdu ? 'دی گئی رقم کا تعاقب کریں۔' : 'Follow up on money lent.'}</h2></div><span className="progress-label">{reminders.length} {isUrdu ? 'شیڈول شدہ' : 'scheduled'}</span></div>
      <ul>
        {reminders.map((transaction) => (
          <li key={transaction.id}>
            <div><strong data-user-content>{transaction.note || (isUrdu ? 'دیا گیا ادھار' : 'Udhaar given')}</strong><small className={transaction.reminderOn! <= today ? 'reminder-overdue' : ''}>{transaction.reminderOn! <= today ? (isUrdu ? 'واجب الادا' : 'Due') : (isUrdu ? 'تاریخ ادائیگی' : 'Due on')} {formatDate(transaction.reminderOn!)}</small></div>
            <b>{formatCurrency(transaction.amount)}</b>
            <button type="button" className="secondary-button" disabled={clearingId === transaction.id} onClick={() => clear(transaction.id)}>{clearingId === transaction.id ? (isUrdu ? 'صاف ہو رہا ہے…' : 'Clearing…') : (isUrdu ? 'یاد دہانی صاف کریں' : 'Clear reminder')}</button>
          </li>
        ))}
      </ul>
      <span className="field-status" role="status">{status}</span>
    </section>
  );
}

function TransactionList({ transactions, goals, language }: { transactions: PocketTransaction[]; goals: SavingsGoal[]; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<PocketTransaction | null>(null);
  const receiptDialogRef = useRef<HTMLDivElement>(null);
  const receiptCloseButtonRef = useRef<HTMLButtonElement>(null);
  const receiptTriggerRef = useRef<HTMLButtonElement>(null);
  const goalNames = new Map(goals.map((goal) => [goal.id, goal.name]));
  useEffect(() => {
    if (!viewingReceipt) return;

    const trigger = receiptTriggerRef.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const focusCloseButton = window.setTimeout(() => receiptCloseButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setViewingReceipt(null);
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = receiptDialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusCloseButton);
      document.removeEventListener('keydown', handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [viewingReceipt]);
  const remove = async (transaction: PocketTransaction) => {
    const typeLabel = isUrdu ? transactionLabelsUr[transaction.type] : transactionLabels[transaction.type];
    if (!window.confirm(isUrdu ? `کیا آپ ${formatDate(transaction.occurredOn)} سے ${typeLabel} ہٹانا چاہتے ہیں؟` : `Remove ${transactionLabels[transaction.type].toLowerCase()} from ${formatDate(transaction.occurredOn)}?`)) return;
    setRemovingId(transaction.id);
    try { await deletePocketTransaction(transaction.id); } finally { setRemovingId(null); }
  };
  return (
    <>
      <section className="company-transaction-list">
        <div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'ذاتی لیجر' : 'POCKET LEDGER'}</p><h2>{isUrdu ? 'حالیہ سرگرمی' : 'Recent activity'}</h2></div><span className="progress-label">{transactions.length} {isUrdu ? 'کل' : 'total'}</span></div>
        {transactions.length ? (
          <ul>
            {transactions.map((transaction) => {
              const isDebit = isPocketDebit(transaction.type);
              const goalName = transaction.savingsGoalId ? goalNames.get(transaction.savingsGoalId) : null;
              return (
                <li key={transaction.id}>
                  <span className={`transaction-type pocket-${transaction.type}`}>{isUrdu ? transactionLabelsUr[transaction.type] : transactionLabels[transaction.type]}</span>
                  <div><strong data-user-content>{transaction.note || (isUrdu ? 'کوئی نوٹ نہیں' : 'No note added')}</strong><small>{formatDate(transaction.occurredOn)} · {goalName ? <span data-user-content>{goalName}</span> : (isUrdu ? categoryLabelsUr[transaction.category] : categoryLabels[transaction.category])}</small></div>
                  <b className={isDebit ? 'transaction-debit' : 'transaction-credit'}>{isDebit ? '−' : '+'}{formatCurrency(transaction.amount)}</b>
                  {transaction.receiptDataUrl ? <button className="receipt-view-button" type="button" onClick={(event) => { receiptTriggerRef.current = event.currentTarget; setViewingReceipt(transaction); }}>{isUrdu ? 'رسید' : 'Receipt'}</button> : null}
                  <button className="remove-button" type="button" disabled={removingId === transaction.id} onClick={() => remove(transaction)} aria-label={isUrdu ? `${transactionLabelsUr[transaction.type]} ہٹائیں` : `Remove ${transactionLabels[transaction.type]} entry`}>{removingId === transaction.id ? '…' : (isUrdu ? 'ہٹائیں' : 'Remove')}</button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="ledger-empty"><AppIcon name="wallet" aria-hidden="true" size={24} /><p>{isUrdu ? 'ابھی کوئی ذاتی اندراج نہیں ہے۔' : 'No pocket entries yet.'}</p><span>{isUrdu ? 'اپنے ذاتی لیجر میں دیکھنے کے لیے کیش کی نقل و حرکت درج کریں۔' : 'Record a cash movement to see it in your personal ledger.'}</span></div>
        )}
      </section>
      {viewingReceipt?.receiptDataUrl ? (
        <div ref={receiptDialogRef} className="receipt-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-title" aria-describedby="receipt-description" tabIndex={-1} onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingReceipt(null); }}>
          <div>
            <p id="receipt-description" className="sr-only">{isUrdu ? 'رسید دیکھنے کا مکالمہ۔ اسے بند کرنے کے لیے Escape دبائیں۔' : 'Receipt viewer dialog. Press Escape to close it.'}</p>
            <div className="receipt-dialog-heading"><h2 id="receipt-title">{isUrdu ? `رسید · ${formatDate(viewingReceipt.occurredOn)}` : `Receipt · ${formatDate(viewingReceipt.occurredOn)}`}</h2><button ref={receiptCloseButtonRef} className="remove-button" type="button" onClick={() => setViewingReceipt(null)}>{isUrdu ? 'بند کریں' : 'Close'}</button></div>
            <img src={viewingReceipt.receiptDataUrl} alt={isUrdu ? `${formatCurrency(viewingReceipt.amount)} کی رسید` : `Receipt for ${formatCurrency(viewingReceipt.amount)} ${viewingReceipt.note ? `— ${viewingReceipt.note}` : ''}`} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function SavingsGoalForm({ language }: { language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [name, setName] = useState(''); const [targetAmount, setTargetAmount] = useState(''); const [savedAmount, setSavedAmount] = useState(''); const [targetDate, setTargetDate] = useState(''); const [note, setNote] = useState(''); const [status, setStatus] = useState(''); const [isSaving, setIsSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const target = Number(targetAmount); const saved = savedAmount === '' ? 0 : Number(savedAmount); if (!name.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0) { setStatus(isUrdu ? 'ایک نام، صفر سے زیادہ ہدف اور درست محفوظ شدہ رقم درج کریں۔' : 'Add a name, a target above zero, and a valid saved amount.'); return; } setIsSaving(true); setStatus(''); try { await addSavingsGoal({ name: name.trim(), targetAmount: target, savedAmount: saved, targetDate: targetDate || null, note: note.trim() }); setName(''); setTargetAmount(''); setSavedAmount(''); setTargetDate(''); setNote(''); setStatus(isUrdu ? 'سیونگ گول مقامی طور پر بن گیا۔' : 'Savings goal created locally.'); } catch { setStatus(isUrdu ? 'سیونگ گول نہیں بن سکا۔ دوبارہ کوشش کریں۔' : 'Could not create this savings goal. Please try again.'); } finally { setIsSaving(false); } };
  return (
    <form className="savings-goal-form" onSubmit={submit}>
      <p className="eyebrow">{isUrdu ? 'نیا ہدف' : 'NEW TARGET'}</p>
      <label className="field"><span>{isUrdu ? 'گول کا نام' : 'Goal name'}</span><input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder={isUrdu ? 'ہنگامی فنڈ' : 'Emergency fund'} required /></label>
      <div className="form-grid compact-form-grid"><label className="field"><span>{isUrdu ? 'ہدف (PKR)' : 'Target (PKR)'}</span><input type="number" min="1" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="0" required /></label><label className="field"><span>{isUrdu ? 'ابھی محفوظ شدہ (PKR)' : 'Saved now (PKR)'}</span><input type="number" min="0" value={savedAmount} onChange={(event) => setSavedAmount(event.target.value)} placeholder="0" /></label></div>
      <label className="field"><span>{isUrdu ? 'ہدف تاریخ' : 'Target date'}</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
      <label className="field"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={100} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اختیاری یاد دہانی' : 'Optional reminder'} /></label>
      <div className="editor-actions"><span role="status">{status}</span><button className="secondary-button" type="submit" disabled={isSaving}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'گول بنائیں' : 'Create goal')}</button></div>
    </form>
  );
}

function SavingsGoalCard({ goal, language }: { goal: SavingsGoal; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [savedAmount, setSavedAmount] = useState(String(goal.savedAmount)); const [status, setStatus] = useState(''); const [isSaving, setIsSaving] = useState(false); const percentage = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
  const saveProgress = async () => { const nextSavedAmount = Number(savedAmount); if (!Number.isFinite(nextSavedAmount) || nextSavedAmount < 0) { setStatus(isUrdu ? 'درست محفوظ شدہ رقم درج کریں۔' : 'Enter a valid saved amount.'); return; } setIsSaving(true); setStatus(''); try { await updateSavingsGoal({ ...goal, savedAmount: nextSavedAmount }); setStatus(isUrdu ? 'پیشرفت محفوظ ہو گئی۔' : 'Progress saved.'); } catch { setStatus(isUrdu ? 'پیشرفت محفوظ نہیں ہو سکی۔' : 'Could not save progress.'); } finally { setIsSaving(false); } };
  const remove = async () => { if (window.confirm(isUrdu ? `کیا آپ ${goal.name} سیونگ گول ہٹانا چاہتے ہیں؟` : `Remove the ${goal.name} savings goal?`)) await deleteSavingsGoal(goal.id); };
  return (
    <article className="savings-goal-card">
      <div className="goal-card-heading"><div><strong data-user-content>{goal.name}</strong><small>{goal.targetDate ? (isUrdu ? `ہدف تاریخ: ${formatDate(goal.targetDate)}` : `Target: ${formatDate(goal.targetDate)}`) : (isUrdu ? 'کوئی ہدف تاریخ نہیں' : 'No target date')}</small></div><button className="remove-button" type="button" onClick={remove}>{isUrdu ? 'ہٹائیں' : 'Remove'}</button></div>
      <div className="goal-progress-copy"><span>{isUrdu ? `${formatCurrency(goal.savedAmount)} محفوظ` : `${formatCurrency(goal.savedAmount)} saved`}</span><b>{Math.round(percentage)}%</b></div>
      <progress value={Math.min(goal.savedAmount, goal.targetAmount)} max={goal.targetAmount}>{percentage}%</progress>
      <p>{isUrdu ? `${formatCurrency(goal.targetAmount)} میں سے ${formatCurrency(Math.max(0, goal.targetAmount - goal.savedAmount))} باقی` : `${formatCurrency(Math.max(0, goal.targetAmount - goal.savedAmount))} remaining of ${formatCurrency(goal.targetAmount)}`}</p>
      {goal.note ? <small className="goal-note" data-user-content>{goal.note}</small> : null}
      <div className="goal-update"><label className="field"><span>{isUrdu ? 'محفوظ شدہ رقم (PKR)' : 'Saved amount (PKR)'}</span><input type="number" min="0" value={savedAmount} onChange={(event) => setSavedAmount(event.target.value)} /></label><button className="secondary-button" type="button" disabled={isSaving} onClick={saveProgress}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'اپ ڈیٹ' : 'Update')}</button></div>
      <span className="field-status" role="status">{status}</span>
    </article>
  );
}

function SummaryCard({ label, amount, tone, language }: { label: string; amount: number; tone: 'credit' | 'debit' | 'neutral'; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const subtitle = tone === 'credit' ? (isUrdu ? 'ریکارڈ شدہ آمد' : 'recorded incoming') : tone === 'debit' ? (isUrdu ? 'ریکارڈ شدہ اخراجات' : 'recorded outgoing') : (isUrdu ? 'محفوظ رقم' : 'set aside');
  return (
    <article>
      <span>{label}</span>
      <strong className={tone === 'credit' ? 'transaction-credit' : tone === 'debit' ? 'transaction-debit' : ''}>{formatCurrency(amount)}</strong>
      <small>{subtitle}</small>
    </article>
  );
}
function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="wallet" aria-hidden="true" size={28} /></span><p className="eyebrow">PERSONAL POCKET</p><h1>Set up your workspace first.</h1><p>Your private pocket is ready after you complete the local salary setup.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }
function readReceipt(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(reader.error); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Receipt could not be read.')); reader.readAsDataURL(file); }); }
