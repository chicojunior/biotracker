import type { FastifyInstance } from 'fastify';

import { healthMetricEntrySchema } from '../../../src/lib/validation/healthSchemas';
import type { AppContext } from '../app';
import { deleteMetricById, updateMetricById } from '../repositories/entriesRepository';
import { httpStatusForError } from '../result';
import { zodDetails } from './zodDetails';

export async function registerMetricRoutes(
  app: FastifyInstance,
  ctx: AppContext,
): Promise<void> {
  app.patch<{ Params: { id: string } }>('/metrics/:id', async (request, reply) => {
    const parsed = healthMetricEntrySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(422).send({
        ok: false,
        error: {
          code: 'invalid_payload',
          message: 'Metric entry failed validation.',
          details: zodDetails(parsed.error),
        },
      });
    }

    if (parsed.data.id !== request.params.id) {
      return reply.code(422).send({
        ok: false,
        error: {
          code: 'invalid_payload',
          message: `Body metric id ${parsed.data.id} does not match URL id ${request.params.id}.`,
        },
      });
    }

    const userId = await ctx.resolveUserId();
    const result = await updateMetricById(ctx.db, userId, request.params.id, parsed.data);

    if (!result.ok) {
      return reply.code(httpStatusForError(result.error.code)).send(result);
    }

    return result;
  });

  app.delete<{ Params: { id: string } }>('/metrics/:id', async (request, reply) => {
    const userId = await ctx.resolveUserId();
    const result = await deleteMetricById(ctx.db, userId, request.params.id);

    if (!result.ok) {
      return reply.code(httpStatusForError(result.error.code)).send(result);
    }

    return result;
  });
}
