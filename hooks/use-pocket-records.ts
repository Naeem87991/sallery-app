'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPocketTransactions, getSavingsGoals } from '@/lib/supabase/repository';
import type { PocketTransaction, SavingsGoal } from '@/types/domain';
import type { PocketTxRow, SavingsGoalRow } from '@/lib/supabase/database.types';

function toPocketTransaction(row: PocketTxRow): PocketTransaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    note: row.note,
    category: row.category,
    receiptDataUrl: row.receipt_data_url,
    savingsGoalId: row.savings_goal_id,
    reminderOn: row.reminder_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSavingsGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    targetDate: row.target_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePocketRecords() {
  const { userId, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<PocketTransaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    setIsLoading(true);
    const [txResult, goalsResult] = await Promise.all([
      getPocketTransactions(uid),
      getSavingsGoals(uid),
    ]);
    setTransactions(txResult.data?.map(toPocketTransaction) ?? []);
    setGoals(goalsResult.data?.map(toSavingsGoal) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      load(userId);
    } else if (!authLoading) {
      setTransactions([]);
      setGoals([]);
      setIsLoading(false);
    }
  }, [userId, authLoading, load]);

  const refetch = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { transactions, goals, isLoading: authLoading || isLoading, refetch };
}
