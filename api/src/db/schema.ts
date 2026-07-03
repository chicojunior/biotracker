/**
 * Drizzle schema — normalized relational model ported from the abandoned v2
 * Rails app (`../../biotracker-v2/rails_app/db/schema.rb`), SPEC §I.schema.
 * Column names and indexes are kept byte-for-byte aligned with v2 so the two
 * schemas stay diff-comparable. Everything Rails did implicitly (associations,
 * the exactly-one-value check) is spelled out here.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: varchar('email'),
  ...timestamps,
});

export const dailyEntries = pgTable(
  'daily_entries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    entryDate: date('entry_date').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('index_daily_entries_on_user_id_and_entry_date').on(
      table.userId,
      table.entryDate,
    ),
  ],
);

export const metricEntries = pgTable(
  'metric_entries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    dailyEntryId: bigint('daily_entry_id', { mode: 'number' })
      .notNull()
      .references(() => dailyEntries.id, { onDelete: 'cascade' }),
    metricType: varchar('metric_type').notNull(),
    source: varchar('source').notNull(),
    // Exactly one of the three value_* columns is non-null per row (V25). pg
    // returns numeric as string; the mapping layer converts to/from number.
    valueDecimal: numeric('value_decimal', { precision: 12, scale: 4 }),
    valueText: text('value_text'),
    valueBoolean: boolean('value_boolean'),
    unit: varchar('unit'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    notes: text('notes'),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    preferredSource: boolean('preferred_source').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('index_metric_entries_on_daily_entry_id_metric_type_recorded_at').on(
      table.dailyEntryId,
      table.metricType,
      table.recordedAt,
    ),
    check(
      'metric_entries_exactly_one_value',
      sql`num_nonnulls(${table.valueDecimal}, ${table.valueText}, ${table.valueBoolean}) = 1`,
    ),
  ],
);

export const userSettings = pgTable(
  'user_settings',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    preferredUnits: jsonb('preferred_units').notNull().default({}),
    preferredSourceByMetric: jsonb('preferred_source_by_metric').notNull().default({}),
    goalNotes: jsonb('goal_notes').notNull().default({}),
    theme: varchar('theme').notNull().default('system'),
    ...timestamps,
  },
  (table) => [uniqueIndex('index_user_settings_on_user_id').on(table.userId)],
);

export const dataImports = pgTable('data_imports', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  kind: varchar('kind').notNull(),
  status: varchar('status').notNull(),
  sourcePayload: jsonb('source_payload'),
  errorMessage: text('error_message'),
  importedAt: timestamp('imported_at', { withTimezone: true }),
  ...timestamps,
});

export const connectedAccounts = pgTable(
  'connected_accounts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    provider: varchar('provider').notNull(),
    // Tokens are encrypted at the application layer before insert (F4 / V20);
    // stored as text here.
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    externalUserId: varchar('external_user_id'),
    scopes: varchar('scopes'),
    status: varchar('status').notNull().default('connected'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('index_connected_accounts_on_user_id_and_provider').on(
      table.userId,
      table.provider,
    ),
  ],
);

export type DailyEntryRow = typeof dailyEntries.$inferSelect;
export type MetricEntryRow = typeof metricEntries.$inferSelect;
export type NewMetricEntryRow = typeof metricEntries.$inferInsert;
export type UserSettingsRow = typeof userSettings.$inferSelect;
