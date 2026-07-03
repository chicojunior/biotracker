import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  columnsToMetricValue,
  metricValueToColumns,
  rowConfidenceToNumber,
} from '../src/domain/metricValue';

test('metricValueToColumns routes a number to value_decimal (V25)', () => {
  const result = metricValueToColumns(82.4, 'weight');
  assert.ok(result.ok);
  assert.deepEqual(result.data, { valueDecimal: '82.4', valueText: null, valueBoolean: null });
});

test('metricValueToColumns routes a string to value_text', () => {
  const result = metricValueToColumns('ran 5k', 'workoutNotes');
  assert.ok(result.ok);
  assert.deepEqual(result.data, { valueDecimal: null, valueText: 'ran 5k', valueBoolean: null });
});

test('metricValueToColumns routes a boolean to value_boolean', () => {
  const result = metricValueToColumns(true, 'someFlag');
  assert.ok(result.ok);
  assert.deepEqual(result.data, { valueDecimal: null, valueText: null, valueBoolean: true });
});

test('metricValueToColumns rejects null (violates exactly-one-value)', () => {
  const result = metricValueToColumns(null, 'weight');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, 'invalid_payload');
  }
});

test('metricValueToColumns rejects non-finite numbers', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = metricValueToColumns(value, 'weight');
    assert.equal(result.ok, false);
  }
});

test('columnsToMetricValue reconstructs the union value', () => {
  assert.equal(
    columnsToMetricValue({ valueDecimal: '82.4', valueText: null, valueBoolean: null }),
    82.4,
  );
  assert.equal(
    columnsToMetricValue({ valueDecimal: null, valueText: 'ran 5k', valueBoolean: null }),
    'ran 5k',
  );
  assert.equal(
    columnsToMetricValue({ valueDecimal: null, valueText: null, valueBoolean: false }),
    false,
  );
});

test('rowConfidenceToNumber converts numeric string or undefined', () => {
  assert.equal(rowConfidenceToNumber('0.900'), 0.9);
  assert.equal(rowConfidenceToNumber(null), undefined);
});
