import Dexie, { type EntityTable } from 'dexie';
import type { AppSettings, AttendanceRecord, CareerRecord, CompanyTransaction, PocketTransaction, SalarySettings, SavingsGoal, SecuritySettings, UserProfile } from '@/types/domain';

export const DATABASE_NAME = 'live-salary-ticker';
export const DATABASE_SCHEMA_VERSION = 4;

export class LiveSalaryTickerDatabase extends Dexie {
  profiles!: EntityTable<UserProfile, 'id'>;
  salarySettings!: EntityTable<SalarySettings, 'id'>;
  appSettings!: EntityTable<AppSettings, 'id'>;
  attendanceRecords!: EntityTable<AttendanceRecord, 'id'>;
  companyTransactions!: EntityTable<CompanyTransaction, 'id'>;
  pocketTransactions!: EntityTable<PocketTransaction, 'id'>;
  savingsGoals!: EntityTable<SavingsGoal, 'id'>;
  careerRecords!: EntityTable<CareerRecord, 'id'>;
  securitySettings!: EntityTable<SecuritySettings, 'id'>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({
      profiles: '&id, updatedAt',
      salarySettings: '&id, updatedAt',
      appSettings: '&id, updatedAt',
    });
    this.version(2).stores({
      profiles: '&id, updatedAt',
      salarySettings: '&id, updatedAt',
      appSettings: '&id, updatedAt',
      attendanceRecords: '&id, date, status, updatedAt',
      companyTransactions: '&id, occurredOn, type, updatedAt',
    });
    this.version(3).stores({
      profiles: '&id, updatedAt',
      salarySettings: '&id, updatedAt',
      appSettings: '&id, updatedAt',
      attendanceRecords: '&id, date, status, updatedAt',
      companyTransactions: '&id, occurredOn, type, updatedAt',
      pocketTransactions: '&id, occurredOn, type, updatedAt',
      savingsGoals: '&id, targetDate, updatedAt',
      careerRecords: '&id, startDate, endDate, updatedAt',
    });
    this.version(DATABASE_SCHEMA_VERSION).stores({
      profiles: '&id, updatedAt',
      salarySettings: '&id, updatedAt',
      appSettings: '&id, updatedAt',
      attendanceRecords: '&id, date, status, updatedAt',
      companyTransactions: '&id, occurredOn, type, updatedAt',
      pocketTransactions: '&id, occurredOn, type, updatedAt',
      savingsGoals: '&id, targetDate, updatedAt',
      careerRecords: '&id, startDate, endDate, updatedAt',
      securitySettings: '&id, updatedAt',
    });
  }
}

export const db = new LiveSalaryTickerDatabase();
