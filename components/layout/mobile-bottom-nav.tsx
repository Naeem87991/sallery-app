'use client';

import Link from 'next/link';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { translate } from '@/lib/i18n/translations';

type PageKey = 'home' | 'attendance' | 'company' | 'pocket' | 'settings' | 'career' | 'reports';

type NavItem = {
  labelKey: 'home' | 'attendance' | 'company' | 'pocket' | 'settings';
  href: string;
  key: PageKey;
  icon: AppIconName;
};

const primaryNavigation: NavItem[] = [
  { labelKey: 'home', href: '/', key: 'home', icon: 'home' },
  { labelKey: 'attendance', href: '/attendance', key: 'attendance', icon: 'calendar' },
  { labelKey: 'company', href: '/company', key: 'company', icon: 'building' },
  { labelKey: 'pocket', href: '/pocket', key: 'pocket', icon: 'wallet' },
  { labelKey: 'settings', href: '/settings', key: 'settings', icon: 'settings' },
];

type MobileBottomNavProps = {
  activePage: PageKey;
  pathname: string;
  language: 'en' | 'ur' | undefined;
};

export function MobileBottomNav({ activePage, pathname, language }: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label={translate(language, 'primaryNavigation')}>
      {primaryNavigation.map((item) => {
        const active = activePage === item.key || pathname === item.href;
        return (
          <Link
            key={item.key}
            className={active ? 'mobile-bottom-nav-item nav-link-active' : 'mobile-bottom-nav-item'}
            href={item.href}
            aria-current={active ? 'page' : undefined}
          >
            <AppIcon name={item.icon} aria-hidden="true" size={22} strokeWidth={active ? 2.25 : 1.8} />
            <span>{translate(language, item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
