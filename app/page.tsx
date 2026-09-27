import { AppShell } from '@/components/layout/app-shell';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function HomePage() {
  return (
    <AppShell activePage="home">
      <DashboardContent />
    </AppShell>
  );
}
