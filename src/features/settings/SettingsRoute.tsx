import { SettingsPage } from './SettingsPage';
import { useSettings } from './hooks/useSettings';

export function SettingsRoute() {
  const settings = useSettings();

  return (
    <SettingsPage
      isSaving={settings.isSaving}
      onChange={settings.onChange}
      onReset={settings.onReset}
      onSave={settings.onSave}
      settings={settings.settings}
      statusMessage={settings.statusMessage}
    />
  );
}
