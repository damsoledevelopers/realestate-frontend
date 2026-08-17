'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLayouts } from '@/hooks/useLayouts';
import {
  buildLayoutsSearchParams,
  LayoutSortOption,
  PRICE_RANGE_OPTIONS,
  PriceRangeFilter,
  SORT_OPTIONS,
} from '@/lib/layoutFilters';
import { useLocale } from '@/context/LocaleContext';
import { getLocationOptions } from '@/lib/localizedText';

const fieldClassName =
  'box-border w-full min-w-0 max-w-full rounded-xl border border-white/20 bg-white/95 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#c8ff00] focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/40 sm:px-4 sm:py-3';

type FilterState = {
  search: string;
  location: string;
  priceRange: PriceRangeFilter;
  sortBy: LayoutSortOption;
};

export default function HeroSearchFilter() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { data: layouts = [] } = useLayouts('active');
  const locationOptions = useMemo(
    () => getLocationOptions(layouts, locale),
    [layouts, locale]
  );
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef<FilterState>({ search: '', location: '', priceRange: 'all', sortBy: 'newest' });

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>('all');
  const [sortBy, setSortBy] = useState<LayoutSortOption>('newest');

  filtersRef.current = { search, location, priceRange, sortBy };

  const applyFilters = useCallback(
    (filters: FilterState) => {
      router.push(buildLayoutsSearchParams(filters));
    },
    [router]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      applyFilters({ ...filtersRef.current, search: value });
    }, 400);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    applyFilters({ ...filtersRef.current, location: value });
  };

  const handlePriceChange = (value: PriceRangeFilter) => {
    setPriceRange(value);
    applyFilters({ ...filtersRef.current, priceRange: value });
  };

  const handleSortChange = (value: LayoutSortOption) => {
    setSortBy(value);
    applyFilters({ ...filtersRef.current, sortBy: value });
  };

  const priceLabels: Record<string, string> =
    locale === 'mr'
      ? {
          all: 'कोणतीही किंमत',
          'under-5l': '₹5 लाखांखाली',
          '5l-10l': '₹5 - 10 लाख',
          '10l-25l': '₹10 - 25 लाख',
          'above-25l': '₹25 लाखांपेक्षा जास्त',
        }
      : {};
  const sortLabels: Record<string, string> =
    locale === 'mr'
      ? {
          newest: 'नवीनतम',
          updated: 'अलीकडे अपडेट',
          price: 'किंमत: कमी ते जास्त',
          available: 'जास्त उपलब्ध',
          plots: 'जास्त प्लॉट',
        }
      : {};

  return (
    <div className="box-border w-full min-w-0 max-w-full rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-md sm:mx-auto sm:max-w-5xl sm:p-4">
      <div className="flex w-full min-w-0 flex-row flex-wrap items-stretch gap-2 sm:flex-nowrap sm:gap-3">
        <div className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-0">
          <label htmlFor="hero-search" className="sr-only">
            {t('filters.search')}
          </label>
          <input
            id="hero-search"
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('home.hero.searchPlaceholder')}
            className={fieldClassName}
          />
        </div>

        <div className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-0">
          <label htmlFor="hero-location" className="sr-only">
            {t('filters.location')}
          </label>
          <select
            id="hero-location"
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className={fieldClassName}
          >
            <option value="">{t('filters.allLocations')}</option>
            {locationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-0">
          <label htmlFor="hero-price" className="sr-only">
            {t('filters.priceRange')}
          </label>
          <select
            id="hero-price"
            value={priceRange}
            onChange={(e) => handlePriceChange(e.target.value as PriceRangeFilter)}
            className={fieldClassName}
          >
            {PRICE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {priceLabels[option.value] || option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-0">
          <label htmlFor="hero-sort" className="sr-only">
            {t('filters.sortBy')}
          </label>
          <select
            id="hero-sort"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as LayoutSortOption)}
            className={fieldClassName}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {sortLabels[option.value] || option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
