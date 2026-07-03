import type { HealthMetricEntry } from '../../types/health';

function getTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function selectPreferredMetricEntry(
  entries: HealthMetricEntry[] | undefined,
  preferredSource?: string,
): HealthMetricEntry | undefined {
  if (!entries || entries.length === 0) {
    return undefined;
  }

  const sourceFiltered = preferredSource
    ? entries.filter((entry) => entry.source === preferredSource)
    : entries;
  const sourceCandidates = sourceFiltered.length > 0 ? sourceFiltered : entries;

  const preferredCandidates = sourceCandidates.filter((entry) => entry.isPreferredSource);
  const metricEntries = preferredCandidates.length > 0 ? preferredCandidates : sourceCandidates;

  return [...metricEntries].sort(
    (left, right) => getTimestamp(right.recordedAt) - getTimestamp(left.recordedAt),
  )[0];
}
