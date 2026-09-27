'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { useCompanyTransactions } from '@/hooks/use-company-transactions';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { addCompanyTransaction, deleteCompanyTransaction } from '@/lib/database/repository';
import { getCompanyBalance, isCompanyDebit } from '@/lib/calculations/company-balance';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatDate, getLocalDateValue } from '@/lib/formatting/date';
import type { CompanyTransaction, CompanyTransactionType } from '@/types/domain';

const transactionLabels: Record<CompanyTransactionType, string> = {
  credit: 'Company credit',
  withdrawal: 'Withdrawal',
  voucher: 'Voucher',
  advance: 'Advance',
  loan: 'Loan',
  deduction: 'Deduction',
};

export function CompanyContent() {
  const { isLoading, isOnboarded } = useCurrentAppRecords();
  const { transactions, isLoading: transactionsLoading } = useCompanyTransactions();

  if (isLoading || transactionsLoading) return <section className="dashboard-loading" aria-live="polite">Loading your local company ledger…</section>;
  if (!isOnboarded) return <SetupRequired />;

  const balance = getCompanyBalance(transactions);
  const credits = transactions.filter((transaction) => !isCompanyDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);
  const debits = transactions.filter((transaction) => isCompanyDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);

  return <section className="company-page"><header className="page-heading"><div><p className="eyebrow">COMPANY LEDGER</p><h1>Know what&apos;s outstanding.</h1><p className="page-subtitle">Log every company credit and deduction on this device. Your balance is always calculated from the full record.</p></div></header><section className="company-balance-card"><div><p className="eyebrow">CURRENT COMPANY BALANCE</p><strong className={balance < 0 ? 'balance-negative' : ''}>{formatCurrency(balance)}</strong><p>{balance >= 0 ? 'Available company credit' : 'Company deductions exceed credits'}</p></div><span className="local-pill"><span className="pulse-dot" />Local ledger</span></section><div className="company-summary"><SummaryCard label="Credits" amount={credits} tone="credit" /><SummaryCard label="Deductions" amount={debits} tone="debit" /><SummaryCard label="Entries" amount={transactions.length} tone="neutral" /></div><div className="company-layout"><TransactionForm /><TransactionList transactions={transactions} /></div></section>;
}

function TransactionForm() {
  const [type, setType] = useState<CompanyTransactionType>('credit');
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
      await addCompanyTransaction({ type, amount: parsedAmount, occurredOn, note: note.trim() });
      setAmount(''); setNote(''); setStatus('Entry saved locally.');
    } catch {
      setStatus('Could not save this entry locally. Please try again.');
    } finally { setIsSaving(false); }
  };

  return <section className="company-entry-form"><div><p className="eyebrow">NEW ENTRY</p><h2>Record a company movement.</h2><p>Credits increase your company balance; all other entry types reduce it.</p></div><form onSubmit={submit}><label className="field"><span>Entry type</span><select value={type} onChange={(event) => setType(event.target.value as CompanyTransactionType)}>{Object.entries(transactionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><div className="form-grid compact-form-grid"><label className="field"><span>Amount (PKR)</span><input type="number" min="1" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></label><label className="field"><span>Date</span><input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></label></div><label className="field"><span>Note</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional reference or explanation" /></label><div className="editor-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Add entry'} <AppIcon name="plus" aria-hidden="true" size={17} /></button></div></form></section>;
}

function TransactionList({ transactions }: { transactions: CompanyTransaction[] }) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const remove = async (transaction: CompanyTransaction) => {
    if (!window.confirm(`Remove the ${transactionLabels[transaction.type].toLowerCase()} from ${formatDate(transaction.occurredOn)}?`)) return;
    setRemovingId(transaction.id);
    try { await deleteCompanyTransaction(transaction.id); }
    finally { setRemovingId(null); }
  };

  return <section className="company-transaction-list"><div className="panel-heading"><div><p className="eyebrow">LEDGER</p><h2>Recent activity</h2></div><span className="progress-label">{transactions.length} total</span></div>{transactions.length ? <ul>{transactions.map((transaction) => { const isDebit = isCompanyDebit(transaction.type); return <li key={transaction.id}><span className={`transaction-type transaction-${transaction.type}`}>{transactionLabels[transaction.type]}</span><div><strong>{transaction.note || 'No note added'}</strong><small>{formatDate(transaction.occurredOn)}</small></div><b className={isDebit ? 'transaction-debit' : 'transaction-credit'}>{isDebit ? '−' : '+'}{formatCurrency(transaction.amount)}</b><button className="remove-button" type="button" disabled={removingId === transaction.id} onClick={() => remove(transaction)} aria-label={`Remove ${transactionLabels[transaction.type]} entry`}>{removingId === transaction.id ? '…' : 'Remove'}</button></li>; })}</ul> : <div className="ledger-empty"><AppIcon name="building" aria-hidden="true" size={24} /><p>No company entries yet.</p><span>Add a credit, withdrawal, voucher, advance, loan, or deduction to begin.</span></div>}</section>;
}

function SummaryCard({ label, amount, tone }: { label: string; amount: number; tone: 'credit' | 'debit' | 'neutral' }) { return <article><span>{label}</span><strong className={tone === 'credit' ? 'transaction-credit' : tone === 'debit' ? 'transaction-debit' : ''}>{label === 'Entries' ? amount : formatCurrency(amount)}</strong><small>{tone === 'credit' ? 'added to balance' : tone === 'debit' ? 'reduced balance' : 'saved locally'}</small></article>; }

function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="building" aria-hidden="true" size={28} /></span><p className="eyebrow">COMPANY LEDGER</p><h1>Set up your workspace first.</h1><p>Your company balance uses the private salary workspace configured during onboarding.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }
