/**
 * Fastify application factory. `buildApp` returns a fully-wired instance
 * without calling listen, so tests drive it via `app.inject(...)` against
 * biotracker_test. The user id is resolved once per app instance and cached in
 * a closure (single-user, C6), keeping per-request work off the hot path
 * without a process-global that would leak across tests.
 */
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';

import type { Database } from './db/client';
import { ensureUserId } from './repositories/entriesRepository';
import { registerBackupRoutes } from './routes/backups';
import { registerEntryRoutes } from './routes/entries';
import { registerMetricRoutes } from './routes/metrics';
import { registerReportRoutes } from './routes/reports';

export type AppContext = {
  db: Database;
  weekStartsOn: number;
  resolveUserId: () => Promise<number>;
};

export type BuildAppOptions = {
  db: Database;
  weekStartsOn: number;
  logger?: boolean;
};

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });

  let cachedUserId: number | null = null;
  const resolveUserId = async (): Promise<number> => {
    if (cachedUserId === null) {
      cachedUserId = await ensureUserId(options.db);
    }
    return cachedUserId;
  };

  const ctx: AppContext = {
    db: options.db,
    weekStartsOn: options.weekStartsOn,
    resolveUserId,
  };

  // Malformed request bodies (invalid JSON) surface as the Result envelope
  // rather than Fastify's default error shape (SPEC §I.error.codes).
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const code = typeof error.code === 'string' ? error.code : '';

    if (error.statusCode === 400 && code.startsWith('FST_ERR_CTP')) {
      return reply.code(422).send({
        ok: false,
        error: { code: 'malformed_json', message: 'Request body is not valid JSON.' },
      });
    }

    reply.code(error.statusCode ?? 500).send({
      ok: false,
      error: { code: 'write_failed', message: error.message },
    });
  });

  app.get('/health', async () => ({ ok: true, data: { status: 'ok' } }));

  await registerEntryRoutes(app, ctx);
  await registerMetricRoutes(app, ctx);
  await registerReportRoutes(app, ctx);
  await registerBackupRoutes(app, ctx);

  return app;
}
