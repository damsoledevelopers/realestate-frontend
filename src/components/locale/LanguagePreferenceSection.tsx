'use client';

import { useLocale } from '@/context/LocaleContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LanguagePreferenceSection() {
  const { t } = useLocale();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('profile.language')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('common.languageHint')}</p>
        </div>
        <LanguageSwitcher variant="field" className="w-full sm:w-48" />
      </div>
    </section>
  );
}
