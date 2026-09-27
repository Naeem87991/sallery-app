import { AppShell } from '@/components/layout/app-shell';
import { CompanyContent } from '@/components/company/company-content';

export default function CompanyPage() {
  return <AppShell activePage="company"><CompanyContent /></AppShell>;
}
