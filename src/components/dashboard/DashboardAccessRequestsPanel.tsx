'use client';

import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LayoutList,
  Rows3,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useLocale } from '@/context/LocaleContext';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { notify } from '@/lib/notify';
import { openRegistrationDocument } from '@/lib/registrationDocuments';

type RequestFilter = 'pending' | 'approved' | 'rejected';
type SortOption = 'newest' | 'oldest' | 'name';
type DensityOption = 'comfortable' | 'compact';

function formatSubmittedDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusPill({ status, label }: { status: RequestFilter; label: string }) {
  const styles: Record<RequestFilter, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rejected: 'bg-red-50 text-red-700 ring-red-200',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles[status]}`}
    >
      {label}
    </span>
  );
}

export default function DashboardAccessRequestsPanel() {
  const { token } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<RequestFilter>('pending');
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [density, setDensity] = useState<DensityOption>('comfortable');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api
      .get<User[]>(`/users/dashboard-requests?status=${filter}`, token)
      .then(setRequests)
      .catch(() => notify.error(t('accessRequests.loadFailed')))
      .finally(() => setLoading(false));
  }, [token, filter, t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    setExpandedId(null);
  }, [filter, search, sortBy]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = requests;

    if (query) {
      rows = rows.filter((request) => {
        const haystack = [request.name, request.email, request.phone, request.dashboardRequestNote]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    return [...rows].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortBy === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [requests, search, sortBy]);

  const reviewRequest = async (user: User, action: 'approve' | 'reject') => {
    if (!token) return;

    const approved = action === 'approve';
    const confirmed = await confirm({
      title: approved ? t('accessRequests.approveTitle') : t('accessRequests.rejectTitle'),
      message: approved
        ? t('accessRequests.approveMessage', { name: user.name })
        : t('accessRequests.rejectMessage', { name: user.name }),
      confirmLabel: approved ? t('accessRequests.approve') : t('accessRequests.reject'),
      variant: approved ? 'default' : 'danger',
    });
    if (!confirmed) return;

    setActionId(user._id);
    try {
      await api.patch(`/users/dashboard-requests/${user._id}`, { action }, token);
      notify.success(
        approved ? t('accessRequests.approveSuccess') : t('accessRequests.rejectSuccess')
      );
      fetchRequests();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || t('accessRequests.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const filters: { key: RequestFilter; label: string }[] = [
    { key: 'pending', label: t('accessRequests.filter.pending') },
    { key: 'approved', label: t('accessRequests.filter.approved') },
    { key: 'rejected', label: t('accessRequests.filter.rejected') },
  ];

  const rowPadding = density === 'compact' ? 'py-2.5' : 'py-3.5';
  const expandedPadding = density === 'compact' ? 'px-4 py-3' : 'px-4 py-4';

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('accessRequests.title')}</h2>
          <p className="page-header-subtitle">{t('accessRequests.subtitle')}</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filter === item.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1 sm:min-w-[16rem] sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('accessRequests.searchPlaceholder')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="input-field w-auto min-w-[9rem] text-sm"
              aria-label={t('accessRequests.sortLabel')}
            >
              <option value="newest">{t('accessRequests.sort.newest')}</option>
              <option value="oldest">{t('accessRequests.sort.oldest')}</option>
              <option value="name">{t('accessRequests.sort.name')}</option>
            </select>

            <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  density === 'comfortable'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={t('accessRequests.density.comfortable')}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('accessRequests.density.comfortable')}</span>
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  density === 'compact'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={t('accessRequests.density.compact')}
              >
                <Rows3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('accessRequests.density.compact')}</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('common.loading')}</p>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">{t('accessRequests.emptyTitle')}</p>
            <p className="mt-1 text-sm text-gray-500">
              {search.trim()
                ? t('accessRequests.emptySearch')
                : t('accessRequests.emptyFilter', {
                    status: t(`accessRequests.filter.${filter}`),
                  })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('accessRequests.col.applicant')}</th>
                  <th className="hidden px-4 py-3 md:table-cell">{t('accessRequests.col.contact')}</th>
                  <th className="hidden px-4 py-3 lg:table-cell">{t('accessRequests.col.submitted')}</th>
                  <th className="px-4 py-3 text-right">{t('accessRequests.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((request) => {
                  const isExpanded = expandedId === request._id;
                  const isProcessing = actionId === request._id;

                  return (
                    <Fragment key={request._id}>
                      <tr className="bg-white hover:bg-gray-50/80">
                        <td className={`px-4 ${rowPadding}`}>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId((current) =>
                                current === request._id ? null : request._id
                              )
                            }
                            className="flex w-full min-w-0 items-start gap-3 text-left"
                          >
                            <span className="mt-0.5 text-gray-400">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-900">{request.name}</span>
                                <StatusPill
                                  status={filter}
                                  label={t(`accessRequests.filter.${filter}`)}
                                />
                              </span>
                              <span className="mt-1 block text-xs text-gray-500 md:hidden">
                                {request.phone || '—'} · {request.email}
                              </span>
                              {request.dashboardRequestNote && !isExpanded && (
                                <span className="mt-1 block truncate text-xs text-gray-500">
                                  {request.dashboardRequestNote}
                                </span>
                              )}
                            </span>
                          </button>
                        </td>
                        <td className={`hidden px-4 text-gray-600 md:table-cell ${rowPadding}`}>
                          <p>{request.phone || '—'}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{request.email}</p>
                        </td>
                        <td className={`hidden px-4 text-gray-600 lg:table-cell ${rowPadding}`}>
                          {formatSubmittedDate(request.createdAt)}
                          {request.dashboardRequestReviewedAt && filter !== 'pending' && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {t('accessRequests.reviewed')}{' '}
                              {formatSubmittedDate(request.dashboardRequestReviewedAt)}
                            </p>
                          )}
                        </td>
                        <td className={`px-4 ${rowPadding}`}>
                          <div className="flex items-center justify-end gap-2">
                            {filter === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => reviewRequest(request, 'approve')}
                                  className="btn-primary inline-flex items-center gap-1 text-xs"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  {isProcessing
                                    ? t('accessRequests.processing')
                                    : t('accessRequests.approve')}
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => reviewRequest(request, 'reject')}
                                  className="btn-secondary inline-flex items-center gap-1 text-xs text-red-600"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  {t('accessRequests.reject')}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedId((current) =>
                                    current === request._id ? null : request._id
                                  )
                                }
                                className="btn-secondary text-xs"
                              >
                                {t('accessRequests.viewDetails')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/70">
                          <td colSpan={4} className={expandedPadding}>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  {t('accessRequests.col.contact')}
                                </p>
                                <p className="mt-1 text-sm text-gray-900">{request.name}</p>
                                <p className="text-sm text-gray-600">{request.email}</p>
                                <p className="text-sm text-gray-600">{request.phone || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  {t('accessRequests.col.submitted')}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                  {formatSubmittedDate(request.createdAt)}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  {t('accessRequests.note')}
                                </p>
                                <p className="mt-1 text-sm text-gray-700">
                                  {request.dashboardRequestNote || t('accessRequests.noNote')}
                                </p>
                              </div>
                              {request.dashboardRequestDocument && (
                                <div className="sm:col-span-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!token) return;
                                      try {
                                        await openRegistrationDocument(request._id, token);
                                      } catch (err: unknown) {
                                        const error = err as { message?: string };
                                        notify.error(error.message || 'Failed to open document');
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    {t('accessRequests.viewDocument')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredRequests.length > 0 && (
          <p className="text-xs text-gray-500">
            {t('accessRequests.resultsCount', { count: filteredRequests.length })}
          </p>
        )}
      </div>
    </div>
  );
}
