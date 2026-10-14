'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
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
  const { token, isSuperAdmin } = useAuth();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<LayoutSortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<LayoutStatusFilter>('all');
  const [approvalStatus, setApprovalStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [showLayoutForm, setShowLayoutForm] = useState(false);
  const [editingLayout, setEditingLayout] = useState<Layout | null>(null);
  const [allLocationLayouts, setAllLocationLayouts] = useState<Layout[]>([]);

  const { data, error, isLoading, mutate } = useManagedLayouts({
    page,
    limit: 12,
    search: debouncedSearch,
    location, state, district, taluka, village, surveyNumber,
    status: statusFilter, approvalStatus,
    sortBy,
  });

  const layouts = data?.layouts ?? [];
  useEffect(() => {
    if (!token) return;
    api.get<Layout[]>('/layouts/admin/location-options', token).then(setAllLocationLayouts).catch(() => setAllLocationLayouts([]));
  }, [token]);
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {isSuperAdmin && <select aria-label="Approval status" value={approvalStatus} onChange={(e) => { setApprovalStatus(e.target.value as typeof approvalStatus); setPage(1); }} className="input-field w-full sm:w-auto">
          <option value="all">All approval statuses</option><option value="pending">Pending approval</option><option value="approved">Approved / published</option><option value="rejected">Rejected</option>
        </select>}
        <button onClick={openCreate} className="btn-primary w-full sm:w-auto">
          {t('dashboard.layouts.addLayout')}
        </button>
        </div>
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
          state={state} district={district} taluka={taluka} village={village} surveyNumber={surveyNumber}
          onStateChange={(value) => { setState(value); setDistrict(''); setTaluka(''); setVillage(''); setPage(1); }}
          onDistrictChange={(value) => { setDistrict(value); setTaluka(''); setVillage(''); setPage(1); }}
          onTalukaChange={(value) => { setTaluka(value); setVillage(''); setPage(1); }}
          onVillageChange={(value) => { setVillage(value); setPage(1); }}
          onSurveyNumberChange={(value) => { setSurveyNumber(value); setPage(1); }}
          layouts={allLocationLayouts.length ? allLocationLayouts : layouts}
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
        <LayoutsEmptyState hasFilters onClearFilters={() => { setSearch(''); setLocation(''); setState(''); setDistrict(''); setTaluka(''); setVillage(''); setSurveyNumber(''); setStatusFilter('all'); setApprovalStatus('all'); setSortBy('newest'); setPage(1); }} />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {layouts.map((layout) => (
              <div key={layout._id} className="flex min-w-0 flex-col self-start">
                <DashboardLayoutCard layout={layout} />
                <div className="mt-2 flex w-full flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${layout.approvalStatus === 'approved' || !layout.approvalStatus ? 'bg-emerald-50 text-emerald-700' : layout.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {layout.approvalStatus || 'legacy / published'}
                  </span>
                  {isSuperAdmin && layout.approvalStatus !== 'approved' && (
                    <button type="button" disabled={approvalBusyId === layout._id} onClick={async () => {
                      if (!token) return; setApprovalBusyId(layout._id);
                      try { await api.patch(`/layouts/${layout._id}/approval`, { approvalStatus: 'approved' }, token); notify.success('Layout approved and published'); await mutate(); }
                      catch (err) { notify.error(getApiErrorMessage(err, 'Could not approve layout')); }
                      finally { setApprovalBusyId(null); }
                    }} className="btn-primary text-xs" >Approve & Publish</button>
                  )}
                  {isSuperAdmin && layout.approvalStatus !== 'rejected' && (
                    <button type="button" disabled={approvalBusyId === layout._id} onClick={async () => {
                      if (!token) return; setApprovalBusyId(layout._id);
                      try { await api.patch(`/layouts/${layout._id}/approval`, { approvalStatus: 'rejected' }, token); notify.success('Layout rejected'); await mutate(); }
                      catch (err) { notify.error(getApiErrorMessage(err, 'Could not reject layout')); }
                      finally { setApprovalBusyId(null); }
                    }} className="btn-secondary text-xs" >Reject</button>
                  )}
                </div>
              </div>
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
