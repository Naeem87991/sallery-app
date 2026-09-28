'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AutomaticAttendanceController } from '@/components/attendance/automatic-attendance-controller';
import { AppLockScreen } from '@/components/security/app-lock-screen';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { useSecuritySettings } from '@/hooks/use-security-settings';
import { getSecuritySessionVersion, subscribeToSecuritySession } from '@/lib/security/session-lock';

type PageKey = 'home' | 'attendance' | 'company' | 'pocket' | 'settings' | 'career' | 'reports';

type NavItem = {
  label: string;
  href: string;
  key: PageKey;
  icon: AppIconName;
};

const primaryNavigation: NavItem[] = [
  { label: 'Home', href: '/', key: 'home', icon: 'home' },
  { label: 'Attendance', href: '/attendance', key: 'attendance', icon: 'calendar' },
  { label: 'Company', href: '/company', key: 'company', icon: 'building' },
  { label: 'Pocket', href: '/pocket', key: 'pocket', icon: 'wallet' },
  { label: 'Settings', href: '/settings', key: 'settings', icon: 'settings' },
];

const secondaryNavigation: NavItem[] = [
  { label: 'Career history', href: '/career', key: 'career', icon: 'chart' },
  { label: 'Reports', href: '/reports', key: 'reports', icon: 'file' },
];

export function AppShell({ children, activePage }: { children: ReactNode; activePage: PageKey }) {
  const pathname = usePathname();
  const { records } = useCurrentAppRecords();
  const { settings: securitySettings, isLoading: securityLoading } = useSecuritySettings();
  const securitySessionVersion = useSecuritySessionVersion();
  const [visibilityOverride, setVisibilityOverride] = useState<boolean | null>(null);
  const privacyModeEnabled = Boolean(records?.appSettings?.isPrivacyModeEnabled);
  const financialsVisible = visibilityOverride ?? !privacyModeEnabled;
  const language = records?.appSettings?.language;
  const theme = records?.appSettings?.theme;
  const [liveMessage, setLiveMessage] = useState('');

  const toggleFinancialVisibility = () => {
    const nextVisibility = !financialsVisible;
    setVisibilityOverride(nextVisibility);
    setLiveMessage(nextVisibility ? 'Financial values are visible.' : 'Financial values are hidden.');
  };
  const announceAutomaticAttendance = useCallback((date: string) => {
    setLiveMessage(`Automatic attendance marked present for ${date}.`);
  }, []);

  if (securityLoading) return <main className="app-lock-screen"><span className="app-lock-checking">Checking local security…</span></main>;
  if (securitySettings?.isPinEnabled && securitySessionVersion !== securitySettings.updatedAt) return <AppLockScreen securitySettings={securitySettings} />;

  return (
    <div className={`app-shell${theme === 'light' ? ' app-shell-light' : ''}${financialsVisible ? '' : ' privacy-active'}`} dir={language === 'ur' ? 'rtl' : undefined}>
      <AutomaticAttendanceController profile={records?.profile} salarySettings={records?.salarySettings} onRecordCreated={announceAutomaticAttendance} />
      <a className="skip-link" href="#main-content">Skip to page content</a>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</span>
      <aside className="desktop-sidebar" aria-label="Main navigation">
        <Brand />
        <Navigation items={primaryNavigation} activePage={activePage} pathname={pathname} />
        <div className="sidebar-divider" />
        <Navigation items={secondaryNavigation} activePage={activePage} pathname={pathname} subtle />
        <div className="sidebar-bottom">
          <button className="sidebar-privacy-button" type="button" aria-label={financialsVisible ? 'Hide financial values' : 'Show financial values'} aria-pressed={!financialsVisible} onClick={toggleFinancialVisibility}>{financialsVisible ? <AppIcon name="eye" aria-hidden="true" size={15} /> : <AppIcon name="eye-off" aria-hidden="true" size={15} />}{financialsVisible ? 'Hide values' : 'Show values'}</button>
          <div className="offline-indicator"><span className="pulse-dot" />Offline ready</div>
          <p>Private by design<br />Stored on this device</p>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-header">
          <Brand compact />
          <button
            className="icon-button"
            type="button"
            aria-label={financialsVisible ? 'Hide financial values' : 'Show financial values'}
            aria-pressed={!financialsVisible}
            onClick={toggleFinancialVisibility}
          >
            {financialsVisible ? <AppIcon name="eye" aria-hidden="true" size={19} /> : <AppIcon name="eye-off" aria-hidden="true" size={19} />}
          </button>
        </header>
        <main className="page-content" id="main-content" tabIndex={-1}>{children}</main>
      </div>
      <nav className="bottom-navigation" aria-label="Primary navigation">
        {primaryNavigation.map((item) => <NavLink key={item.key} item={item} active={activePage === item.key || pathname === item.href} />)}
      </nav>
    </div>
  );
}

function useSecuritySessionVersion(): string {
  return useSyncExternalStore(subscribeToSecuritySession, getSecuritySessionVersion, () => '');
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Live Salary Ticker home">
      <span className="brand-mark"><span>₨</span></span>
      {!compact && <span className="brand-copy"><strong>Live Salary</strong><small>TICKER</small></span>}
    </Link>
  );
}

function Navigation({ items, activePage, pathname, subtle = false }: { items: NavItem[]; activePage: PageKey; pathname: string; subtle?: boolean }) {
  return (
    <nav className={subtle ? 'sidebar-nav sidebar-nav-subtle' : 'sidebar-nav'}>
      {items.map((item) => <NavLink key={item.key} item={item} active={activePage === item.key || pathname === item.href} />)}
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link className={active ? 'nav-link nav-link-active' : 'nav-link'} href={item.href} aria-current={active ? 'page' : undefined}>
      <AppIcon name={item.icon} aria-hidden="true" size={19} strokeWidth={active ? 2.25 : 1.8} />
      <span>{item.label}</span>
    </Link>
  );
}
