'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { Booking } from '@/lib/types';
import { useManagedLayoutList } from '@/hooks/useManagedLayoutList';
import StatusBadge from '@/components/bookings/StatusBadge';
import ConstructionStatusBadge from '@/components/plots/ConstructionStatusBadge';
import ResponsiveTable, { MobileDataCard, MobileDataRow } from '@/components/ui/ResponsiveTable';
import { notify } from '@/lib/notify';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName } from '@/lib/localizedText';

export default function AdminBookingsPage() {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [layoutFilter, setLayoutFilter] = useState('');
  const { data: layouts = [] } = useManagedLayoutList();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectNote, setBulkRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (layoutFilter) params.set('layoutId', layoutFilter);
    const query = params.toString() ? `?${params.toString()}` : '';

    api
      .get<Booking[]>(`/bookings${query}`, token)
      .then((data) => {
        setBookings(data);
        setSelected(new Set());
      })
      .catch((err) => {
        const message = getApiErrorMessage(err, t('dashboard.bookings.loadFailed'));
        setLoadError(message);
        notify.error(message);
      })
      .finally(() => setLoading(false));
  }, [token, statusFilter, layoutFilter, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const pendingIds = pendingBookings.map((b) => b._id);
  const allPendingSelected =
    pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${id}/approve`, {}, token);
      notify.success(t('dashboard.bookings.approveSuccess'));
      fetchBookings();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('dashboard.bookings.actionFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectId || !rejectNote.trim()) {
      notify.error(t('dashboard.bookings.rejectReasonRequired'));
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${rejectId}/reject`, { adminNote: rejectNote }, token);
      notify.success(t('dashboard.bookings.rejectSuccess'));
      setRejectId(null);
      setRejectNote('');
      fetchBookings();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('dashboard.bookings.actionFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulk = async (action: 'approve' | 'reject', note?: string) => {
    if (!token || selected.size === 0) return;
    if (action === 'reject' && !note?.trim()) {
      notify.error(t('dashboard.bookings.rejectReasonRequired'));
      return;
    }

    setActionLoading(true);
    try {
      const result = await api.patch<{ processed: string[]; failed: { id: string; reason: string }[] }>(
        '/bookings/bulk-status',
        { ids: Array.from(selected), action, adminNote: note },
        token
      );
      const count = result.processed?.length ?? 0;
      const failCount = result.failed?.length ?? 0;
      if (count > 0) notify.success(t('dashboard.bookings.processed', { count: String(count) }));
      if (failCount > 0) notify.error(t('dashboard.bookings.bulkFailed', { count: String(failCount) }));
      setBulkRejectOpen(false);
      setBulkRejectNote('');
      fetchBookings();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('dashboard.bookings.bulkActionFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div>
        <h2 className="page-header-title">{t('dashboard.bookings.title')}</h2>
        <p className="page-header-subtitle">{t('dashboard.bookings.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-auto sm:min-w-[140px]"
        >
          <option value="">{t('dashboard.bookings.allStatuses')}</option>
          <option value="pending">{t('dashboard.bookings.status.pending')}</option>
          <option value="approved">{t('dashboard.bookings.status.approved')}</option>
          <option value="rejected">{t('dashboard.bookings.status.rejected')}</option>
        </select>
        <select
          value={layoutFilter}
          onChange={(e) => setLayoutFilter(e.target.value)}
          className="input-field w-full sm:w-auto sm:min-w-[180px]"
        >
          <option value="">{t('dashboard.bookings.allLayouts')}</option>
          {layouts.map((l) => (
            <option key={l._id} value={l._id}>
              {getLayoutDisplayName(l, locale)}
            </option>
          ))}
        </select>

        {selected.size > 0 && (
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <span className="self-center text-sm text-gray-500">
              {t('dashboard.bookings.selected', { count: String(selected.size) })}
            </span>
            <button
              type="button"
              onClick={() => handleBulk('approve')}
              disabled={actionLoading}
              className="btn-primary text-xs"
            >
              {t('dashboard.bookings.bulkApprove')}
            </button>
            <button
              type="button"
              onClick={() => setBulkRejectOpen(true)}
              disabled={actionLoading}
              className="btn-danger text-xs"
            >
              {t('dashboard.bookings.bulkReject')}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-500">{loadError}</p>
            <button type="button" onClick={fetchBookings} className="btn-primary mt-4">
              {t('common.retry')}
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.bookings.empty')}</p>
        ) : (
          <ResponsiveTable
            mobile={bookings.map((b) => (
              <MobileDataCard key={b._id}>
                <div className="mb-3 flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.fullName}</p>
                    <p className="text-xs text-gray-500">{b.email}</p>
                  </div>
                  {b.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selected.has(b._id)}
                      onChange={() => toggleOne(b._id)}
                      aria-label={`Select booking ${b._id}`}
                      className="mt-1 shrink-0"
                    />
                  )}
                </div>
                <MobileDataRow label={t('dashboard.bookings.colPlot')}>{b.plot?.plotNumber}</MobileDataRow>
                <MobileDataRow label={t('dashboard.bookings.colConstruction')}>
                  <ConstructionStatusBadge status={b.plot?.constructionStatus} showPattern />
                </MobileDataRow>
                <MobileDataRow label={t('dashboard.bookings.colLayout')}>
                  {b.layout ? getLayoutDisplayName(b.layout, locale) : '—'}
                </MobileDataRow>
                <MobileDataRow label={t('dashboard.bookings.colDate')}>
                  {new Date(b.createdAt).toLocaleDateString()}
                </MobileDataRow>
                <MobileDataRow label={t('dashboard.bookings.colStatus')}>
                  <StatusBadge status={b.status} />
                </MobileDataRow>
                {b.status === 'pending' && (
                  <MobileDataRow label={t('dashboard.bookings.colActions')} align="start">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(b._id)}
                        disabled={actionLoading}
                        className="btn-primary text-xs"
                      >
                        {t('dashboard.bookings.approve')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectId(b._id);
                          setRejectNote('');
                        }}
                        disabled={actionLoading}
                        className="btn-danger text-xs"
                      >
                        {t('dashboard.bookings.reject')}
                      </button>
                    </div>
                  </MobileDataRow>
                )}
                {b.status === 'rejected' && b.adminNote && (
                  <MobileDataRow label={t('dashboard.bookings.colActions')} align="start">
                    <p className="text-xs text-gray-500">
                      {t('dashboard.bookings.reason', { note: b.adminNote })}
                    </p>
                  </MobileDataRow>
                )}
              </MobileDataCard>
            ))}
          >
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleAll}
                    disabled={pendingIds.length === 0}
                    aria-label={t('dashboard.bookings.selectAllPending')}
                  />
                </th>
                <th className="px-3 py-3">{t('dashboard.bookings.colUser')}</th>
                <th className="px-3 py-3">{t('dashboard.bookings.colPlot')}</th>
                <th className="px-3 py-3">{t('dashboard.bookings.colConstruction')}</th>
                <th className="px-3 py-3">{t('dashboard.bookings.colLayout')}</th>
                <th className="px-3 py-3">{t('dashboard.bookings.colDate')}</th>
                <th className="px-3 py-3">{t('dashboard.bookings.colStatus')}</th>
                <th className="px-3 py-3">{t('dashboard.bookings.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className="px-3 py-3">
                    {b.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selected.has(b._id)}
                        onChange={() => toggleOne(b._id)}
                        aria-label={`Select booking ${b._id}`}
                      />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{b.fullName}</p>
                    <p className="text-xs text-gray-500">{b.email}</p>
                  </td>
                  <td className="px-3 py-3">{b.plot?.plotNumber}</td>
                  <td className="px-3 py-3">
                    <ConstructionStatusBadge status={b.plot?.constructionStatus} showPattern />
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {b.layout ? getLayoutDisplayName(b.layout, locale) : '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-3 py-3">
                    {b.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(b._id)}
                          disabled={actionLoading}
                          className="btn-primary text-xs"
                        >
                          {t('dashboard.bookings.approve')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectId(b._id);
                            setRejectNote('');
                          }}
                          disabled={actionLoading}
                          className="btn-danger text-xs"
                        >
                          {t('dashboard.bookings.reject')}
                        </button>
                      </div>
                    )}
                    {b.status === 'rejected' && b.adminNote && (
                      <p className="text-xs text-gray-500">
                        {t('dashboard.bookings.reason', { note: b.adminNote })}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </div>

      {rejectId && (
        <div className="modal-overlay">
          <div className="modal-panel-md">
            <h3 className="text-lg font-semibold">{t('dashboard.bookings.rejectTitle')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('dashboard.bookings.rejectHint')}</p>
            <textarea
              className="input-field mt-4"
              rows={4}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('dashboard.bookings.rejectPlaceholder')}
              required
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="btn-danger flex-1"
              >
                {actionLoading ? t('dashboard.bookings.rejecting') : t('dashboard.bookings.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkRejectOpen && (
        <div className="modal-overlay">
          <div className="modal-panel-md">
            <h3 className="text-lg font-semibold">
              {t('dashboard.bookings.bulkRejectTitle', { count: String(selected.size) })}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{t('dashboard.bookings.bulkRejectHint')}</p>
            <textarea
              className="input-field mt-4"
              rows={4}
              value={bulkRejectNote}
              onChange={(e) => setBulkRejectNote(e.target.value)}
              placeholder={t('dashboard.bookings.rejectPlaceholder')}
              required
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setBulkRejectOpen(false);
                  setBulkRejectNote('');
                }}
                className="btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleBulk('reject', bulkRejectNote)}
                disabled={actionLoading}
                className="btn-danger flex-1"
              >
                {actionLoading ? t('dashboard.bookings.rejecting') : t('dashboard.bookings.confirmBulkReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
