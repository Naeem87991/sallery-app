import Dexie, { type EntityTable } from 'dexie';
import type { AppSettings, SalarySettings, UserProfile } from '@/types/domain';

export const DATABASE_NAME = 'live-salary-ticker';
export const DATABASE_SCHEMA_VERSION = 1;

export class LiveSalaryTickerDatabase extends Dexie {
  profiles!: EntityTable<UserProfile, 'id'>;
  salarySettings!: EntityTable<SalarySettings, 'id'>;
  appSettings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super(DATABASE_NAME);
    this.version(DATABASE_SCHEMA_VERSION).stores({
      profiles: '&id, updatedAt',
      salarySettings: '&id, updatedAt',
      appSettings: '&id, updatedAt',
    });
  }
}

export const db = new LiveSalaryTickerDatabase();
