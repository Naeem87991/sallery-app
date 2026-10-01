'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/ui/app-icon';
import { translate } from '@/lib/i18n/translations';

type MobileHeaderProps = {
  financialsVisible: boolean;
  language: 'en' | 'ur' | undefined;
  onToggleVisibility: () => void;
};

export function MobileHeader({ financialsVisible, language, onToggleVisibility }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <Link className="brand" href="/" aria-label="Live Salary Ticker home">
        <span className="brand-mark"><span>₨</span></span>
      </Link>
      <button
        className="icon-button"
        type="button"
        aria-label={translate(language, financialsVisible ? 'hideFinancialValues' : 'showFinancialValues')}
        aria-pressed={!financialsVisible}
        onClick={onToggleVisibility}
      >
        {financialsVisible
          ? <AppIcon name="eye" aria-hidden="true" size={19} />
          : <AppIcon name="eye-off" aria-hidden="true" size={19} />}
      </button>
    </header>
  );
}
