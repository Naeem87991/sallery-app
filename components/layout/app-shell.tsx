'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AutomaticAttendanceController } from '@/components/attendance/automatic-attendance-controller';
import { AppLockScreen } from '@/components/security/app-lock-screen';
import { LocalizedSurface } from '@/components/layout/localized-surface';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MobileHeader } from '@/components/layout/mobile-header';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';
import { useSecuritySettings } from '@/hooks/use-security-settings';
import { createClient } from '@/lib/supabase/client';
import { getSecuritySessionVersion, subscribeToSecuritySession } from '@/lib/security/session-lock';
import { translate } from '@/lib/i18n/translations';

type PageKey = 'home' | 'attendance' | 'company' | 'pocket' | 'settings' | 'career' | 'reports';

type NavItem = {
  label: string;
  href: string;
  key: PageKey;
  icon: AppIconName;
};

const primaryNavigation: Array<Omit<NavItem, 'label'> & { labelKey: 'home' | 'attendance' | 'company' | 'pocket' | 'settings' }> = [
  { labelKey: 'home', href: '/', key: 'home', icon: 'home' },
  { labelKey: 'attendance', href: '/attendance', key: 'attendance', icon: 'calendar' },
  { labelKey: 'company', href: '/company', key: 'company', icon: 'building' },
  { labelKey: 'pocket', href: '/pocket', key: 'pocket', icon: 'wallet' },
  { labelKey: 'settings', href: '/settings', key: 'settings', icon: 'settings' },
];

const secondaryNavigation: Array<Omit<NavItem, 'label'> & { labelKey: 'careerHistory' | 'reports' }> = [
  { labelKey: 'careerHistory', href: '/career', key: 'career', icon: 'chart' },
  { labelKey: 'reports', href: '/reports', key: 'reports', icon: 'file' },
];

export function AppShell({ children, activePage }: { children: ReactNode; activePage: PageKey }) {
  const pathname = usePathname();
  const router = useRouter();
  const { records } = useCurrentAppRecords();
  const { settings: securitySettings, isLoading: securityLoading } = useSecuritySettings();
  const securitySessionVersion = useSecuritySessionVersion();
  const [visibilityOverride, setVisibilityOverride] = useState<boolean | null>(null);
  const privacyModeEnabled = Boolean(records?.appSettings?.isPrivacyModeEnabled);
  const financialsVisible = visibilityOverride ?? !privacyModeEnabled;
  const language = records?.appSettings?.language;
  const theme = records?.appSettings?.theme;
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    document.documentElement.lang = language === 'ur' ? 'ur' : 'en';
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  }, [language]);

  const toggleFinancialVisibility = () => {
    const nextVisibility = !financialsVisible;
    setVisibilityOverride(nextVisibility);
    setLiveMessage(nextVisibility ? translate(language, 'financialValuesVisible') : translate(language, 'financialValuesHidden'));
  };

  const handleSignOut = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    router.push('/login');
  };

  const announceAutomaticAttendance = useCallback((date: string) => {
    setLiveMessage(language === 'ur' ? `${date} کے لیے خودکار حاضری لگا دی گئی ہے۔` : `Automatic attendance marked present for ${date}.`);
  }, [language]);

  if (securityLoading) return <main className="app-lock-screen" dir={language === 'ur' ? 'rtl' : undefined} data-localized-surface><span className="app-lock-checking">{translate(language, 'checkingLocalSecurity')}</span></main>;
  if (securitySettings?.isPinEnabled && securitySessionVersion !== securitySettings.updatedAt) {
    return (
      <div dir={language === 'ur' ? 'rtl' : undefined} data-localized-surface>
        <LocalizedSurface language={language} />
        <AppLockScreen securitySettings={securitySettings} language={language} />
      </div>
    );
  }

  return (
    <div className={`app-shell${theme === 'light' ? ' app-shell-light' : ''}${financialsVisible ? '' : ' privacy-active'}`} dir={language === 'ur' ? 'rtl' : undefined} data-localized-surface>
      <LocalizedSurface language={language} />
      <AutomaticAttendanceController profile={records?.profile} salarySettings={records?.salarySettings} onRecordCreated={announceAutomaticAttendance} />
      <a className="skip-link" href="#main-content">{translate(language, 'skipToContent')}</a>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</span>
      <aside className="desktop-sidebar" aria-label={translate(language, 'mainNavigation')}>
        <Brand />
        <Navigation items={primaryNavigation} activePage={activePage} pathname={pathname} language={language} />
        <div className="sidebar-divider" />
        <Navigation items={secondaryNavigation} activePage={activePage} pathname={pathname} language={language} subtle />
        <div className="sidebar-bottom">
          <button className="sidebar-privacy-button" type="button" aria-label={translate(language, financialsVisible ? 'hideFinancialValues' : 'showFinancialValues')} aria-pressed={!financialsVisible} onClick={toggleFinancialVisibility}>{financialsVisible ? <AppIcon name="eye" aria-hidden="true" size={15} /> : <AppIcon name="eye-off" aria-hidden="true" size={15} />}{translate(language, financialsVisible ? 'hideValues' : 'showValues')}</button>
          <button
            className="sidebar-privacy-button"
            type="button"
            onClick={handleSignOut}
            aria-label={language === 'ur' ? 'سائن آؤٹ کریں' : 'Sign out'}
            style={{ color: 'var(--muted)', marginTop: '2px' }}
          >
            <AppIcon name="arrow-right" aria-hidden="true" size={15} />
            {language === 'ur' ? 'سائن آؤٹ' : 'Sign out'}
          </button>
          <div className="offline-indicator"><span className="pulse-dot" />{translate(language, 'offlineReady')}</div>
          <p>{translate(language, 'privateByDesign')}<br />{translate(language, 'storedOnDevice')}</p>
        </div>
      </aside>

      <div className="app-main">
        <MobileHeader financialsVisible={financialsVisible} language={language} onToggleVisibility={toggleFinancialVisibility} />
        <main className="page-content" id="main-content" tabIndex={-1}>{children}</main>
      </div>
      <MobileBottomNav activePage={activePage} pathname={pathname} language={language} />
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

function Navigation({ items, activePage, pathname, language, subtle = false }: { items: Array<Omit<NavItem, 'label'> & { labelKey: 'home' | 'attendance' | 'company' | 'pocket' | 'settings' | 'careerHistory' | 'reports' }>; activePage: PageKey; pathname: string; language: 'en' | 'ur' | undefined; subtle?: boolean }) {
  return (
    <nav className={subtle ? 'sidebar-nav sidebar-nav-subtle' : 'sidebar-nav'}>
      {items.map((item) => <NavLink key={item.key} item={{ ...item, label: translate(language, item.labelKey) }} active={activePage === item.key || pathname === item.href} />)}
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
