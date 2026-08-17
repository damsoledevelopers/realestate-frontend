'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { Inquiry } from '@/lib/types';
import { notify } from '@/lib/notify';
import { INQUIRY_STATUSES, InquiryStatus } from '@/constants/inquiry';
import InquiryStatusBadge from '@/components/inquiries/InquiryStatusBadge';
import { useLocale } from '@/context/LocaleContext';

export default function AdminInquiriesPage() {
  const { token, isSuperAdmin } = useAuth();
  const confirm = useConfirm();
  const { t } = useLocale();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInquiries = useCallback(() => {
    if (!token || !isSuperAdmin) return;
    setLoading(true);
    setLoadError(null);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api
      .get<Inquiry[]>(`/inquiries${query}`, token)
      .then(setInquiries)
      .catch((err) => {
        const message = getApiErrorMessage(err, t('dashboard.inquiries.loadFailed'));
        setLoadError(message);
        notify.error(message);
      })
      .finally(() => setLoading(false));
  }, [token, statusFilter, t, isSuperAdmin]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  if (!isSuperAdmin) {
    return (
      <div className="dashboard-page">
        <div className="card py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.inquiries.title')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('dashboard.inquiries.superAdminOnly')}</p>
          <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
            {t('dashboard.nav.dashboard')}
          </Link>
        </div>
      </div>
    );
  }

  const counts = useMemo(
    () => ({
      new: inquiries.filter((i) => i.status === 'new').length,
    }),
    [inquiries]
  );

  const updateStatus = async (id: string, status: InquiryStatus, silent = false) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const updated = await api.patch<Inquiry>(`/inquiries/${id}/status`, { status }, token);
      setInquiries((prev) => prev.map((i) => (i._id === id ? updated : i)));
      setSelected((prev) => (prev?._id === id ? updated : prev));
      if (!silent) notify.success(t('dashboard.inquiries.statusUpdated', { status }));
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('dashboard.inquiries.statusUpdateFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    const confirmed = await confirm({
      title: t('dashboard.inquiries.deleteTitle'),
      message: t('dashboard.inquiries.deleteMessage'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/inquiries/${id}`, token);
      setInquiries((prev) => prev.filter((i) => i._id !== id));
      setSelected(null);
      notify.success(t('dashboard.inquiries.deleteSuccess'));
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('dashboard.inquiries.deleteFailed')));
    }
  };

  const openInquiry = (inquiry: Inquiry) => {
    setSelected(inquiry);
    if (inquiry.status === 'new') {
      updateStatus(inquiry._id, 'read', true);
    }
  };

  const replyMailto = (inquiry: Inquiry) => {
    const subject = encodeURIComponent(`Re: ${inquiry.subject}`);
    const body = encodeURIComponent(
      `Hi ${inquiry.name},\n\nThank you for your inquiry regarding "${inquiry.subject}".\n\n`
    );
    window.location.href = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
    if (inquiry.status !== 'replied') {
      updateStatus(inquiry._id, 'replied');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.inquiries.title')}</h2>
          <p className="page-header-subtitle">
            {t('dashboard.inquiries.subtitle')}
            {!statusFilter && counts.new > 0 && (
              <span className="ml-2 font-medium text-blue-600">
                {t('dashboard.inquiries.newCount', { count: String(counts.new) })}
              </span>
            )}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-auto sm:min-w-[140px]"
        >
          <option value="">{t('dashboard.inquiries.allStatuses')}</option>
          {INQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`dashboard.inquiries.status.${status}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-500">{loadError}</p>
            <button type="button" onClick={fetchInquiries} className="btn-primary mt-4">
              {t('common.retry')}
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.inquiries.empty')}</p>
        ) : (
          <div className="table-wrap">
            <table className="table-data">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colName')}</th>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colSubject')}</th>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colDate')}</th>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inquiries.map((inq) => (
                  <tr
                    key={inq._id}
                    onClick={() => openInquiry(inq)}
                    className={`cursor-pointer transition hover:bg-gray-50 ${
                      inq.status === 'new' ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{inq.name}</p>
                      <p className="text-xs text-gray-500">{inq.email}</p>
                    </td>
                    <td className="px-4 py-3">{inq.subject}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <InquiryStatusBadge status={inq.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.email}</p>
                {selected.phone && <p className="text-sm text-gray-500">{selected.phone}</p>}
              </div>
              <InquiryStatusBadge status={selected.status} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">{t('dashboard.inquiries.subject')}</dt>
                <dd className="font-medium">{selected.subject}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('dashboard.inquiries.received')}</dt>
                <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('dashboard.inquiries.message')}</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700">
                  {selected.message}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => replyMailto(selected)}
                disabled={actionLoading}
                className="btn-primary text-sm"
              >
                {t('dashboard.inquiries.replyEmail')}
              </button>
              {selected.status !== 'read' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected._id, 'read')}
                  disabled={actionLoading}
                  className="btn-secondary text-sm"
                >
                  {t('dashboard.inquiries.markRead')}
                </button>
              )}
              {selected.status !== 'replied' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected._id, 'replied')}
                  disabled={actionLoading}
                  className="btn-secondary text-sm"
                >
                  {t('dashboard.inquiries.markReplied')}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(selected._id)}
                className="btn-danger text-sm"
              >
                {t('common.delete')}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-secondary ml-auto text-sm"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
