import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { AppIcon } from '@/components/ui/app-icon';

export default function OnboardingPage() {
  return (
    <AppShell activePage="home">
      <section className="onboarding-card">
        <span className="onboarding-icon"><AppIcon name="shield" aria-hidden="true" size={26} /></span>
        <p className="eyebrow">ONBOARDING · PHASE 2</p>
        <h1>Let&apos;s make this yours.</h1>
        <p>Phase 1 has prepared the responsive, installable offline shell. The full guided profile and salary configuration wizard is the next delivery phase.</p>
        <Link className="primary-button" href="/">Return home <AppIcon name="arrow-right" aria-hidden="true" size={18} /></Link>
      </section>
    </AppShell>
  );
}
