'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useDashboardSearch } from '@/context/DashboardSearchContext';
import { useLocale } from '@/context/LocaleContext';
import { formatPropertyType } from '@/lib/properties';
import { DashboardSearchEntityType } from '@/lib/types';

const TYPE_FILTERS: Array<{ value: DashboardSearchEntityType | ''; labelKey: string }> = [
  { value: '', labelKey: 'dashboard.search.allTypes' },
  { value: 'layout', labelKey: 'dashboard.startup.quick.layouts' },
  { value: 'plot', labelKey: 'dashboard.startup.quick.plots' },
  { value: 'farm', labelKey: 'dashboard.startup.quick.farms' },
  { value: 'land', labelKey: 'dashboard.startup.quick.lands' },
  { value: 'row_house', labelKey: 'dashboard.startup.quick.rowHouses' },
  { value: 'bungalow', labelKey: 'dashboard.startup.quick.bungalows' },
];

interface DashboardGlobalSearchProps {
  variant?: 'navbar' | 'page';
}

function SearchResultsBody({
  loading,
  error,
  results,
  typeFilter,
  query,
  getResultHref,
  onNavigate,
  t,
}: {
  loading: boolean;
  error: string | null;
  results: ReturnType<typeof useDashboardSearch>['results'];
  typeFilter: DashboardSearchEntityType | '';
  query: string;
  getResultHref: ReturnType<typeof useDashboardSearch>['getResultHref'];
  onNavigate?: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (!typeFilter && query.trim().length < 2) {
    return <p className="px-3 py-4 text-sm text-gray-400">{t('dashboard.search.minChars')}</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return <p className="px-3 py-4 text-sm text-red-500">{error}</p>;
  }

  if (results.length === 0) {
    return <p className="px-3 py-4 text-sm text-gray-400">{t('dashboard.search.empty')}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {results.map((result) => (
        <li key={`${result.type}-${result.id}`}>
          <Link
            href={getResultHref(result)}
            onClick={onNavigate}
            className="flex items-start justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{result.title}</p>
              <p className="truncate text-sm text-gray-500">
                {result.subtitle}
                {result.layoutName ? ` · ${result.layoutName}` : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              {formatPropertyType(result.type)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardGlobalSearch({ variant = 'page' }: DashboardGlobalSearchProps) {
  const { t } = useLocale();
  const {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    results,
    pagination,
    loading,
    error,
    isOpen,
    setIsOpen,
    clearSearch,
    getResultHref,
  } = useDashboardSearch();
  const containerRef = useRef<HTMLDivElement>(null);

  const hasActiveSearch = typeFilter !== '' || query.trim().length >= 2;
  const activeFilterLabel = TYPE_FILTERS.find((filter) => filter.value === typeFilter);

  useEffect(() => {
    if (variant !== 'navbar') return;

    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setIsOpen, variant]);

  const showNavbarDropdown = variant === 'navbar' && isOpen && hasActiveSearch;
  const showPageResults = variant === 'page' && hasActiveSearch;

  const inputClassName =
    variant === 'navbar'
      ? 'w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20'
      : 'w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

  const handleClear = () => {
    clearSearch();
  };

  return (
    <div ref={containerRef} className={variant === 'navbar' ? 'relative w-full' : ''}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (variant === 'navbar') setIsOpen(true);
          }}
          onFocus={() => {
            if (variant === 'navbar') setIsOpen(true);
          }}
          placeholder={t('dashboard.search.placeholder')}
          className={inputClassName}
          aria-label={t('dashboard.nav.search')}
        />
        {(query || typeFilter) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label={t('dashboard.search.clear')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {variant === 'page' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                typeFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      )}

      {showPageResults && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {typeFilter && !query.trim()
                  ? t('dashboard.search.browseTitle', {
                      type: activeFilterLabel ? t(activeFilterLabel.labelKey) : '',
                    })
                  : t('dashboard.search.resultsTitle')}
              </p>
              {pagination && pagination.total > 0 && !loading && !error ? (
                <p className="mt-0.5 text-xs text-gray-500">
                  {t('dashboard.search.resultsCount', { count: pagination.total })}
                </p>
              ) : null}
            </div>
            {typeFilter && !query.trim() ? (
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                {t('dashboard.search.browseBadge')}
              </span>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            <SearchResultsBody
              loading={loading}
              error={error}
              results={results}
              typeFilter={typeFilter}
              query={query}
              getResultHref={getResultHref}
              t={t}
            />
          </div>
        </div>
      )}

      {showNavbarDropdown && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex flex-wrap gap-2 border-b border-gray-100 p-3">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={`nav-${filter.value || 'all'}`}
                type="button"
                onClick={() => setTypeFilter(filter.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  typeFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                {t(filter.labelKey)}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            <SearchResultsBody
              loading={loading}
              error={error}
              results={results}
              typeFilter={typeFilter}
              query={query}
              getResultHref={getResultHref}
              onNavigate={() => setIsOpen(false)}
              t={t}
            />
          </div>

          {pagination && pagination.total > 0 && !loading && !error && (
            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
              {t('dashboard.search.resultsCount', { count: pagination.total })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
