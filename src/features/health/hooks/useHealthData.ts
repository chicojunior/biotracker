import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DailyHealthEntry } from '../../../types/health';
import {
  deleteDailyEntry,
  exportHealthData,
  importHealthData,
  loadDailyEntries,
  type HealthStorageError,
  upsertDailyEntry,
} from '../../../lib/storage/healthStorage';

export type HealthDataStatus = 'idle' | 'loading' | 'saving' | 'ready' | 'error';

export type UseHealthDataOptions = {
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
  exportData: () => string | null;
  importData: (rawValue: string) => boolean;
  reload: () => boolean;
  removeEntry: (date: string) => boolean;
  upsertEntry: (entry: DailyHealthEntry) => boolean;
};

const FRIENDLY_ERROR_MESSAGES: Record<HealthStorageError['code'], string> = {
  storage_unavailable: 'Health data storage is unavailable on this device.',
  malformed_json: 'Saved health data is corrupted and cannot be read.',
  unsupported_version: 'Saved health data is from an unsupported app version.',
  invalid_payload: 'Health data format is invalid. Please review and try again.',
  write_failed: 'Could not save health data. Please try again.',
};

function toFriendlyErrorMessage(error: HealthStorageError): string {
  return FRIENDLY_ERROR_MESSAGES[error.code] ?? error.message;
}

export function useHealthData(options: UseHealthDataOptions = {}): UseHealthDataValue {
  const storageOptions = useMemo(
    () => ({
      now: options.now,
      storage: options.storage,
    }),
    [options.now, options.storage],
  );

  const [entries, setEntries] = useState<DailyHealthEntry[]>([]);
  const [status, setStatus] = useState<HealthDataStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const reload = useCallback(() => {
    setStatus('loading');
    setStatusMessage('');
    setErrorMessage('');

    const result = loadDailyEntries(storageOptions);

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
    (entry: DailyHealthEntry) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = upsertDailyEntry(entry, storageOptions);

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
    (date: string) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = deleteDailyEntry(date, storageOptions);

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

  const importData = useCallback(
    (rawValue: string) => {
      setStatus('saving');
      setStatusMessage('');
      setErrorMessage('');

      const result = importHealthData(rawValue, storageOptions);

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

  const exportData = useCallback(() => {
    setStatusMessage('');
    setErrorMessage('');

    const result = exportHealthData(storageOptions);

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

    reload();
  }, [options.autoLoad, reload]);

  return {
    entries,
    errorMessage,
    exportData,
    importData,
    isLoading: status === 'loading',
    reload,
    removeEntry,
    status,
    statusMessage,
    upsertEntry,
  };
}
