'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';

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
  const [financialsVisible, setFinancialsVisible] = useState(true);

  return (
    <div className={financialsVisible ? 'app-shell' : 'app-shell privacy-active'}>
      <aside className="desktop-sidebar" aria-label="Main navigation">
        <Brand />
        <Navigation items={primaryNavigation} activePage={activePage} pathname={pathname} />
        <div className="sidebar-divider" />
        <Navigation items={secondaryNavigation} activePage={activePage} pathname={pathname} subtle />
        <div className="sidebar-bottom">
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
            onClick={() => setFinancialsVisible((current) => !current)}
          >
            {financialsVisible ? <AppIcon name="eye" aria-hidden="true" size={19} /> : <AppIcon name="eye-off" aria-hidden="true" size={19} />}
          </button>
        </header>
        <main className="page-content">{children}</main>
      </div>
      <nav className="bottom-navigation" aria-label="Primary navigation">
        {primaryNavigation.map((item) => <NavLink key={item.key} item={item} active={activePage === item.key || pathname === item.href} />)}
      </nav>
    </div>
  );
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
    <Link className={active ? 'nav-link nav-link-active' : 'nav-link'} href={item.href}>
      <AppIcon name={item.icon} aria-hidden="true" size={19} strokeWidth={active ? 2.25 : 1.8} />
      <span>{item.label}</span>
    </Link>
  );
}
