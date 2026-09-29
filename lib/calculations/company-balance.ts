import type { CompanyLoan, CompanyTransaction, CompanyTransactionType } from '@/types/domain';

const debitTypes = new Set<CompanyTransactionType>(['withdrawal', 'voucher', 'advance', 'loan', 'deduction']);

export function getCompanyBalance(transactions: CompanyTransaction[]): number {
  return transactions.reduce((balance, transaction) => balance + (debitTypes.has(transaction.type) ? -transaction.amount : transaction.amount), 0);
}

export function isCompanyDebit(type: CompanyTransactionType): boolean {
  return debitTypes.has(type);
}

export type CompanyLoanSnapshot = CompanyLoan & {
  repaidAmount: number;
  outstandingAmount: number;
  isSettled: boolean;
};

export function getCompanyLoanSnapshots(loans: CompanyLoan[], transactions: CompanyTransaction[]): CompanyLoanSnapshot[] {
  const repaymentsByLoan = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (transaction.type !== 'loan-repayment' || !transaction.loanId) return;
    repaymentsByLoan.set(transaction.loanId, (repaymentsByLoan.get(transaction.loanId) ?? 0) + transaction.amount);
  });

  return loans.map((loan) => {
    const repaidAmount = Math.min(loan.principalAmount, repaymentsByLoan.get(loan.id) ?? 0);
    const outstandingAmount = Math.max(0, loan.principalAmount - repaidAmount);
    return { ...loan, repaidAmount, outstandingAmount, isSettled: outstandingAmount === 0 };
  });
}

export function getTotalLoanOutstanding(loans: CompanyLoan[], transactions: CompanyTransaction[]): number {
  return getCompanyLoanSnapshots(loans, transactions).reduce((total, loan) => total + loan.outstandingAmount, 0);
}
