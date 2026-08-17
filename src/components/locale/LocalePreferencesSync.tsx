'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { AppLocale, setStoredLocale } from '@/lib/locale';
import { normalizeLocale } from '@/lib/localeConfig';

/** Syncs locale between localStorage, user profile, and UI without page reload. */
export default function LocalePreferencesSync() {
  const { user, token, updateProfile } = useAuth();
  const { locale, setLocale } = useLocale();
  const appliedUserId = useRef<string | null>(null);
  const savingLocale = useRef(false);

  useEffect(() => {
    if (!user?._id || !user.preferredLocale) return;
    if (appliedUserId.current === user._id) return;

    const preferred = normalizeLocale(user.preferredLocale);
    appliedUserId.current = user._id;
    savingLocale.current = true;
    setStoredLocale(preferred);
    setLocale(preferred);
    window.setTimeout(() => {
      savingLocale.current = false;
    }, 0);
  }, [user?._id, user?.preferredLocale, setLocale]);

  useEffect(() => {
    if (!token || !user || savingLocale.current) return;
    if (normalizeLocale(user.preferredLocale) === locale) return;

    const timer = window.setTimeout(() => {
      updateProfile({ preferredLocale: locale as AppLocale }).catch(() => {});
    }, 500);

    return () => window.clearTimeout(timer);
  }, [locale, token, user, updateProfile]);

  return null;
}
