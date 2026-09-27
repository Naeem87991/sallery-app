import type { CompanyTransaction, CompanyTransactionType } from '@/types/domain';

const debitTypes = new Set<CompanyTransactionType>(['withdrawal', 'voucher', 'advance', 'loan', 'deduction']);

export function getCompanyBalance(transactions: CompanyTransaction[]): number {
  return transactions.reduce((balance, transaction) => balance + (debitTypes.has(transaction.type) ? -transaction.amount : transaction.amount), 0);
}

export function isCompanyDebit(type: CompanyTransactionType): boolean {
  return debitTypes.has(type);
}
