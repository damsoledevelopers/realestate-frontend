'use client';

import { useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';

/** Keeps document `lang` in sync with the active locale for accessibility and SEO. */
export default function LocaleHtmlSync() {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale === 'mr' ? 'mr' : 'en';
  }, [locale]);

  return null;
}
