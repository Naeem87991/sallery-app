import { AppShell } from '@/components/layout/app-shell';
import { FeaturePlaceholder } from '@/components/layout/feature-placeholder';

export default function SettingsPage() {
  return <AppShell activePage="settings"><FeaturePlaceholder icon="settings" eyebrow="PHASE 2" title="Settings that respect your rules." description="Profile, salary, attendance, privacy, language, and backup controls will be configured here." /></AppShell>;
}
