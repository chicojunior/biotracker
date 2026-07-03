/**
 * Entries repository — the only module that reads/writes daily_entries and
 * metric_entries. Returns nested DailyHealthEntry values (SPEC §I.envelope) so
 * callers never see the normalized row shape. All multi-row writes run in a
 * transaction and fail atomically (V10); a single day upsert replaces that
 * day's metrics wholesale, and import replaces all data for the user (V16).
 */
import { and, asc, eq, inArray } from 'drizzle-orm';

import type { DailyHealthEntry, HealthMetricEntry } from '../../../src/types/health';
import { compareDateKeys } from '../../../src/lib/dates/dateRanges';
import type { Database } from '../db/client';
import { dailyEntries, metricEntries, users } from '../db/schema';
import { entryMetricsToInserts, metricEntryToInsert, rowsToEntry } from '../mapping/envelope';
import { err, ok, type Result, type ResultError } from '../result';

// Thrown inside a transaction to trigger rollback while carrying a typed
// service error back to the caller (avoids leaking exceptions across the
// boundary, V19).
class MappingError extends Error {
  constructor(public readonly resultError: ResultError) {
    super(resultError.message);
    this.name = 'MappingError';
  }
}

/** Single-user app (C6): reuse the first user, creating one on first call. */
export async function ensureUserId(db: Database): Promise<number> {
  const existing = await db.select({ id: users.id }).from(users).orderBy(asc(users.id)).limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const inserted = await db.insert(users).values({}).returning({ id: users.id });
  return inserted[0].id;
}

async function loadEntryByDate(
  db: Database,
  userId: number,
  date: string,
): Promise<DailyHealthEntry | null> {
  const dailyRows = await db
    .select()
    .from(dailyEntries)
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.entryDate, date)))
    .limit(1);

  if (dailyRows.length === 0) {
    return null;
  }

  const daily = dailyRows[0];
  const metricRows = await db
    .select()
    .from(metricEntries)
    .where(eq(metricEntries.dailyEntryId, daily.id));

  return rowsToEntry(daily, metricRows);
}

async function loadEntryById(
  db: Database,
  userId: number,
  dailyEntryId: number,
): Promise<DailyHealthEntry | null> {
  const dailyRows = await db
    .select()
    .from(dailyEntries)
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.id, dailyEntryId)))
    .limit(1);

  if (dailyRows.length === 0) {
    return null;
  }

  const daily = dailyRows[0];
  const metricRows = await db
    .select()
    .from(metricEntries)
    .where(eq(metricEntries.dailyEntryId, daily.id));

  return rowsToEntry(daily, metricRows);
}

function parseMetricId(rawId: string): Result<number> {
  const parsed = Number(rawId);

  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== rawId.trim()) {
    return err('invalid_payload', `Metric id must be a positive integer, got: ${rawId}`);
  }

  return ok(parsed);
}

async function findMetricOwner(
  db: Database,
  userId: number,
  metricId: number,
): Promise<{ dailyEntryId: number } | null> {
  const rows = await db
    .select({ dailyEntryId: metricEntries.dailyEntryId })
    .from(metricEntries)
    .innerJoin(dailyEntries, eq(metricEntries.dailyEntryId, dailyEntries.id))
    .where(and(eq(metricEntries.id, metricId), eq(dailyEntries.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function listEntries(db: Database, userId: number): Promise<DailyHealthEntry[]> {
  const dailyRows = await db
    .select()
    .from(dailyEntries)
    .where(eq(dailyEntries.userId, userId));

  if (dailyRows.length === 0) {
    return [];
  }

  const metricRows = await db
    .select()
    .from(metricEntries)
    .where(
      inArray(
        metricEntries.dailyEntryId,
        dailyRows.map((row) => row.id),
      ),
    );

  const metricsByDaily = new Map<number, typeof metricRows>();
  for (const row of metricRows) {
    const bucket = metricsByDaily.get(row.dailyEntryId);
    if (bucket) {
      bucket.push(row);
    } else {
      metricsByDaily.set(row.dailyEntryId, [row]);
    }
  }

  return dailyRows
    .map((daily) => rowsToEntry(daily, metricsByDaily.get(daily.id) ?? []))
    .sort((left, right) => compareDateKeys(left.date, right.date));
}

export async function getEntryByDate(
  db: Database,
  userId: number,
  date: string,
): Promise<DailyHealthEntry | null> {
  return loadEntryByDate(db, userId, date);
}

/**
 * Insert or replace a single day. The day's existing metric rows are deleted
 * and re-inserted from the payload (the nested value is the source of truth
 * for that date), all inside one transaction.
 */
export async function upsertEntry(
  db: Database,
  userId: number,
  entry: DailyHealthEntry,
): Promise<Result<DailyHealthEntry>> {
  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: dailyEntries.id })
        .from(dailyEntries)
        .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.entryDate, entry.date)))
        .limit(1);

      let dailyEntryId: number;

      if (existing.length > 0) {
        dailyEntryId = existing[0].id;
        await tx
          .update(dailyEntries)
          .set({ notes: entry.notes ?? null, updatedAt: new Date() })
          .where(eq(dailyEntries.id, dailyEntryId));
        await tx.delete(metricEntries).where(eq(metricEntries.dailyEntryId, dailyEntryId));
      } else {
        const inserted = await tx
          .insert(dailyEntries)
          .values({ userId, entryDate: entry.date, notes: entry.notes ?? null })
          .returning({ id: dailyEntries.id });
        dailyEntryId = inserted[0].id;
      }

      const inserts = entryMetricsToInserts(entry, dailyEntryId);
      if (!inserts.ok) {
        throw new MappingError(inserts.error);
      }

      if (inserts.data.length > 0) {
        await tx.insert(metricEntries).values(inserts.data);
      }
    });
  } catch (error) {
    if (error instanceof MappingError) {
      return { ok: false, error: error.resultError };
    }
    return err('write_failed', `Failed to save entry for ${entry.date}: ${String(error)}`);
  }

  const saved = await loadEntryByDate(db, userId, entry.date);
  return saved ? ok(saved) : err('write_failed', `Entry for ${entry.date} vanished after save`);
}

export async function deleteEntryByDate(
  db: Database,
  userId: number,
  date: string,
): Promise<Result<{ date: string }>> {
  const deleted = await db
    .delete(dailyEntries)
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.entryDate, date)))
    .returning({ id: dailyEntries.id });

  if (deleted.length === 0) {
    return err('not_found', `No entry found for ${date}`);
  }

  return ok({ date });
}

export async function updateMetricById(
  db: Database,
  userId: number,
  rawMetricId: string,
  metricEntry: HealthMetricEntry,
): Promise<Result<DailyHealthEntry>> {
  const metricId = parseMetricId(rawMetricId);

  if (!metricId.ok) {
    return metricId;
  }

  const owner = await findMetricOwner(db, userId, metricId.data);

  if (!owner) {
    return err('not_found', `No metric found for id ${rawMetricId}`);
  }

  const updateColumns = metricEntryToInsert(metricEntry, owner.dailyEntryId);

  if (!updateColumns.ok) {
    return updateColumns;
  }

  try {
    await db
      .update(metricEntries)
      .set({
        metricType: updateColumns.data.metricType,
        source: updateColumns.data.source,
        valueDecimal: updateColumns.data.valueDecimal,
        valueText: updateColumns.data.valueText,
        valueBoolean: updateColumns.data.valueBoolean,
        unit: updateColumns.data.unit,
        recordedAt: updateColumns.data.recordedAt,
        notes: updateColumns.data.notes,
        confidence: updateColumns.data.confidence,
        preferredSource: updateColumns.data.preferredSource,
        updatedAt: new Date(),
      })
      .where(eq(metricEntries.id, metricId.data));
  } catch (error) {
    return err('write_failed', `Failed to update metric ${rawMetricId}: ${String(error)}`);
  }

  const entry = await loadEntryById(db, userId, owner.dailyEntryId);
  return entry ? ok(entry) : err('write_failed', `Entry for metric ${rawMetricId} vanished after update`);
}

export async function deleteMetricById(
  db: Database,
  userId: number,
  rawMetricId: string,
): Promise<Result<DailyHealthEntry>> {
  const metricId = parseMetricId(rawMetricId);

  if (!metricId.ok) {
    return metricId;
  }

  const owner = await findMetricOwner(db, userId, metricId.data);

  if (!owner) {
    return err('not_found', `No metric found for id ${rawMetricId}`);
  }

  try {
    await db.delete(metricEntries).where(eq(metricEntries.id, metricId.data));
  } catch (error) {
    return err('write_failed', `Failed to delete metric ${rawMetricId}: ${String(error)}`);
  }

  const entry = await loadEntryById(db, userId, owner.dailyEntryId);
  return entry ? ok(entry) : err('write_failed', `Entry for metric ${rawMetricId} vanished after delete`);
}

/**
 * Replace-all import (V16): wipe the user's entries and re-insert from the
 * envelope, atomically (V10). Either the whole set lands or nothing changes.
 */
export async function replaceAllEntries(
  db: Database,
  userId: number,
  entries: DailyHealthEntry[],
): Promise<Result<DailyHealthEntry[]>> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(dailyEntries).where(eq(dailyEntries.userId, userId));

      for (const entry of entries) {
        const inserted = await tx
          .insert(dailyEntries)
          .values({ userId, entryDate: entry.date, notes: entry.notes ?? null })
          .returning({ id: dailyEntries.id });

        const inserts = entryMetricsToInserts(entry, inserted[0].id);
        if (!inserts.ok) {
          throw new MappingError(inserts.error);
        }

        if (inserts.data.length > 0) {
          await tx.insert(metricEntries).values(inserts.data);
        }
      }
    });
  } catch (error) {
    if (error instanceof MappingError) {
      return { ok: false, error: error.resultError };
    }
    return err('write_failed', `Failed to import entries: ${String(error)}`);
  }

  return ok(await listEntries(db, userId));
}
