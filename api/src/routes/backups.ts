import type { FastifyInstance } from 'fastify';

import type { AppContext } from '../app';
import { listEntries, replaceAllEntries } from '../repositories/entriesRepository';
import { httpStatusForError } from '../result';
import {
  envelopeVersionSchema,
  importEnvelopeSchema,
  IMPORT_ENVELOPE_VERSION,
} from '../validation/envelopeSchema';
import { zodDetails } from './zodDetails';

export async function registerBackupRoutes(
  app: FastifyInstance,
  ctx: AppContext,
): Promise<void> {
  // GET /backups/export — full JSON envelope, entries sorted date asc (V26).
  app.get('/backups/export', async () => {
    const userId = await ctx.resolveUserId();
    const entries = await listEntries(ctx.db, userId);

    return {
      version: IMPORT_ENVELOPE_VERSION,
      exportedAt: new Date().toISOString(),
      entries,
    };
  });

  // POST /backups/import — replace-all (V16), atomic (V10). Version is checked
  // before entries so a future version yields unsupported_version (V11).
  app.post('/backups/import', async (request, reply) => {
    const versionResult = envelopeVersionSchema.safeParse(request.body);

    if (!versionResult.success) {
      return reply.code(422).send({
        ok: false,
        error: {
          code: 'invalid_payload',
          message: 'Backup envelope is missing a numeric version.',
          details: zodDetails(versionResult.error),
        },
      });
    }

    if (versionResult.data.version !== IMPORT_ENVELOPE_VERSION) {
      return reply.code(422).send({
        ok: false,
        error: {
          code: 'unsupported_version',
          message: `Backup version ${versionResult.data.version} is not supported.`,
        },
      });
    }

    const parsed = importEnvelopeSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(422).send({
        ok: false,
        error: {
          code: 'invalid_payload',
          message: 'Backup envelope failed validation.',
          details: zodDetails(parsed.error),
        },
      });
    }

    const userId = await ctx.resolveUserId();
    const result = await replaceAllEntries(ctx.db, userId, parsed.data.entries);

    if (!result.ok) {
      return reply.code(httpStatusForError(result.error.code)).send(result);
    }

    return result;
  });
}
