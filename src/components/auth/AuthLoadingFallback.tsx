'use client';

import { useLocale } from '@/context/LocaleContext';

export default function AuthLoadingFallback() {
  const { t } = useLocale();
  return (
    <div className="flex flex-1 items-center justify-center text-gray-400">
      {t('common.loading')}
    </div>
  );
}
