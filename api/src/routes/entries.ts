import type { FastifyInstance } from 'fastify';

import { dailyHealthEntrySchema } from '../../../src/lib/validation/healthSchemas';
import type { AppContext } from '../app';
import { httpStatusForError } from '../result';
import {
  deleteEntryByDate,
  getEntryByDate,
  listEntries,
  upsertEntry,
} from '../repositories/entriesRepository';
import { zodDetails } from './zodDetails';

const DATE_PARAM = '/:date(\\d{4}-\\d{2}-\\d{2})';

export async function registerEntryRoutes(
  app: FastifyInstance,
  ctx: AppContext,
): Promise<void> {
  app.get('/entries', async () => {
    const userId = await ctx.resolveUserId();
    const entries = await listEntries(ctx.db, userId);
    return { ok: true, data: entries };
  });

  app.get<{ Params: { date: string } }>(`/entries${DATE_PARAM}`, async (request, reply) => {
    const userId = await ctx.resolveUserId();
    const entry = await getEntryByDate(ctx.db, userId, request.params.date);

    if (!entry) {
      return reply.code(404).send({
        ok: false,
        error: { code: 'not_found', message: `No entry found for ${request.params.date}` },
      });
    }

    return { ok: true, data: entry };
  });

  app.post('/entries', async (request, reply) => {
    const parsed = dailyHealthEntrySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(422).send({
        ok: false,
        error: {
          code: 'invalid_payload',
          message: 'Daily entry failed validation.',
          details: zodDetails(parsed.error),
        },
      });
    }

    const userId = await ctx.resolveUserId();
    const result = await upsertEntry(ctx.db, userId, parsed.data);

    if (!result.ok) {
      return reply.code(httpStatusForError(result.error.code)).send(result);
    }

    return reply.code(201).send(result);
  });

  app.patch<{ Params: { date: string } }>(
    `/entries${DATE_PARAM}`,
    async (request, reply) => {
      const parsed = dailyHealthEntrySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(422).send({
          ok: false,
          error: {
            code: 'invalid_payload',
            message: 'Daily entry failed validation.',
            details: zodDetails(parsed.error),
          },
        });
      }

      if (parsed.data.date !== request.params.date) {
        return reply.code(422).send({
          ok: false,
          error: {
            code: 'invalid_payload',
            message: `Body date ${parsed.data.date} does not match URL date ${request.params.date}.`,
          },
        });
      }

      const userId = await ctx.resolveUserId();
      const result = await upsertEntry(ctx.db, userId, parsed.data);

      if (!result.ok) {
        return reply.code(httpStatusForError(result.error.code)).send(result);
      }

      return result;
    },
  );

  app.delete<{ Params: { date: string } }>(
    `/entries${DATE_PARAM}`,
    async (request, reply) => {
      const userId = await ctx.resolveUserId();
      const result = await deleteEntryByDate(ctx.db, userId, request.params.date);

      if (!result.ok) {
        return reply.code(httpStatusForError(result.error.code)).send(result);
      }

      return result;
    },
  );
}
