'use client';

import { useLocale } from '@/context/LocaleContext';

interface LayoutsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export default function LayoutsEmptyState({ hasFilters, onClearFilters }: LayoutsEmptyStateProps) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900">
        {hasFilters ? t('layouts.noMatch') : t('layouts.none')}
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        {hasFilters ? t('layouts.adjust') : t('layouts.checkBack')}
      </p>
      {hasFilters && onClearFilters && (
        <button type="button" onClick={onClearFilters} className="btn-secondary mt-6">
          {t('layouts.clearFilters')}
        </button>
      )}
    </div>
  );
}
