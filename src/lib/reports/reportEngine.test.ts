import { describe, expect, it } from 'vitest';

import type { DailyHealthEntry, HealthMetricEntry, HealthMetricType } from '../../types/health';
import {
  createDailyReportSummary,
  createMonthlyReportSummary,
  createWeeklyReportSummary,
} from './reportEngine';

function buildMetricEntry(
  metricType: HealthMetricType,
  value: number,
  recordedAt: string,
): HealthMetricEntry {
  return {
    id: `${metricType}-${recordedAt}`,
    metricType,
    value,
    unit: null,
    recordedAt,
    source: 'manual',
    createdAt: recordedAt,
    updatedAt: recordedAt,
  };
}

function buildDailyEntry(
  date: string,
  metrics: Partial<Record<HealthMetricType, HealthMetricEntry[]>>,
): DailyHealthEntry {
  return {
    id: `daily-${date}`,
    date,
    metrics,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

describe('report engine', () => {
  it('returns deterministic daily summary for empty arrays', () => {
    const summary = createDailyReportSummary([], '2026-05-06', {
      now: '2026-05-06T12:00:00.000Z',
    });

    expect(summary).toEqual({
      id: 'daily:2026-05-06:2026-05-06',
      summaryType: 'daily',
      period: {
        startDate: '2026-05-06',
        endDate: '2026-05-06',
      },
      observations: [
        'Nenhum registro encontrado no periodo selecionado.',
        'Sem variacoes metricas relevantes em comparacao ao periodo anterior.',
      ],
      missingData: [],
      consistency: {
        score: 0,
        notes: 'Cobertura de dias: 0/1. Cobertura de metricas esperadas: 0/0.',
      },
      disclaimer:
        'Resumo informativo para acompanhamento de rotina. Este conteudo nao realiza diagnostico nem orientacao medica.',
      createdAt: '2026-05-06T12:00:00.000Z',
    });
  });

  it('highlights metric changes when comparing current and previous weeks', () => {
    const entries: DailyHealthEntry[] = [
      buildDailyEntry('2026-04-28', {
        weight: [buildMetricEntry('weight', 80, '2026-04-28T07:00:00.000Z')],
        dailySteps: [buildMetricEntry('dailySteps', 7000, '2026-04-28T20:00:00.000Z')],
      }),
      buildDailyEntry('2026-05-02', {
        weight: [buildMetricEntry('weight', 80, '2026-05-02T07:00:00.000Z')],
        dailySteps: [buildMetricEntry('dailySteps', 7000, '2026-05-02T20:00:00.000Z')],
      }),
      buildDailyEntry('2026-05-05', {
        weight: [buildMetricEntry('weight', 82, '2026-05-05T07:00:00.000Z')],
        dailySteps: [buildMetricEntry('dailySteps', 6500, '2026-05-05T20:00:00.000Z')],
      }),
      buildDailyEntry('2026-05-07', {
        weight: [buildMetricEntry('weight', 82, '2026-05-07T07:00:00.000Z')],
        dailySteps: [buildMetricEntry('dailySteps', 6500, '2026-05-07T20:00:00.000Z')],
      }),
    ];

    const summary = createWeeklyReportSummary(entries, '2026-05-06', {
      now: '2026-05-06T12:00:00.000Z',
    });

    expect(summary.period).toEqual({
      startDate: '2026-05-04',
      endDate: '2026-05-10',
    });
    expect(summary.observations).toContain(
      'Comparado ao periodo anterior, dailySteps variou -500.',
    );
    expect(summary.observations).toContain('Comparado ao periodo anterior, weight variou +2.');
    expect(summary.missingData).toEqual([]);
  });

  it('reports missing metrics in the current month based on known metrics history', () => {
    const entries: DailyHealthEntry[] = [
      buildDailyEntry('2026-04-10', {
        weight: [buildMetricEntry('weight', 79, '2026-04-10T08:00:00.000Z')],
        sleepDuration: [
          buildMetricEntry('sleepDuration', 7.5, '2026-04-10T22:00:00.000Z'),
        ],
      }),
      buildDailyEntry('2026-05-03', {
        weight: [buildMetricEntry('weight', 80, '2026-05-03T08:00:00.000Z')],
      }),
      buildDailyEntry('2026-05-11', {
        weight: [buildMetricEntry('weight', 80.5, '2026-05-11T08:00:00.000Z')],
      }),
    ];

    const summary = createMonthlyReportSummary(entries, '2026-05-15', {
      now: '2026-05-20T09:00:00.000Z',
    });

    expect(summary.period).toEqual({
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });
    expect(summary.missingData).toEqual(['sleepDuration']);
    expect(summary.observations).toContain('Dados ausentes no periodo: sleepDuration.');
    expect(summary.consistency.score).toBeLessThan(100);
  });
});
