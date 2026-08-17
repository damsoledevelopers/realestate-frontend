'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useManagedLayouts } from '@/hooks/useManagedLayouts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Layout } from '@/lib/types';
import DashboardLayoutCard from '@/components/dashboard/DashboardLayoutCard';
import LayoutFormModal from '@/components/dashboard/LayoutFormModal';
import LayoutFiltersBar from '@/components/layouts/LayoutFiltersBar';
import LayoutsEmptyState from '@/components/layouts/LayoutsEmptyState';
import LayoutCardSkeleton from '@/components/layouts/LayoutCardSkeleton';
import Pagination from '@/components/ui/Pagination';
import { LayoutSortOption } from '@/lib/layoutFilters';
import { LayoutStatusFilter } from '@/hooks/useLayouts';
import { useLocale } from '@/context/LocaleContext';
import { getLocationOptions } from '@/lib/localizedText';

export default function AdminLayoutsPage() {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState<LayoutSortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<LayoutStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [showLayoutForm, setShowLayoutForm] = useState(false);
  const [editingLayout, setEditingLayout] = useState<Layout | null>(null);

  const { data, error, isLoading, mutate } = useManagedLayouts({
    page,
    limit: 12,
    search: debouncedSearch,
    location,
    status: statusFilter,
    sortBy,
  });

  const layouts = data?.layouts ?? [];
  const pagination = data?.pagination;
  const locationOptions = useMemo(() => getLocationOptions(layouts, locale), [layouts, locale]);

  const openCreate = () => {
    setEditingLayout(null);
    setShowLayoutForm(true);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.layouts.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.layouts.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-full sm:w-auto">
          {t('dashboard.layouts.addLayout')}
        </button>
      </div>

      <div className="card">
        <LayoutFiltersBar
          idPrefix="dashboard-layouts"
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          location={location}
          onLocationChange={(value) => { setLocation(value); setPage(1); }}
          priceRange="all"
          onPriceRangeChange={() => {}}
          sortBy={sortBy}
          onSortByChange={(value) => { setSortBy(value); setPage(1); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => { setStatusFilter(value); setPage(1); }}
          locationOptions={locationOptions}
          showStatusFilter
        />
      </div>

      {error ? (
        <div className="card py-12 text-center">
          <p className="text-red-500">{t('dashboard.layouts.loadFailed')}</p>
          <button onClick={() => mutate()} className="btn-primary mt-4">
            {t('common.retry')}
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <LayoutCardSkeleton key={i} />)}
        </div>
      ) : layouts.length === 0 ? (
        <LayoutsEmptyState hasFilters onClearFilters={() => { setSearch(''); setLocation(''); setStatusFilter('all'); setSortBy('newest'); setPage(1); }} />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {layouts.map((layout) => (
              <DashboardLayoutCard key={layout._id} layout={layout} />
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          )}
        </>
      )}

      {token && (
        <LayoutFormModal
          open={showLayoutForm}
          editingLayoutId={editingLayout?._id}
          initialLayout={editingLayout}
          token={token}
          onClose={() => { setShowLayoutForm(false); setEditingLayout(null); }}
          onSaved={() => mutate()}
        />
      )}
    </div>
  );
}
