import { AppShell } from '@/components/layout/app-shell';
import { FeaturePlaceholder } from '@/components/layout/feature-placeholder';

export default function AttendancePage() {
  return <AppShell activePage="attendance"><FeaturePlaceholder icon="calendar" eyebrow="PHASE 4" title="Attendance, without guesswork." description="Calendar editing, rules, overtime, and bulk actions will live here." /></AppShell>;
}
