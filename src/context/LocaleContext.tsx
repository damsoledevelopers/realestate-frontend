'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppLocale, getStoredLocale, setStoredLocale } from '@/lib/locale';
import { translate } from '@/lib/i18n';

type LocaleContextType = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('en');

  useEffect(() => {
    const initial = getStoredLocale();
    setLocaleState(initial);
    document.documentElement.lang = initial === 'mr' ? 'mr' : 'en';

    const onLocaleChange = (event: Event) => {
      const detail = (event as CustomEvent<AppLocale>).detail;
      const next = detail === 'mr' ? 'mr' : 'en';
      setLocaleState(next);
      document.documentElement.lang = next;
    };
    window.addEventListener('app-locale-change', onLocaleChange as EventListener);
    return () =>
      window.removeEventListener('app-locale-change', onLocaleChange as EventListener);
  }, []);

  const setLocale = (next: AppLocale) => {
    setLocaleState(next);
    setStoredLocale(next);
    document.documentElement.lang = next;
  };

  const t = useMemo(
    () => (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
