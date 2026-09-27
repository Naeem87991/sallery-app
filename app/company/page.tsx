import { AppShell } from '@/components/layout/app-shell';
import { FeaturePlaceholder } from '@/components/layout/feature-placeholder';

export default function CompanyPage() {
  return <AppShell activePage="company"><FeaturePlaceholder icon="building" eyebrow="PHASE 5" title="A clear company ledger." description="Withdrawals, vouchers, advances, loans, credits, and deductions will be reconciled here." /></AppShell>;
}
