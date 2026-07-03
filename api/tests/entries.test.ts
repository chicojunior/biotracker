import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

import type { FastifyInstance } from 'fastify';

import { buildTestApp, dailyEntry, metricEntry, resetDb, testDb } from './helpers';

const handle = testDb();

async function freshApp(): Promise<FastifyInstance> {
  await resetDb(handle);
  return buildTestApp(handle);
}

after(async () => {
  await handle.pool.end();
});

beforeEach(async () => {
  await resetDb(handle);
});

test('GET /entries returns an empty list initially', async () => {
  const app = await buildTestApp(handle);
  const response = await app.inject({ method: 'GET', url: '/entries' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ok: true, data: [] });
});

test('POST /entries creates an entry and persists it normalized', async () => {
  const app = await freshApp();
  const response = await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry() });

  assert.equal(response.statusCode, 201);
  const body = response.json();
  assert.ok(body.ok);
  assert.equal(body.data.date, '2024-02-29');
  assert.equal(body.data.metrics.weight[0].value, 82.4);
  assert.equal(body.data.metrics.weight[0].source, 'manual');

  const stored = await app.inject({ method: 'GET', url: '/entries/2024-02-29' });
  assert.equal(stored.statusCode, 200);
  assert.equal(stored.json().data.metrics.weight[0].value, 82.4);
});

test('POST /entries rejects an out-of-range value with invalid_payload and details', async () => {
  const app = await freshApp();
  const response = await app.inject({
    method: 'POST',
    url: '/entries',
    payload: dailyEntry({ metrics: { weight: [metricEntry({ value: 5000 })] } }),
  });

  assert.equal(response.statusCode, 422);
  const body = response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'invalid_payload');
  assert.ok(Array.isArray(body.error.details) && body.error.details.length > 0);
});

test('POST /entries replaces the same date (upsert, one entry per day) with multi-reading support', async () => {
  const app = await freshApp();
  await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry() });

  // Same date, two weight readings — must replace the day and keep both.
  const twoReadings = dailyEntry({
    metrics: {
      weight: [
        metricEntry({ id: 'm-a', value: 81.1, recordedAt: '2024-02-29T06:00:00.000Z' }),
        metricEntry({ id: 'm-b', value: 81.5, recordedAt: '2024-02-29T21:00:00.000Z' }),
      ],
    },
  });
  const response = await app.inject({ method: 'POST', url: '/entries', payload: twoReadings });
  assert.equal(response.statusCode, 201);

  const list = await app.inject({ method: 'GET', url: '/entries' });
  const entries = list.json().data;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].metrics.weight.length, 2);
});

test('GET /entries/:date returns 404 not_found for a missing date', async () => {
  const app = await freshApp();
  const response = await app.inject({ method: 'GET', url: '/entries/2020-01-01' });
  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error.code, 'not_found');
});

test('PATCH /entries/:date rejects a body date mismatch', async () => {
  const app = await freshApp();
  const response = await app.inject({
    method: 'PATCH',
    url: '/entries/2024-02-29',
    payload: dailyEntry({ date: '2024-03-01' }),
  });
  assert.equal(response.statusCode, 422);
  assert.equal(response.json().error.code, 'invalid_payload');
});

test('DELETE /entries/:date removes the entry', async () => {
  const app = await freshApp();
  await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry() });

  const deleted = await app.inject({ method: 'DELETE', url: '/entries/2024-02-29' });
  assert.equal(deleted.statusCode, 200);

  const list = await app.inject({ method: 'GET', url: '/entries' });
  assert.deepEqual(list.json().data, []);
});

test('PATCH /metrics/:id updates one metric row and returns the parent entry', async () => {
  const app = await freshApp();
  await app.inject({
    method: 'POST',
    url: '/entries',
    payload: dailyEntry({
      metrics: {
        weight: [metricEntry({ value: 82.4 })],
        restingHeartRate: [
          metricEntry({ id: 'heart-1', metricType: 'restingHeartRate', value: 61, unit: 'bpm' }),
        ],
      },
    }),
  });

  const stored = await app.inject({ method: 'GET', url: '/entries/2024-02-29' });
  const metric = stored.json().data.metrics.weight[0];
  const response = await app.inject({
    method: 'PATCH',
    url: `/metrics/${metric.id}`,
    payload: {
      ...metric,
      value: 80.2,
      notes: 'morning re-check',
      updatedAt: '2024-02-29T09:00:00.000Z',
    },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.metrics.weight[0].value, 80.2);
  assert.equal(body.data.metrics.weight[0].notes, 'morning re-check');
  assert.equal(body.data.metrics.restingHeartRate[0].value, 61);
});

test('PATCH /metrics/:id rejects a body id mismatch', async () => {
  const app = await freshApp();
  await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry() });
  const stored = await app.inject({ method: 'GET', url: '/entries/2024-02-29' });
  const metric = stored.json().data.metrics.weight[0];

  const response = await app.inject({
    method: 'PATCH',
    url: `/metrics/${metric.id}`,
    payload: { ...metric, id: '999' },
  });

  assert.equal(response.statusCode, 422);
  assert.equal(response.json().error.code, 'invalid_payload');
});

test('DELETE /metrics/:id removes one metric row and keeps the parent entry', async () => {
  const app = await freshApp();
  await app.inject({
    method: 'POST',
    url: '/entries',
    payload: dailyEntry({
      metrics: {
        weight: [metricEntry({ value: 82.4 })],
        restingHeartRate: [
          metricEntry({ id: 'heart-1', metricType: 'restingHeartRate', value: 61, unit: 'bpm' }),
        ],
      },
    }),
  });

  const stored = await app.inject({ method: 'GET', url: '/entries/2024-02-29' });
  const metric = stored.json().data.metrics.weight[0];
  const response = await app.inject({ method: 'DELETE', url: `/metrics/${metric.id}` });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.date, '2024-02-29');
  assert.deepEqual(body.data.metrics.weight ?? [], []);
  assert.equal(body.data.metrics.restingHeartRate[0].value, 61);
});

test('DELETE /metrics/:id returns 404 for a missing metric', async () => {
  const app = await freshApp();
  const response = await app.inject({ method: 'DELETE', url: '/metrics/999' });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error.code, 'not_found');
});
