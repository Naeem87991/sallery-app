'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { useCompanyLoans } from '@/hooks/use-company-loans';
import { useCompanyTransactions } from '@/hooks/use-company-transactions';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { useAppTranslation } from '@/hooks/use-app-translation';
import { getCompanyBalance, getCompanyLoanSnapshots, getTotalLoanOutstanding, isCompanyDebit, type CompanyLoanSnapshot } from '@/lib/calculations/company-balance';
import { addCompanyLoan, addCompanyLoanRepayment, addCompanyTransaction, deleteCompanyTransaction } from '@/lib/database/repository';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatDate, getLocalDateValue } from '@/lib/formatting/date';
import type { AppLanguage, CompanyTransaction, CompanyTransactionType } from '@/types/domain';

const transactionLabels: Record<CompanyTransactionType, string> = { credit: 'Company credit', withdrawal: 'Withdrawal', voucher: 'Voucher', advance: 'Advance', loan: 'Loan issued', 'loan-repayment': 'Loan repayment', deduction: 'Deduction' };
const transactionLabelsUr: Record<CompanyTransactionType, string> = { credit: 'کمپنی کریڈٹ', withdrawal: 'نکلوائی گئی رقم', voucher: 'واؤچر', advance: 'پیشگی رقم', loan: 'قرض جاری', 'loan-repayment': 'قرض واپسی', deduction: 'کٹوتی' };
const manualTransactionTypes = ['credit', 'withdrawal', 'voucher', 'advance', 'deduction'] as const;
type ManualCompanyTransactionType = typeof manualTransactionTypes[number];

export function CompanyContent() {
  const { t } = useAppTranslation();
  const { records, isLoading, isOnboarded } = useCurrentAppRecords();
  const { transactions, isLoading: transactionsLoading } = useCompanyTransactions();
  const { loans, isLoading: loansLoading } = useCompanyLoans();
  if (isLoading || transactionsLoading || loansLoading) return <section className="dashboard-loading" aria-live="polite">{t('loadingCompany')}</section>;
  if (!isOnboarded) return <SetupRequired />;

  const language = records?.appSettings?.language;
  const balance = getCompanyBalance(transactions);
  const credits = transactions.filter((transaction) => !isCompanyDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);
  const debits = transactions.filter((transaction) => isCompanyDebit(transaction.type)).reduce((total, transaction) => total + transaction.amount, 0);
  const loanSnapshots = getCompanyLoanSnapshots(loans, transactions);
  const outstandingLoans = getTotalLoanOutstanding(loans, transactions);
  return (
    <section className="company-page">
      <header className="page-heading"><div><p className="eyebrow">{t('companyLedger')}</p><h1>{t('companyTitle')}</h1><p className="page-subtitle">{t('companySubtitle')}</p></div></header>
      <section className="company-balance-card"><div><p className="eyebrow">{t('currentCompanyBalance')}</p><strong className={balance < 0 ? 'balance-negative' : ''}>{formatCurrency(balance)}</strong><p>{balance >= 0 ? t('availableCompanyCredit') : t('companyDeductions')}</p></div><span className="local-pill"><span className="pulse-dot" />{t('localLedger')}</span></section>
      <div className="company-summary cards-grid"><SummaryCard label={t('credits')} amount={credits} tone="credit" language={language} /><SummaryCard label={t('deductions')} amount={debits} tone="debit" language={language} /><SummaryCard label={t('loansDue')} amount={outstandingLoans} tone="debit" language={language} /><SummaryCard label={t('entries')} amount={transactions.length} tone="neutral" language={language} /></div>
      <LoanPanel loans={loanSnapshots} language={language} />
      <div className="company-layout"><TransactionForm language={language} /><TransactionList transactions={transactions} language={language} /></div>
    </section>
  );
}

function LoanPanel({ loans, language }: { loans: CompanyLoanSnapshot[]; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [name, setName] = useState(''); const [principalAmount, setPrincipalAmount] = useState(''); const [issuedOn, setIssuedOn] = useState(getLocalDateValue); const [note, setNote] = useState(''); const [status, setStatus] = useState(''); const [isSaving, setIsSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const amount = Number(principalAmount); if (!Number.isFinite(amount) || amount <= 0) { setStatus(isUrdu ? 'صفر سے زیادہ اصل رقم درج کریں۔' : 'Enter a principal amount greater than zero.'); return; } setIsSaving(true); setStatus(''); try { await addCompanyLoan({ name: name.trim(), principalAmount: amount, issuedOn, note: note.trim() }); setName(''); setPrincipalAmount(''); setNote(''); setStatus(isUrdu ? 'قرض جاری ہو گیا اور کمپنی لیجر میں محفوظ ہو گیا۔' : 'Loan issued and saved in the company ledger.'); } catch (error) { setStatus(error instanceof Error ? error.message : (isUrdu ? 'قرض محفوظ نہیں ہو سکا۔' : 'Could not save the loan.')); } finally { setIsSaving(false); } };
  return (
    <section className="loan-section">
      <div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'قرض ٹریکر' : 'LOAN TRACKER'}</p><h2>{isUrdu ? 'کمپنی کے قرضے جاری اور مکمل کریں۔' : 'Issue and settle company loans.'}</h2></div><span className="progress-label">{loans.filter((loan) => !loan.isSettled).length} {isUrdu ? 'جاری' : 'open'}</span></div>
      <div className="loan-layout">
        <form className="loan-form" onSubmit={submit}>
          <p>{isUrdu ? 'قرض جاری کرنے سے لیجر میں کٹوتی شامل ہوتی ہے۔ واپسی کبھی بقایا اصل رقم سے زیادہ نہیں ہو سکتی۔' : 'Issuing a loan creates a linked debit in the company ledger. Repayments can never exceed the remaining principal.'}</p>
          <label className="field"><span>{isUrdu ? 'قرض کا نام' : 'Loan name'}</span><input maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder={isUrdu ? 'مثلاً لیپ ٹاپ ایڈوانس' : 'e.g. Laptop advance'} required /></label>
          <div className="form-grid compact-form-grid"><label className="field"><span>{isUrdu ? 'اصل رقم (PKR)' : 'Principal (PKR)'}</span><input type="number" min="1" inputMode="decimal" value={principalAmount} onChange={(event) => setPrincipalAmount(event.target.value)} placeholder="0" required /></label><label className="field"><span>{isUrdu ? 'جاری کرنے کی تاریخ' : 'Issue date'}</span><input type="date" value={issuedOn} onChange={(event) => setIssuedOn(event.target.value)} required /></label></div>
          <label className="field"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اختیاری وضاحت' : 'Optional explanation'} /></label>
          <div className="editor-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'قرض جاری کریں' : 'Issue loan')} <AppIcon name="plus" aria-hidden="true" size={17} /></button></div>
        </form>
        <div className="loan-list">{loans.length ? loans.map((loan) => <LoanCard key={loan.id} loan={loan} language={language} />) : <div className="ledger-empty"><AppIcon name="building" aria-hidden="true" size={24} /><p>{isUrdu ? 'ابھی کوئی ٹریک شدہ قرض نہیں ہے۔' : 'No tracked loans yet.'}</p><span>{isUrdu ? 'بقایا رقم اور واپسیوں کو ٹریک کرنے کے لیے کمپنی قرض جاری کریں۔' : 'Issue a company loan to track its outstanding amount and repayments.'}</span></div>}</div>
      </div>
    </section>
  );
}

function LoanCard({ loan, language }: { loan: CompanyLoanSnapshot; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [amount, setAmount] = useState(''); const [occurredOn, setOccurredOn] = useState(getLocalDateValue); const [note, setNote] = useState(''); const [status, setStatus] = useState(''); const [isSaving, setIsSaving] = useState(false); const progress = Math.round((loan.repaidAmount / loan.principalAmount) * 100);
  const repay = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const parsedAmount = Number(amount); if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setStatus(isUrdu ? 'صفر سے زیادہ واپسی کی رقم درج کریں۔' : 'Enter a repayment amount greater than zero.'); return; } setIsSaving(true); setStatus(''); try { await addCompanyLoanRepayment({ loanId: loan.id, amount: parsedAmount, occurredOn, note: note.trim() }); setAmount(''); setNote(''); setStatus(isUrdu ? 'واپسی محفوظ ہو گئی۔' : 'Repayment saved.'); } catch (error) { setStatus(error instanceof Error ? error.message : (isUrdu ? 'واپسی محفوظ نہیں ہو سکی۔' : 'Could not save the repayment.')); } finally { setIsSaving(false); } };
  return (
    <article className="loan-card">
      <div className="loan-card-heading"><div><strong data-user-content>{loan.name}</strong><small>{isUrdu ? `${formatDate(loan.issuedOn)} کو جاری ہوا` : `Issued ${formatDate(loan.issuedOn)}`}</small></div><span className={loan.isSettled ? 'loan-settled' : 'loan-open'}>{loan.isSettled ? (isUrdu ? 'مکمل' : 'Settled') : (isUrdu ? 'جاری' : 'Open')}</span></div>
      <div className="loan-amounts"><span>{isUrdu ? 'بقایا' : 'Outstanding'} <b>{formatCurrency(loan.outstandingAmount)}</b></span><span>{isUrdu ? 'ادا شدہ' : 'Repaid'} <b>{formatCurrency(loan.repaidAmount)}</b></span></div>
      <progress value={loan.repaidAmount} max={loan.principalAmount}>{progress}%</progress>
      <small className="loan-progress">{isUrdu ? `${formatCurrency(loan.principalAmount)} میں سے ${progress}% ادا شدہ` : `${progress}% repaid of ${formatCurrency(loan.principalAmount)}`}</small>
      {loan.note ? <p data-user-content>{loan.note}</p> : null}
      {!loan.isSettled ? <form className="loan-repayment-form" onSubmit={repay}><div className="form-grid compact-form-grid"><label className="field"><span>{isUrdu ? 'واپسی (PKR)' : 'Repayment (PKR)'}</span><input type="number" min="1" max={loan.outstandingAmount} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label className="field"><span>{isUrdu ? 'تاریخ' : 'Date'}</span><input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></label></div><label className="field"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اختیاری واپسی نوٹ' : 'Optional repayment note'} /></label><div className="editor-actions"><span role="status">{status}</span><button className="secondary-button" type="submit" disabled={isSaving}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'واپسی درج کریں' : 'Record repayment')}</button></div></form> : null}
    </article>
  );
}

function TransactionForm({ language }: { language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [type, setType] = useState<ManualCompanyTransactionType>('credit'); const [amount, setAmount] = useState(''); const [occurredOn, setOccurredOn] = useState(getLocalDateValue); const [note, setNote] = useState(''); const [status, setStatus] = useState(''); const [isSaving, setIsSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const parsedAmount = Number(amount); if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setStatus(isUrdu ? 'صفر سے زیادہ رقم درج کریں۔' : 'Enter an amount greater than zero.'); return; } setIsSaving(true); setStatus(''); try { await addCompanyTransaction({ type, amount: parsedAmount, occurredOn, note: note.trim() }); setAmount(''); setNote(''); setStatus(isUrdu ? 'اندراج مقامی طور پر محفوظ ہو گیا۔' : 'Entry saved locally.'); } catch { setStatus(isUrdu ? 'یہ اندراج محفوظ نہیں ہو سکا۔ دوبارہ کوشش کریں۔' : 'Could not save this entry locally. Please try again.'); } finally { setIsSaving(false); } };
  return (
    <section className="company-entry-form">
      <div><p className="eyebrow">{isUrdu ? 'نیا اندراج' : 'NEW ENTRY'}</p><h2>{isUrdu ? 'نئی رقم درج کریں۔' : 'Record another movement.'}</h2><p>{isUrdu ? 'قرضوں اور واپسیوں کے لیے اوپر دیا گیا قرض ٹریکر استعمال کریں۔ کریڈٹ بیلنس بڑھاتے ہیں؛ باقی اندراجات اسے کم کرتے ہیں۔' : 'Use the loan tracker above for loans and repayments. Credits increase balance; these other entries reduce it.'}</p></div>
      <form onSubmit={submit}>
        <label className="field"><span>{isUrdu ? 'اندراج کی قسم' : 'Entry type'}</span><select value={type} onChange={(event) => setType(event.target.value as ManualCompanyTransactionType)}>{manualTransactionTypes.map((value) => <option value={value} key={value}>{isUrdu ? transactionLabelsUr[value] : transactionLabels[value]}</option>)}</select></label>
        <div className="form-grid compact-form-grid"><label className="field"><span>{isUrdu ? 'رقم (PKR)' : 'Amount (PKR)'}</span><input type="number" min="1" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /></label><label className="field"><span>{isUrdu ? 'تاریخ' : 'Date'}</span><input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></label></div>
        <label className="field"><span>{isUrdu ? 'نوٹ' : 'Note'}</span><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={isUrdu ? 'اختیاری حوالہ یا وضاحت' : 'Optional reference or explanation'} /></label>
        <div className="editor-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? (isUrdu ? 'محفوظ ہو رہا ہے…' : 'Saving…') : (isUrdu ? 'اندراج شامل کریں' : 'Add entry')} <AppIcon name="plus" aria-hidden="true" size={17} /></button></div>
      </form>
    </section>
  );
}

function TransactionList({ transactions, language }: { transactions: CompanyTransaction[]; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const [removingId, setRemovingId] = useState<string | null>(null);
  const remove = async (transaction: CompanyTransaction) => {
    const typeLabel = isUrdu ? transactionLabelsUr[transaction.type] : transactionLabels[transaction.type];
    const warning = transaction.type === 'loan' && transaction.loanId ? (isUrdu ? ' اس سے اس کی واپسی کی تمام ہسٹری بھی ہٹ جائے گی۔' : ' This also removes its repayment history.') : '';
    const confirmMsg = isUrdu ? `کیا آپ ${formatDate(transaction.occurredOn)} کا ${typeLabel} ہٹانا چاہتے ہیں؟${warning}` : `Remove the ${transactionLabels[transaction.type].toLowerCase()} from ${formatDate(transaction.occurredOn)}?${warning}`;
    if (!window.confirm(confirmMsg)) return;
    setRemovingId(transaction.id);
    try { await deleteCompanyTransaction(transaction.id); } finally { setRemovingId(null); }
  };
  return (
    <section className="company-transaction-list">
      <div className="panel-heading"><div><p className="eyebrow">{isUrdu ? 'لیجر' : 'LEDGER'}</p><h2>{isUrdu ? 'حالیہ سرگرمی' : 'Recent activity'}</h2></div><span className="progress-label">{transactions.length} {isUrdu ? 'کل' : 'total'}</span></div>
      {transactions.length ? (
        <ul>
          {transactions.map((transaction) => {
            const isDebit = isCompanyDebit(transaction.type);
            return (
              <li key={transaction.id}>
                <span className={`transaction-type transaction-${transaction.type}`}>{isUrdu ? transactionLabelsUr[transaction.type] : transactionLabels[transaction.type]}</span>
                <div><strong data-user-content>{transaction.note || (isUrdu ? 'کوئی نوٹ نہیں' : 'No note added')}</strong><small>{formatDate(transaction.occurredOn)}</small></div>
                <b className={isDebit ? 'transaction-debit' : 'transaction-credit'}>{isDebit ? '−' : '+'}{formatCurrency(transaction.amount)}</b>
                <button className="remove-button" type="button" disabled={removingId === transaction.id} onClick={() => remove(transaction)} aria-label={isUrdu ? `${transactionLabelsUr[transaction.type]} ہٹائیں` : `Remove ${transactionLabels[transaction.type]} entry`}>{removingId === transaction.id ? '…' : (isUrdu ? 'ہٹائیں' : 'Remove')}</button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="ledger-empty"><AppIcon name="building" aria-hidden="true" size={24} /><p>{isUrdu ? 'ابھی کمپنی کا کوئی اندراج نہیں ہے۔' : 'No company entries yet.'}</p><span>{isUrdu ? 'شروع کرنے کے لیے کریڈٹ، کٹوتی یا ٹریک شدہ قرض شامل کریں۔' : 'Add a credit, deduction, or tracked loan to begin.'}</span></div>
      )}
    </section>
  );
}

function SummaryCard({ label, amount, tone, language }: { label: string; amount: number; tone: 'credit' | 'debit' | 'neutral'; language?: AppLanguage }) {
  const isUrdu = language === 'ur';
  const subtitle = tone === 'credit' ? (isUrdu ? 'بیلنس میں شامل' : 'added to balance') : tone === 'debit' ? (isUrdu ? 'کٹوتی / بقایا' : 'reduced / outstanding') : (isUrdu ? 'مقامی طور پر محفوظ' : 'saved locally');
  return (
    <article className="card">
      <span>{label}</span>
      <strong className={tone === 'credit' ? 'transaction-credit' : tone === 'debit' ? 'transaction-debit' : ''}>{tone === 'neutral' ? amount : formatCurrency(amount)}</strong>
      <small>{subtitle}</small>
    </article>
  );
}

function SetupRequired() { return <section className="feature-placeholder"><span className="placeholder-icon"><AppIcon name="building" aria-hidden="true" size={28} /></span><p className="eyebrow">COMPANY LEDGER</p><h1>Set up your workspace first.</h1><p>Your company balance uses the private salary workspace configured during onboarding.</p><Link className="primary-button" href="/onboarding">Start setup <AppIcon name="arrow-right" aria-hidden="true" size={17} /></Link></section>; }
