import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';

import type { DailyHealthEntry, HealthMetricEntry } from '../../types/health';
import { useHealthData } from '../health/hooks/useHealthData';
import { HistoryPage, type HistoryPageProps } from './HistoryPage';

type HistoryRouteProps = {
  PageComponent?: ComponentType<HistoryPageProps>;
};

function sortEntriesByDate(entries: DailyHealthEntry[]) {
  return [...entries].sort((leftEntry, rightEntry) => {
    return new Date(rightEntry.date).getTime() - new Date(leftEntry.date).getTime();
  });
}

function findEntryById(entries: DailyHealthEntry[], entryId: string) {
  return entries.find((entry) => entry.id === entryId) ?? null;
}

export function HistoryRoute({ PageComponent = HistoryPage }: HistoryRouteProps) {
  const navigate = useNavigate();
  const healthData = useHealthData();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const sortedEntries = useMemo(() => sortEntriesByDate(healthData.entries), [healthData.entries]);

  useEffect(() => {
    if (sortedEntries.length === 0) {
      setSelectedEntryId(null);
      return;
    }

    const selectedEntryStillExists = selectedEntryId
      ? sortedEntries.some((entry) => entry.id === selectedEntryId)
      : false;

    if (selectedEntryStillExists) {
      return;
    }

    setSelectedEntryId(sortedEntries[0].id);
  }, [selectedEntryId, sortedEntries]);

  const handleSelectEntry = useCallback((entryId: string) => {
    setSelectedEntryId(entryId);
  }, []);

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      const entry = findEntryById(healthData.entries, entryId);

      if (!entry) {
        return;
      }

      const removed = await healthData.removeEntry(entry.date);

      if (!removed) {
        return;
      }

      setSelectedEntryId((currentEntryId) => (currentEntryId === entryId ? null : currentEntryId));
    },
    [healthData.entries, healthData.removeEntry],
  );

  const handleEditEntry = useCallback(
    (entryId: string) => {
      const entry = findEntryById(healthData.entries, entryId);

      if (!entry) {
        return;
      }

      const params = new URLSearchParams({ date: entry.date });

      navigate(`/entry?${params.toString()}`);
    },
    [healthData.entries, navigate],
  );

  const handleUpdateMetric = useCallback(
    async (metricEntry: HealthMetricEntry) => {
      return healthData.updateMetric(metricEntry);
    },
    [healthData.updateMetric],
  );

  const handleDeleteMetric = useCallback(
    async (metricId: string) => {
      return healthData.removeMetric(metricId);
    },
    [healthData.removeMetric],
  );

  const isBusy = healthData.isLoading || healthData.status === 'saving';

  return (
    <PageComponent
      entries={sortedEntries}
      selectedEntryId={selectedEntryId}
      onSelectEntry={handleSelectEntry}
      onDeleteEntry={handleDeleteEntry}
      onEditEntry={handleEditEntry}
      onUpdateMetric={handleUpdateMetric}
      onDeleteMetric={handleDeleteMetric}
      isListLoading={healthData.isLoading}
      isDetailLoading={isBusy}
      listErrorMessage={healthData.errorMessage}
      detailErrorMessage={healthData.errorMessage}
      listStatusMessage={healthData.statusMessage}
      detailStatusMessage={healthData.statusMessage}
      pageStatusMessage={healthData.status === 'saving' ? 'Saving history changes...' : ''}
    />
  );
}
