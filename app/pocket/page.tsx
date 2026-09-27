import { AppShell } from '@/components/layout/app-shell';
import { FeaturePlaceholder } from '@/components/layout/feature-placeholder';

export default function PocketPage() {
  return <AppShell activePage="pocket"><FeaturePlaceholder icon="wallet" eyebrow="PHASE 6" title="Every rupee, accounted for." description="Cash, expenses, receipts, Udhaar, and savings goals will be managed here." /></AppShell>;
}
