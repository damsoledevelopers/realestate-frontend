import { normalizeLocale } from '@/lib/localeConfig';

export type AppLocale = 'en' | 'mr';

export const LOCALE_STORAGE_KEY = 'app_locale';

export const getStoredLocale = (): AppLocale => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return normalizeLocale(saved);
};

export const setStoredLocale = (locale: AppLocale) => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeLocale(locale);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent('app-locale-change', { detail: normalized }));
};
