'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { fetchEstimates, ESTIMATE_STATUS_LABELS } from '@/lib/estimates';
import type { EstimateRecord } from '@/lib/types';
import Pagination from '@/components/ui/Pagination';
import EstimatePreviewModal from '@/components/estimates/EstimatePreviewModal';
import { formatCurrency } from '@/lib/formatLocale';
import { Eye } from 'lucide-react';

export default function DashboardEstimatesPage() {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeEstimate, setActiveEstimate] = useState<EstimateRecord | null>(null);

  const loadEstimates = () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    fetchEstimates(token, { page, limit: 20, status: statusFilter || undefined })
      .then((data) => {
        setEstimates(data.estimates);
        setPagination(data.pagination);
      })
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err, t('estimates.loadFailed'));
        setLoadError(message);
        notify.error(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEstimates();
  }, [token, page, statusFilter, t]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('estimates.pageTitle')}</h2>
          <p className="page-header-subtitle">{t('estimates.pageSubtitle')}</p>
        </div>
      </div>

      <div className="card mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-600">{t('estimates.filterStatus')}</label>
        <select
          className="input-field max-w-xs"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('estimates.allStatuses')}</option>
          {Object.entries(ESTIMATE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">{t('common.loading')}</p>
        ) : loadError ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-500">{loadError}</p>
            <button type="button" onClick={loadEstimates} className="btn-primary mt-4">
              {t('common.retry')}
            </button>
          </div>
        ) : estimates.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">{t('estimates.emptyList')}</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-data">
                <thead className="border-b text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">{t('estimates.number')}</th>
                    <th className="px-3 py-3">{t('estimates.customer')}</th>
                    <th className="px-3 py-3">{t('estimates.property')}</th>
                    <th className="px-3 py-3">{t('estimates.date')}</th>
                    <th className="px-3 py-3">{t('estimates.total')}</th>
                    <th className="px-3 py-3">{t('estimates.status')}</th>
                    <th className="px-3 py-3">{t('estimates.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {estimates.map((estimate) => (
                    <tr key={estimate._id}>
                      <td className="px-3 py-3 font-mono text-xs">{estimate.estimateNumber}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{estimate.customerName}</p>
                        <p className="text-xs text-gray-500">{estimate.customerPhone}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <p>{estimate.propertyLabel || estimate.layout?.name || '—'}</p>
                        <p className="text-xs text-gray-500">{estimate.layout?.location || ''}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">{new Date(estimate.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3 font-medium">{formatCurrency(estimate.total, locale)}</td>
                      <td className="px-3 py-3 text-sm capitalize">{ESTIMATE_STATUS_LABELS[estimate.status]}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setActiveEstimate(estimate)}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t('estimates.preview')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          </>
        )}
      </div>

      {activeEstimate && (
        <EstimatePreviewModal
          estimate={activeEstimate}
          onClose={() => setActiveEstimate(null)}
          onUpdated={() => {
            setActiveEstimate(null);
            loadEstimates();
          }}
        />
      )}
    </div>
  );
}
