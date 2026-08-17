'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppLocale } from '@/lib/locale';
import {
  DEFAULT_LOCALE,
  ENABLED_LOCALES,
  LOCALE_LABELS,
  normalizeLocale,
} from '@/lib/localeConfig';
import { getApiBaseUrl } from '@/lib/apiBase';

type LocaleConfigContextValue = {
  enabledLocales: AppLocale[];
  defaultLocale: AppLocale;
  labels: Record<AppLocale, string>;
  loading: boolean;
};

const LocaleConfigContext = createContext<LocaleConfigContextValue>({
  enabledLocales: ENABLED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  labels: LOCALE_LABELS,
  loading: false,
});

export function LocaleConfigProvider({ children }: { children: React.ReactNode }) {
  const [enabledLocales, setEnabledLocales] = useState<AppLocale[]>(ENABLED_LOCALES);
  const [defaultLocale, setDefaultLocale] = useState<AppLocale>(DEFAULT_LOCALE);
  const [labels, setLabels] = useState<Record<AppLocale, string>>(LOCALE_LABELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/public/locale-config`, { cache: 'force-cache' })
      .then((res) => res.json())
      .then((result) => {
        const data = result?.data;
        if (!data?.enabledLocales?.length) return;

        const nextEnabled = data.enabledLocales
          .map((code: string) => normalizeLocale(code))
          .filter((code: AppLocale, index: number, arr: AppLocale[]) => arr.indexOf(code) === index);

        if (nextEnabled.length) setEnabledLocales(nextEnabled);
        if (data.defaultLocale) setDefaultLocale(normalizeLocale(data.defaultLocale));
        if (data.labels) {
          setLabels((prev) => ({
            ...prev,
            ...data.labels,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({ enabledLocales, defaultLocale, labels, loading }),
    [enabledLocales, defaultLocale, labels, loading]
  );

  return <LocaleConfigContext.Provider value={value}>{children}</LocaleConfigContext.Provider>;
}

export function useLocaleConfig() {
  return useContext(LocaleConfigContext);
}
