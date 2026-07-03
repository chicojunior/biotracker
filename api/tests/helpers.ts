import { sql } from 'drizzle-orm';

import { buildApp } from '../src/app';
import { createDb, type DbHandle } from '../src/db/client';
import type { DailyHealthEntry, HealthMetricEntry } from '../../src/types/health';

export function testDb(): DbHandle {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for tests (use --env-file=api/.env.test).');
  }
  return createDb(databaseUrl);
}

export async function resetDb(handle: DbHandle): Promise<void> {
  await handle.db.execute(
    sql`TRUNCATE metric_entries, daily_entries, user_settings, data_imports, connected_accounts, users RESTART IDENTITY CASCADE`,
  );
}

export function buildTestApp(handle: DbHandle) {
  return buildApp({ db: handle.db, weekStartsOn: 1 });
}

const ISO = '2024-02-29T07:30:00.000Z';

export function metricEntry(overrides: Partial<HealthMetricEntry> = {}): HealthMetricEntry {
  return {
    id: 'metric-1',
    metricType: 'weight',
    value: 82.4,
    unit: 'kg',
    recordedAt: ISO,
    source: 'manual',
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  };
}

export function dailyEntry(overrides: Partial<DailyHealthEntry> = {}): DailyHealthEntry {
  return {
    id: 'daily-2024-02-29',
    date: '2024-02-29',
    metrics: { weight: [metricEntry()] },
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  };
}
