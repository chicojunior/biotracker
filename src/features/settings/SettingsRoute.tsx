import { useCallback, useEffect, useState } from 'react';

import { useHealthData } from '../health/hooks/useHealthData';
import { SettingsPage } from './SettingsPage';
import { useSettings } from './hooks/useSettings';

export function SettingsRoute() {
  const settings = useSettings();
  const healthData = useHealthData();
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setStatusMessage(settings.statusMessage);
  }, [settings.statusMessage]);

  useEffect(() => {
    if (healthData.errorMessage) {
      setStatusMessage(healthData.errorMessage);
      return;
    }

    if (healthData.statusMessage) {
      setStatusMessage(healthData.statusMessage);
    }
  }, [healthData.errorMessage, healthData.statusMessage]);

  const onExport = useCallback(async () => {
    const exportedValue = await healthData.exportData();

    if (!exportedValue) {
      return;
    }

    try {
      const downloadDate = new Date().toISOString().slice(0, 10);
      const blob = new Blob([exportedValue], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = downloadUrl;
      anchor.download = `biotracker-health-data-${downloadDate}.json`;
      anchor.click();

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 0);
    } catch {
      setStatusMessage('Could not download exported health data.');
    }
  }, [healthData.exportData]);

  const onImport = useCallback(() => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const selectedFile = input.files?.[0];

      if (!selectedFile) {
        return;
      }

      const confirmed = window.confirm(
        'Importing this backup replaces all existing health data. Continue?',
      );

      if (!confirmed) {
        setStatusMessage('Health data import canceled.');
        return;
      }

      try {
        const rawValue = await selectedFile.text();
        await healthData.importData(rawValue);
      } catch {
        setStatusMessage('Could not read the selected JSON file.');
      }
    };

    input.click();
  }, [healthData.importData]);

  return (
    <SettingsPage
      isSaving={settings.isSaving}
      onChange={settings.onChange}
      onExport={onExport}
      onImport={onImport}
      onReset={settings.onReset}
      onSave={settings.onSave}
      settings={settings.settings}
      statusMessage={statusMessage}
    />
  );
}
