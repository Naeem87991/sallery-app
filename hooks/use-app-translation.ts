'use client';

import { translate, type TranslationKey } from '@/lib/i18n/translations';
import { useCurrentAppRecords } from '@/hooks/use-current-app-records';

export function useAppTranslation() {
  const { records } = useCurrentAppRecords();
  const language = records?.appSettings?.language ?? 'en';
  return { language, isRtl: language === 'ur', t: (key: TranslationKey) => translate(language, key) };
}
