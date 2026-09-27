import { AppShell } from '@/components/layout/app-shell';
import { SettingsContent } from '@/components/settings/settings-content';

export default function SettingsPage() {
  return <AppShell activePage="settings"><SettingsContent /></AppShell>;
}
