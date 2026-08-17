'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';
import { Plot } from '@/lib/types';
import { fetchPlots } from '@/lib/plots';
import { getApiErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/layoutStats';
import StatusBadge from '@/components/property/StatusBadge';
import ConstructionStatusBadge from '@/components/plots/ConstructionStatusBadge';
import { CONSTRUCTION_STATUSES } from '@/lib/constructionStatusConfig';
import { notify } from '@/lib/notify';

export default function AdminPlotsPage() {
  const { token } = useAuth();
  const { t } = useLocale();
  const { saleStatuses } = usePropertyStatusConfig();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [constructionFilter, setConstructionFilter] = useState('');

  const loadPlots = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    const filters: { status?: string; constructionStatus?: string } = {};
    if (statusFilter) filters.status = statusFilter;
    if (constructionFilter) filters.constructionStatus = constructionFilter;

    fetchPlots(token, filters)
      .then(setPlots)
      .catch((err) => {
        const message = getApiErrorMessage(err, t('dashboard.plots.loadFailed'));
        setLoadError(message);
        notify.error(message);
      })
      .finally(() => setLoading(false));
  }, [token, statusFilter, constructionFilter, t]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  const filterOptions = ['', ...saleStatuses.map((status) => status.key)];
  const constructionFilterOptions = ['', ...CONSTRUCTION_STATUSES.map((status) => status.key)];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.plots.title')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('dashboard.plots.subtitle')}</p>
        </div>
        <Link href="/dashboard/layouts" className="btn-primary text-sm">
          {t('dashboard.plots.manageInLayouts')}
        </Link>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('dashboard.plots.saleStatus')}
          </p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  statusFilter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {s
                  ? saleStatuses.find((status) => status.key === s)?.label ||
                    s.charAt(0).toUpperCase() + s.slice(1)
                  : t('dashboard.plots.all')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('dashboard.plots.constructionStatus')}
          </p>
          <div className="flex flex-wrap gap-2">
            {constructionFilterOptions.map((s) => (
              <button
                key={s || 'all-construction'}
                onClick={() => setConstructionFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  constructionFilter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {s
                  ? CONSTRUCTION_STATUSES.find((status) => status.key === s)?.label || s
                  : t('dashboard.plots.all')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-500">{loadError}</p>
            <button type="button" onClick={loadPlots} className="btn-primary mt-4">
              {t('common.retry')}
            </button>
          </div>
        ) : plots.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.plots.empty')}</p>
        ) : (
          <div className="table-wrap">
            <table className="table-data">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">{t('dashboard.plots.colPlot')}</th>
                  <th className="px-3 py-3">{t('dashboard.plots.colLayout')}</th>
                  <th className="px-3 py-3">{t('dashboard.plots.colSize')}</th>
                  <th className="px-3 py-3">{t('dashboard.plots.colPrice')}</th>
                  <th className="px-3 py-3">{t('dashboard.plots.colFacing')}</th>
                  <th className="px-3 py-3">{t('dashboard.plots.colStatus')}</th>
                  <th className="px-3 py-3">{t('dashboard.plots.colConstruction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plots.map((p) => (
                  <tr key={p._id}>
                    <td className="px-3 py-3 font-medium">{p.plotNumber}</td>
                    <td className="px-3 py-3 text-gray-500">
                      {typeof p.layoutId === 'object' ? p.layoutId?.name : '—'}
                    </td>
                    <td className="px-3 py-3">{p.size}</td>
                    <td className="px-3 py-3">{formatPrice(p.price)}</td>
                    <td className="px-3 py-3">{p.facing || '—'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-3">
                      <ConstructionStatusBadge status={p.constructionStatus} showPattern />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
