import type { FastifyInstance } from 'fastify';

import {
  createDailyReportSummary,
  createMonthlyReportSummary,
  createWeeklyReportSummary,
} from '../../../src/lib/reports/reportEngine';
import type { ReportSummary } from '../../../src/types/health';
import type { AppContext } from '../app';
import { listEntries } from '../repositories/entriesRepository';

const DATE_PARAM = '/:date(\\d{4}-\\d{2}-\\d{2})';

type SummaryBuilder = (
  entries: Parameters<typeof createDailyReportSummary>[0],
  referenceDate: string,
  options: { now: string; weekStartsOn: number },
) => ReportSummary;

export async function registerReportRoutes(
  app: FastifyInstance,
  ctx: AppContext,
): Promise<void> {
  const routes: Array<{ path: string; build: SummaryBuilder }> = [
    { path: `/reports/daily${DATE_PARAM}`, build: createDailyReportSummary },
    { path: `/reports/weekly${DATE_PARAM}`, build: createWeeklyReportSummary },
    { path: `/reports/monthly${DATE_PARAM}`, build: createMonthlyReportSummary },
  ];

  for (const { path, build } of routes) {
    app.get<{ Params: { date: string } }>(path, async (request) => {
      const userId = await ctx.resolveUserId();
      const entries = await listEntries(ctx.db, userId);
      const summary = build(entries, request.params.date, {
        now: new Date().toISOString(),
        weekStartsOn: ctx.weekStartsOn,
      });
      return { ok: true, data: summary };
    });
  }
}
