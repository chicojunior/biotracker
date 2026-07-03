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

test('GET /backups/export returns a v1 envelope with entries sorted by date (V26)', async () => {
  const app = await buildTestApp(handle);
  await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry({ date: '2024-03-10' }) });
  await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry({ date: '2024-01-05' }) });

  const response = await app.inject({ method: 'GET', url: '/backups/export' });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.version, 1);
  assert.deepEqual(
    body.entries.map((entry: { date: string }) => entry.date),
    ['2024-01-05', '2024-03-10'],
  );
});

test('POST /backups/import replaces all existing data (V16) atomically', async () => {
  const app = await buildTestApp(handle);
  await app.inject({ method: 'POST', url: '/entries', payload: dailyEntry({ date: '2020-01-01' }) });

  const envelope = {
    version: 1,
    savedAt: '2024-02-29T08:00:00.000Z',
    updatedAt: '2024-02-29T08:00:00.000Z',
    entries: [dailyEntry({ date: '2024-02-29' })],
  };
  const response = await app.inject({ method: 'POST', url: '/backups/import', payload: envelope });
  assert.equal(response.statusCode, 200);

  const list = await app.inject({ method: 'GET', url: '/entries' });
  const dates = list.json().data.map((entry: { date: string }) => entry.date);
  assert.deepEqual(dates, ['2024-02-29']); // old 2020 entry gone
});

test('export → import round-trip preserves values (localStorage migration path, T12)', async () => {
  const app = await buildTestApp(handle);
  await app.inject({
    method: 'POST',
    url: '/entries',
    payload: dailyEntry({
      metrics: {
        weight: [metricEntry({ value: 82.4 })],
        workoutNotes: [
          metricEntry({ id: 'w1', metricType: 'workoutNotes', value: 'ran 5k', unit: null }),
        ],
      },
    }),
  });

  const exported = (await app.inject({ method: 'GET', url: '/backups/export' })).json();

  // Simulate migrating into a fresh database: wipe everything and import with a
  // new app instance (new process would resolve/create the user on demand).
  await resetDb(handle);
  const freshApp = await buildTestApp(handle);
  const reimported = await freshApp.inject({
    method: 'POST',
    url: '/backups/import',
    payload: exported,
  });
  assert.equal(reimported.statusCode, 200);

  const roundTripped = (await freshApp.inject({ method: 'GET', url: '/entries/2024-02-29' })).json();
  assert.equal(roundTripped.data.metrics.weight[0].value, 82.4);
  assert.equal(roundTripped.data.metrics.workoutNotes[0].value, 'ran 5k');
});

test('POST /backups/import rejects an unsupported version (V11)', async () => {
  const app = await buildTestApp(handle);
  const response = await app.inject({
    method: 'POST',
    url: '/backups/import',
    payload: { version: 2, entries: [] },
  });
  assert.equal(response.statusCode, 422);
  assert.equal(response.json().error.code, 'unsupported_version');
});

test('POST /backups/import rejects an invalid metric type with details (V9)', async () => {
  const app = await buildTestApp(handle);
  const response = await app.inject({
    method: 'POST',
    url: '/backups/import',
    payload: {
      version: 1,
      entries: [dailyEntry({ metrics: { weight: [metricEntry({ value: 99999 })] } })],
    },
  });
  assert.equal(response.statusCode, 422);
  const body = response.json();
  assert.equal(body.error.code, 'invalid_payload');
  assert.ok(Array.isArray(body.error.details) && body.error.details.length > 0);
});

test('POST /backups/import returns malformed_json for invalid JSON', async () => {
  const app = await buildTestApp(handle);
  const response = await app.inject({
    method: 'POST',
    url: '/backups/import',
    headers: { 'content-type': 'application/json' },
    payload: '{not valid json',
  });
  assert.equal(response.statusCode, 422);
  assert.equal(response.json().error.code, 'malformed_json');
});
