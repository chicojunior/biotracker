/**
 * Postgres connection + Drizzle client. The pool is injected into repositories
 * and routes rather than imported as a global, so tests can point at
 * biotracker_test and dispose cleanly.
 */
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export type DbHandle = {
  db: Database;
  pool: Pool;
};

export function createDb(databaseUrl: string): DbHandle {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  return { db, pool };
}
