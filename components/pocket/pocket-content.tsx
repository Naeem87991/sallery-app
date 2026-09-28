'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { getPocketBalance, isPocketDebit } from '@/lib/calculations/pocket-balance';
import { addPocketTransaction, addSavingsGoal, deletePocketTransaction, deleteSavingsGoal, updateSavingsGoal } from '@/lib/database/repository';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatDate, getLocalDateValue } from '@/lib/formatting/date';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { usePocketRecords } from '@/hooks/use-pocket-records';
import type { PocketTransaction, PocketTransactionType, SavingsGoal } from '@/types/domain';

const transactionLabels: Record<PocketTransactionType, string> = {
  'cash-in': 'Cash in',
  expense: 'Expense',
  receipt: 'Receipt',
  'udhaar-given': 'Udhaar given',
  'udhaar-received': 'Udhaar received',
};

export function PocketContent() {
  const { isLoading, isOnboarded } = useCurrentAppRecords();
  const { transactions, goals, isLoading: recordsLoading } = usePocketRecords();

  if (isLoading || recordsLoading) return <section className="dashboard-loading" aria-live="polite">Loading your private pocket…</section>;
  if (!isOnboarded) return <SetupRequired />;

  const balance = getPocketBalance(transactions);
  const incoming = transactions.filter((transaction) => !isPocketDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);
  const outgoing = transactions.filter((transaction) => isPocketDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);
  const saved = goals.reduce((total, goal) => total + goal.savedAmount, 0);

  return <section className="pocket-page"><header className="page-heading"><div><p className="eyebrow">PERSONAL POCKET</p><h1>Keep your personal money clear.</h1><p className="page-subtitle">Cash, receipts, expenses, Udhaar, and savings stay on this device and never change your company balance.</p></div></header><section className="pocket-balance-card"><div><p className="eyebrow">AVAILABLE CASH</p><strong className={balance < 0 ? 'balance-negative' : ''}>{formatCurrency(balance)}</strong><p>{balance >= 0 ? 'Personal money recorded locally' : 'Outgoing entries exceed incoming money'}</p></div><span className="local-pill"><span className="pulse-dot" />Private &amp; local</span></section><div className="company-summary pocket-summary"><SummaryCard label="Money in" amount={incoming} tone="credit" /><SummaryCard label="Money out" amount={outgoing} tone="debit" /><SummaryCard label="Saved toward goals" amount={saved} tone="neutral" /></div><div className="pocket-layout"><TransactionForm /><TransactionList transactions={transactions} /></div><section className="savings-section"><div className="panel-heading"><div><p className="eyebrow">SAVINGS GOALS</p><h2>Give every saving a purpose.</h2></div><span className="progress-label">{goals.length} goals</span></div><div className="savings-layout"><SavingsGoalForm /><div className="savings-goal-list">{goals.length ? goals.map((goal) => <SavingsGoalCard key={goal.id} goal={goal} />) : <div className="ledger-empty"><AppIcon name="wallet" aria-hidden="true" size={24} /><p>No savings goals yet.</p><span>Create a target and update your saved amount whenever you add to it.</span></div>}</div></div></section></section>;
}

function TransactionForm() {
  const [type, setType] = useState<PocketTransactionType>('cash-in');
  const [amount, setAmount] = useState('');
  const [occurredOn, setOccurredOn] = useState(getLocalDateValue);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setStatus('Enter an amount greater than zero.'); return; }
    setIsSaving(true); setStatus('');
    try {
      await addPocketTransaction({ type, amount: parsedAmount, occurredOn, note: note.trim() });
      setAmount(''); setNote(''); setStatus('Pocket entry saved locally.');
    } catch { setStatus('Could not save this pocket entry. Please try again.'); }
    finally { setIsSaving(false); }
  };

  return <section className="company-entry-form"><div><p className="eyebrow">NEW POCKET ENTRY</p><h2>Record a movement.</h2><p>Cash in, receipts, and Udhaar received add money. Expenses and Udhaar given reduce it.</p></div><form onSubmit={submit}><label className="field"><span>Entry type</span><select value={type} onChange={(event) => setType(event.target.value as PocketTransactionType)}>{Object.entries(transactionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><div className="form-grid compact-form-grid"><label className="field"><span>Amount (PKR)</span><input type="number" min="1" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></label><label className="field"><span>Date</span><input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></label></div><label className="field"><span>Note</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional detail" /></label><div className="editor-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Add entry'} <AppIcon name="plus" aria-hidden="true" size={17} /></button></div></form></section>;
}

function TransactionList({ transactions }: { transactions: PocketTransaction[] }) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const remove = async (transaction: PocketTransaction) => {
    if (!window.confirm(`Remove ${transactionLabels[transaction.type].toLowerCase()} from ${formatDate(transaction.occurredOn)}?`)) return;
    setRemovingId(transaction.id);
    try { await deletePocketTransaction(transaction.id); }
    finally { setRemovingId(null); }
  };

  return <section className="company-transaction-list"><div className="panel-heading"><div><p className="eyebrow">POCKET LEDGER</p><h2>Recent activity</h2></div><span className="progress-label">{transactions.length} total</span></div>{transactions.length ? <ul>{transactions.map((transaction) => { const isDebit = isPocketDebit(transaction.type); return <li key={transaction.id}><span className={`transaction-type pocket-${transaction.type}`}>{transactionLabels[transaction.type]}</span><div><strong>{transaction.note || 'No note added'}</strong><small>{formatDate(transaction.occurredOn)}</small></div><b className={isDebit ? 'transaction-debit' : 'transaction-credit'}>{isDebit ? '−' : '+'}{formatCurrency(transaction.amount)}</b><button className="remove-button" type="button" disabled={removingId === transaction.id} onClick={() => remove(transaction)} aria-label={`Remove ${transactionLabels[transaction.type]} entry`}>{removingId === transaction.id ? '…' : 'Remove'}</button></li>; })}</ul> : <div className="ledger-empty"><AppIcon name="wallet" aria-hidden="true" size={24} /><p>No pocket entries yet.</p><span>Record a cash movement to see it in your personal ledger.</span></div>}</section>;
}

function SavingsGoalForm() {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Number(targetAmount); const saved = savedAmount === '' ? 0 : Number(savedAmount);
    if (!name.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0) { setStatus('Add a name, a target above zero, and a valid saved amount.'); return; }
    setIsSaving(true); setStatus('');
    try {
      await addSavingsGoal({ name: name.trim(), targetAmount: target, savedAmount: saved, targetDate: targetDate || null, note: note.trim() });
      setName(''); setTargetAmount(''); setSavedAmount(''); setTargetDate(''); setNote(''); setStatus('Savings goal created locally.');
    } catch { setStatus('Could not create this savings goal. Please try again.'); }
    finally { setIsSaving(false); }
  };
  return <form className="savings-goal-form" onSubmit={submit}><p className="eyebrow">NEW TARGET</p><label className="field"><span>Goal name</span><input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Emergency fund" required /></label><div className="form-grid compact-form-grid"><label className="field"><span>Target (PKR)</span><input type="number" min="1" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="0" required /></label><label className="field"><span>Saved now (PKR)</span><input type="number" min="0" value={savedAmount} onChange={(event) => setSavedAmount(event.target.value)} placeholder="0" /></label></div><label className="field"><span>Target date</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label><label className="field"><span>Note</span><input maxLength={100} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional reminder" /></label><div className="editor-actions"><span role="status">{status}</span><button className="secondary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Create goal'}</button></div></form>;
}

function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const [savedAmount, setSavedAmount] = useState(String(goal.savedAmount));
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const percentage = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
  const saveProgress = async () => {
    const nextSavedAmount = Number(savedAmount);
    if (!Number.isFinite(nextSavedAmount) || nextSavedAmount < 0) { setStatus('Enter a valid saved amount.'); return; }
    setIsSaving(true); setStatus('');
    try { await updateSavingsGoal({ ...goal, savedAmount: nextSavedAmount }); setStatus('Progress saved.'); }
    catch { setStatus('Could not save progress.'); }
    finally { setIsSaving(false); }
  };
  const remove = async () => { if (window.confirm(`Remove the ${goal.name} savings goal?`)) await deleteSavingsGoal(goal.id); };
  return <article className="savings-goal-card"><div className="goal-card-heading"><div><strong>{goal.name}</strong><small>{goal.targetDate ? `Target: ${formatDate(goal.targetDate)}` : 'No target date'}</small></div><button className="remove-button" type="button" onClick={remove}>Remove</button></div><div className="goal-progress-copy"><span>{formatCurrency(goal.savedAmount)} saved</span><b>{Math.round(percentage)}%</b></div><progress value={Math.min(goal.savedAmount, goal.targetAmount)} max={goal.targetAmount}>{percentage}%</progress><p>{formatCurrency(Math.max(0, goal.targetAmount - goal.savedAmount))} remaining of {formatCurrency(goal.targetAmount)}</p>{goal.note ? <small className="goal-note">{goal.note}</small> : null}<div className="goal-update"><label className="field"><span>Saved amount (PKR)</span><input type="number" min="0" value={savedAmount} onChange={(event) => setSavedAmount(event.target.value)} /></label><button className="secondary-button" type="button" disabled={isSaving} onClick={saveProgress}>{isSaving ? 'Saving…' : 'Update'}</button></div><span className="field-status" role="status">{status}</span></article>;
}

function SummaryCard({ label, amount, tone }: { label: string; amount: number; tone: 'credit' | 'debit' | 'neutral' }) { return <article><span>{label}</span><strong className={tone === 'credit' ? 'transaction-credit' : tone === 'debit' ? 'transaction-debit' : ''}>{formatCurrency(amount)}</strong><small>{tone === 'credit' ? 'recorded incoming' : tone === 'debit' ? 'recorded outgoing' : 'set aside'}</small></article>; }

function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="wallet" aria-hidden="true" size={28} /></span><p className="eyebrow">PERSONAL POCKET</p><h1>Set up your workspace first.</h1><p>Your private pocket is ready after you complete the local salary setup.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }
