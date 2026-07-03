import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DailyHealthEntry, HealthMetricEntry } from '../../../types/health';
import {
  deleteDailyEntry,
  deleteMetricEntry,
  exportHealthData,
  importHealthData,
  loadDailyEntries,
  updateMetricEntry,
  type HealthStorageError,
  upsertDailyEntry,
} from '../../../lib/storage/healthStorage';

export type HealthDataStatus = 'idle' | 'loading' | 'saving' | 'ready' | 'error';

export type UseHealthDataOptions = {
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  storage?: Storage | null;
  now?: () => string;
  autoLoad?: boolean;
};

export type UseHealthDataValue = {
  entries: DailyHealthEntry[];
  errorMessage: string;
  isLoading: boolean;
  status: HealthDataStatus;
  statusMessage: string;
  exportData: () => Promise<string | null>;
  importData: (rawValue: string) => Promise<boolean>;
  reload: () => Promise<boolean>;
  removeEntry: (date: string) => Promise<boolean>;
  removeMetric: (metricId: string) => Promise<boolean>;
  updateMetric: (metricEntry: HealthMetricEntry) => Promise<boolean>;
  upsertEntry: (entry: DailyHealthEntry) => Promise<boolean>;
};

const FRIENDLY_ERROR_MESSAGES: Record<HealthStorageError['code'], string> = {
  storage_unavailable: 'Health data storage is unavailable on this device.',
  malformed_json: 'Saved health data is corrupted and cannot be read.',
  unsupported_version: 'Saved health data is from an unsupported app version.',
  invalid_payload: 'Health data format is invalid. Please review and try again.',
  write_failed: 'Could not save health data. Please try again.',
  not_found: 'The requested health entry was not found.',
};

function toFriendlyErrorMessage(error: HealthStorageError): string {
  return FRIENDLY_ERROR_MESSAGES[error.code] ?? error.message;
}

export function useHealthData(options: UseHealthDataOptions = {}): UseHealthDataValue {
  const storageOptions = useMemo(
    () => ({
      apiBaseUrl: options.apiBaseUrl,
      fetchImpl: options.fetchImpl,
      now: options.now,
      storage: options.storage,
    }),
    [options.apiBaseUrl, options.fetchImpl, options.now, options.storage],
  );

  const [entries, setEntries] = useState<DailyHealthEntry[]>([]);
  const [status, setStatus] = useState<HealthDataStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const reload = useCallback(async () => {
    setStatus('loading');
    setStatusMessage('');
    setErrorMessage('');

    const result = await loadDailyEntries(storageOptions);

    if (!result.ok) {
      setStatus('error');
      setErrorMessage(toFriendlyErrorMessage(result.error));
      return false;
    }

    setEntries(result.data);
    setStatus('ready');
    return true;
  }, [storageOptions]);

  const upsertEntry = useCallback(
    async (entry: DailyHealthEntry) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = await upsertDailyEntry(entry, storageOptions);

      if (!result.ok) {
        setStatus('error');
        setErrorMessage(toFriendlyErrorMessage(result.error));
        return false;
      }

      setEntries(result.data);
      setStatus('ready');
      setStatusMessage('Entry saved.');
      return true;
    },
    [storageOptions],
  );

  const removeEntry = useCallback(
    async (date: string) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = await deleteDailyEntry(date, storageOptions);

      if (!result.ok) {
        setStatus('error');
        setErrorMessage(toFriendlyErrorMessage(result.error));
        return false;
      }

      setEntries(result.data);
      setStatus('ready');
      setStatusMessage('Entry removed.');
      return true;
    },
    [storageOptions],
  );

  const updateMetric = useCallback(
    async (metricEntry: HealthMetricEntry) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = await updateMetricEntry(metricEntry, storageOptions);

      if (!result.ok) {
        setStatus('error');
        setErrorMessage(toFriendlyErrorMessage(result.error));
        return false;
      }

      setEntries(result.data);
      setStatus('ready');
      setStatusMessage('Metric updated.');
      return true;
    },
    [storageOptions],
  );

  const removeMetric = useCallback(
    async (metricId: string) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = await deleteMetricEntry(metricId, storageOptions);

      if (!result.ok) {
        setStatus('error');
        setErrorMessage(toFriendlyErrorMessage(result.error));
        return false;
      }

      setEntries(result.data);
      setStatus('ready');
      setStatusMessage('Metric removed.');
      return true;
    },
    [storageOptions],
  );

  const importData = useCallback(
    async (rawValue: string) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = await importHealthData(rawValue, storageOptions);

      if (!result.ok) {
        setStatus('error');
        setErrorMessage(toFriendlyErrorMessage(result.error));
        return false;
      }

      setEntries(result.data);
      setStatus('ready');
      setStatusMessage('Health data imported.');
      return true;
    },
    [storageOptions],
  );

  const exportData = useCallback(async () => {
    setStatusMessage('');
    setErrorMessage('');

    const result = await exportHealthData(storageOptions);

    if (!result.ok) {
      setStatus('error');
      setErrorMessage(toFriendlyErrorMessage(result.error));
      return null;
    }

    setStatus('ready');
    setStatusMessage('Health data exported.');
    return result.data;
  }, [storageOptions]);

  useEffect(() => {
    if (options.autoLoad === false) {
      return;
    }

    void reload();
  }, [options.autoLoad, reload]);

  return {
    entries,
    errorMessage,
    exportData,
    importData,
    isLoading: status === 'loading',
    reload,
    removeEntry,
    removeMetric,
    status,
    statusMessage,
    updateMetric,
    upsertEntry,
  };
}
