'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LayoutCard from '@/components/layouts/LayoutCard';
import LayoutCardSkeleton from '@/components/layouts/LayoutCardSkeleton';
import LayoutFiltersBar from '@/components/layouts/LayoutFiltersBar';
import LayoutsEmptyState from '@/components/layouts/LayoutsEmptyState';
import PropertyMapSection from '@/components/maps/PropertyMapSection';
import { useLocale } from '@/context/LocaleContext';
import { LayoutStatusFilter, useLayouts } from '@/hooks/useLayouts';
import {
  filterAndSortLayouts,
  hasActiveLayoutFilters,
  LayoutSortOption,
  PriceRangeFilter,
} from '@/lib/layoutFilters';
import { getLocationOptions } from '@/lib/localizedText';

function parsePriceRange(value: string | null): PriceRangeFilter {
  const valid: PriceRangeFilter[] = ['all', 'under-5l', '5l-10l', '10l-25l', 'above-25l'];
  return valid.includes(value as PriceRangeFilter) ? (value as PriceRangeFilter) : 'all';
}

function parseSortOption(value: string | null): LayoutSortOption {
  const valid: LayoutSortOption[] = ['newest', 'price', 'available'];
  return valid.includes(value as LayoutSortOption) ? (value as LayoutSortOption) : 'newest';
}

export default function LayoutsPageContent() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<LayoutStatusFilter>('active');
  const [sortBy, setSortBy] = useState<LayoutSortOption>('newest');

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setLocation(searchParams.get('location') ?? '');
    setPriceRange(parsePriceRange(searchParams.get('price')));
    setSortBy(parseSortOption(searchParams.get('sort')));
  }, [searchParams]);

  const { data: layouts = [], error, isLoading, mutate } = useLayouts(
    statusFilter === 'active' ? 'active' : 'all'
  );

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
        statusFilter,
      }),
    [layouts, search, location, priceRange, sortBy, statusFilter]
  );

  const hasActiveFilters = hasActiveLayoutFilters({
    search,
    location,
    priceRange,
    sortBy,
    statusFilter,
  });

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setPriceRange('all');
    setStatusFilter('active');
    setSortBy('newest');
  };

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden animate-in fade-in duration-500">
      {/* Hero Section with Ambient Glow and 2 Real Estate Showcase Images */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8 shadow-md">
        {/* Ambient Decorative Background Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary-400/20 blur-3xl" />

        <div className="relative mx-auto w-full min-w-0 max-w-7xl">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Header Text Area with Soft Slide-Up Entrance */}
            <div className="max-w-xl text-center lg:text-left space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl md:text-4xl lg:text-5xl transition-transform duration-300 hover:translate-x-0.5">
                {t('layouts.title')}
              </h1>
              <p className="text-base text-primary-100 sm:text-lg transition-colors duration-300 hover:text-white">
                {t('layouts.subtitle')}
              </p>
            </div>

            {/* Exactly 2 High-Quality Real Estate Images with Soft Slide-Up Entrance */}
            <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-4 lg:w-[480px] xl:w-[540px] shrink-0">
              {/* Image 1: Land Plot Layout */}
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-white/40 hover:shadow-2xl hover:shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="group relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop"
                    alt="Premium Land Plots"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-30" />
                </div>
              </div>

              {/* Image 2: Residential Community View */}
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-white/40 hover:shadow-2xl hover:shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-150">
                <div className="group relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop"
                    alt="Gated Community Estate"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Page Content Body */}
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 space-y-8">
        {/* Interactive Property Map Section */}
        {/* <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <PropertyMapSection className="mb-8 sm:mb-10 transition-all duration-300 hover:shadow-md" layouts={layouts} />
        </div> */}

        {/* Filters Bar Container */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-5 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <LayoutFiltersBar
            search={search}
            onSearchChange={setSearch}
            location={location}
            onLocationChange={setLocation}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            locationOptions={locationOptions}
            showStatusFilter
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-10 rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center shadow-sm backdrop-blur-sm animate-in fade-in duration-500">
            <p className="text-red-500 font-medium">{t('layouts.failed')}</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              {t('layouts.retry')}
            </button>
          </div>
        )}

        {/* Loading Skeletons State */}
        {isLoading && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="transform transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <LayoutCardSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* Empty Search Results State */}
        {!isLoading && !error && filteredLayouts.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-in fade-in duration-500">
            <LayoutsEmptyState hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
          </div>
        )}

        {/* Property Grid Results */}
        {!isLoading && !error && filteredLayouts.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm font-medium text-gray-500 transition-colors duration-200 hover:text-gray-700 animate-in fade-in duration-500">
              {t('layouts.showing')} <span className="font-semibold text-gray-900">{filteredLayouts.length}</span> {t('layouts.layouts')}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
              {filteredLayouts.map((layout, index) => (
                <div
                  key={layout._id}
                  className="w-full transform transition-all duration-300 ease-out hover:-translate-y-1.5 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <LayoutCard layout={layout} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}