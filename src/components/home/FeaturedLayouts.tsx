'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import LayoutCard from '@/components/layouts/LayoutCard';
import LayoutFiltersBar from '@/components/layouts/LayoutFiltersBar';
import { useLayouts } from '@/hooks/useLayouts';
import {
  filterAndSortLayouts,
  hasActiveLayoutFilters,
  LayoutSortOption,
  PriceRangeFilter,
} from '@/lib/layoutFilters';
import { useLocale } from '@/context/LocaleContext';
import { getLocationOptions } from '@/lib/localizedText';

export default function FeaturedLayouts() {
  const { t, locale } = useLocale();
  const { data: layouts = [], error, isLoading, mutate } = useLayouts('active');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>('all');
  const [sortBy, setSortBy] = useState<LayoutSortOption>('newest');

  const locationOptions = useMemo(
    () => getLocationOptions(layouts, locale),
    [layouts, locale]
  );

  const filteredLayouts = useMemo(
    () =>
      filterAndSortLayouts(layouts, {
        search,
        location,
        priceRange,
        sortBy,
        statusFilter: 'active',
      }),
    [layouts, search, location, priceRange, sortBy]
  );

  const hasFilters = hasActiveLayoutFilters({
    search,
    location,
    priceRange,
    sortBy,
    statusFilter: 'active',
  });

  const displayedLayouts = hasFilters ? filteredLayouts : filteredLayouts.slice(0, 3);

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setPriceRange('all');
    setSortBy('newest');
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('home.featured.title')}</h2>
        <p className="mt-2 text-gray-500">{t('home.featured.subtitle')}</p>
      </div>

      <div className="mt-8 min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 p-3 sm:p-5">
        <LayoutFiltersBar
          idPrefix="featured"
          search={search}
          onSearchChange={setSearch}
          location={location}
          onLocationChange={setLocation}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          locationOptions={locationOptions}
        />

        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {t('layouts.showing')} {filteredLayouts.length} {t('layouts.layouts')}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              {t('layouts.clearFilters')}
            </button>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedLayouts.map((layout) => (
          <LayoutCard key={layout._id} layout={layout} />
        ))}
      </div>

      {isLoading && <p className="mt-8 text-center text-gray-400">{t('home.featured.loading')}</p>}

      {error && (
        <div className="mt-8 text-center">
          <p className="text-red-500">{t('home.featured.error')}</p>
          <button type="button" onClick={() => mutate()} className="btn-primary mt-4">
            {t('layouts.retry')}
          </button>
        </div>
      )}

      {!isLoading && !error && filteredLayouts.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            {hasFilters ? t('layouts.noMatch') : t('layouts.none')}
          </p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-secondary mt-4">
              {t('layouts.clearFilters')}
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && layouts.length > 0 && (
        <div className="mt-10 text-center">
          <Link href="/layouts" className="btn-primary">
            {t('home.featured.viewAll')}
          </Link>
        </div>
      )}
    </section>
  );
}
