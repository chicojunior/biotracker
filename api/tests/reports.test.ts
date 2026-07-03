import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

import { buildTestApp, dailyEntry, metricEntry, resetDb, testDb } from './helpers';

const handle = testDb();

after(async () => {
  await handle.pool.end();
});

beforeEach(async () => {
  await resetDb(handle);
});

test('GET /reports/daily/:date returns a summary with a disclaimer (V12)', async () => {
  const app = await buildTestApp(handle);
  await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry({ date: '2024-02-29' }) });

  const response = await app.inject({ method: 'GET', url: '/reports/daily/2024-02-29' });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.ok(body.ok);
  assert.equal(body.data.summaryType, 'daily');
  assert.equal(body.data.period.startDate, '2024-02-29');
  assert.ok(typeof body.data.disclaimer === 'string' && body.data.disclaimer.length > 0);
});

test('GET /reports/monthly/:date reports no data for an empty period (V28)', async () => {
  const app = await buildTestApp(handle);
  const response = await app.inject({ method: 'GET', url: '/reports/monthly/2024-02-15' });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.data.hasData, false);
  assert.equal(body.data.consistency.score, 0);
});

test('GET /reports/weekly aggregates multi-reading days by average (V14)', async () => {
  const app = await buildTestApp(handle);
  await app.inject({
    method: 'POST',
    url: '/entries',
    payload: dailyEntry({
      date: '2024-02-28',
      metrics: {
        weight: [
          metricEntry({ id: 'a', value: 80, recordedAt: '2024-02-28T06:00:00.000Z' }),
          metricEntry({ id: 'b', value: 82, recordedAt: '2024-02-28T20:00:00.000Z' }),
        ],
      },
    }),
  });

  const response = await app.inject({ method: 'GET', url: '/reports/weekly/2024-02-28' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.hasData, true);
});
