import { describe, expect, it } from 'vitest';

import type { HealthMetricEntry } from '../../types/health';
import { selectPreferredMetricEntry } from './selectPreferredMetricEntry';

function makeEntry(overrides: Partial<HealthMetricEntry> = {}): HealthMetricEntry {
  return {
    id: 'id',
    metricType: 'weight',
    value: 70,
    unit: 'kg',
    recordedAt: '2026-05-01T08:00:00Z',
    source: 'manual',
    isPreferredSource: false,
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-05-01T08:00:00Z',
    ...overrides,
  };
}

describe('selectPreferredMetricEntry', () => {
  it('returns undefined for empty or missing entries', () => {
    expect(selectPreferredMetricEntry(undefined)).toBeUndefined();
    expect(selectPreferredMetricEntry([])).toBeUndefined();
  });

  it('returns the only entry when one is provided', () => {
    const entry = makeEntry();
    expect(selectPreferredMetricEntry([entry])).toBe(entry);
  });

  it('filters by preferred source when present', () => {
    const manual = makeEntry({ id: 'm', source: 'manual', value: 70 });
    const scale = makeEntry({ id: 's', source: 'smartScale', value: 71 });
    expect(selectPreferredMetricEntry([manual, scale], 'smartScale')).toBe(scale);
    expect(selectPreferredMetricEntry([manual, scale], 'manual')).toBe(manual);
  });

  it('falls back to all entries when no entry matches the preferred source', () => {
    const manual = makeEntry({ id: 'm', source: 'manual' });
    expect(selectPreferredMetricEntry([manual], 'smartScale')).toBe(manual);
  });

  it('prefers entries flagged isPreferredSource within the source-filtered set', () => {
    const a = makeEntry({ id: 'a', isPreferredSource: false, recordedAt: '2026-05-02T10:00:00Z' });
    const b = makeEntry({ id: 'b', isPreferredSource: true, recordedAt: '2026-05-01T10:00:00Z' });
    expect(selectPreferredMetricEntry([a, b])).toBe(b);
  });

  it('uses recency as tiebreaker when multiple entries qualify', () => {
    const older = makeEntry({ id: 'older', recordedAt: '2026-05-01T08:00:00Z' });
    const newer = makeEntry({ id: 'newer', recordedAt: '2026-05-02T08:00:00Z' });
    expect(selectPreferredMetricEntry([older, newer])).toBe(newer);
  });

  it('combines source filter, preferred flag, and recency', () => {
    const oldManual = makeEntry({
      id: 'oldManual',
      source: 'manual',
      isPreferredSource: false,
      recordedAt: '2026-05-01T08:00:00Z',
    });
    const newManual = makeEntry({
      id: 'newManual',
      source: 'manual',
      isPreferredSource: true,
      recordedAt: '2026-05-02T08:00:00Z',
    });
    const newScale = makeEntry({
      id: 'newScale',
      source: 'smartScale',
      isPreferredSource: true,
      recordedAt: '2026-05-03T08:00:00Z',
    });

    expect(selectPreferredMetricEntry([oldManual, newManual, newScale], 'manual')).toBe(newManual);
    expect(selectPreferredMetricEntry([oldManual, newManual, newScale], 'smartScale')).toBe(newScale);
  });

  it('handles invalid recordedAt by treating it as oldest', () => {
    const invalid = makeEntry({ id: 'invalid', recordedAt: 'not-a-date' });
    const valid = makeEntry({ id: 'valid', recordedAt: '2026-05-01T08:00:00Z' });
    expect(selectPreferredMetricEntry([invalid, valid])).toBe(valid);
  });
});
