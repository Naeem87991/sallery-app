import { AppShell } from '@/components/layout/app-shell';
import { FeaturePlaceholder } from '@/components/layout/feature-placeholder';

export default function CareerPage() {
  return <AppShell activePage="career"><FeaturePlaceholder icon="chart" eyebrow="PHASE 7" title="Your career, in perspective." description="Historical employment records and lifetime earnings will remain separate from your live wallet." /></AppShell>;
}
