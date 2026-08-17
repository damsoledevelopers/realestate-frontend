import { AppLocale } from '@/lib/locale';

/** Enabled UI languages — extend here to add more locales later. */
export const ENABLED_LOCALES: AppLocale[] = ['en', 'mr'];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  mr: 'मराठी',
};

export function isEnabledLocale(value: string | null | undefined): value is AppLocale {
  return value === 'en' || value === 'mr';
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return isEnabledLocale(value) && ENABLED_LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}
