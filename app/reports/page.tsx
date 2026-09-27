import { AppShell } from '@/components/layout/app-shell';
import { FeaturePlaceholder } from '@/components/layout/feature-placeholder';

export default function ReportsPage() {
  return <AppShell activePage="reports"><FeaturePlaceholder icon="file" eyebrow="PHASE 8" title="Reports that travel with you." description="Generate local PDFs, CSV exports, and printable voucher images here." /></AppShell>;
}
