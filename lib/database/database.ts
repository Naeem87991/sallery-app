import Dexie, { type EntityTable } from 'dexie';
import type { AppSettings, AttendanceRecord, CompanyTransaction, SalarySettings, UserProfile } from '@/types/domain';

export const DATABASE_NAME = 'live-salary-ticker';
export const DATABASE_SCHEMA_VERSION = 2;

export class LiveSalaryTickerDatabase extends Dexie {
  profiles!: EntityTable<UserProfile, 'id'>;
  salarySettings!: EntityTable<SalarySettings, 'id'>;
  appSettings!: EntityTable<AppSettings, 'id'>;
  attendanceRecords!: EntityTable<AttendanceRecord, 'id'>;
  companyTransactions!: EntityTable<CompanyTransaction, 'id'>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({
      profiles: '&id, updatedAt',
      salarySettings: '&id, updatedAt',
      appSettings: '&id, updatedAt',
    });
    this.version(DATABASE_SCHEMA_VERSION).stores({
      profiles: '&id, updatedAt',
      salarySettings: '&id, updatedAt',
      appSettings: '&id, updatedAt',
      attendanceRecords: '&id, date, status, updatedAt',
      companyTransactions: '&id, occurredOn, type, updatedAt',
    });
  }
}

export const db = new LiveSalaryTickerDatabase();
