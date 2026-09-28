import type { PocketTransaction, PocketTransactionType } from '@/types/domain';

const debitTypes: PocketTransactionType[] = ['expense', 'udhaar-given'];

export function isPocketDebit(type: PocketTransactionType): boolean {
  return debitTypes.includes(type);
}

export function getPocketBalance(transactions: PocketTransaction[]): number {
  return transactions.reduce((balance, transaction) => balance + (isPocketDebit(transaction.type) ? -transaction.amount : transaction.amount), 0);
}
