'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { api } from '@/lib/api';
import { ActivityLogResponse } from '@/lib/types';
import { notify } from '@/lib/notify';
import Pagination from '@/components/ui/Pagination';

const ACTIVITY_TYPES = [
  '',
  'admin',
  'user',
  'layout',
  'plot',
  'booking',
  'payment',
  'customer',
  'document',
  'property',
  'pricing',
  'external_link',
];

export default function ActivityLogView() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [activities, setActivities] = useState<ActivityLogResponse['activities']>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchActivities = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (type) params.set('type', type);
    if (search) params.set('search', search);

    api
      .get<ActivityLogResponse>(`/admin/activities?${params.toString()}`, token)
      .then((data) => {
        setActivities(data.activities);
        setPagination(data.pagination);
      })
      .catch(() => notify.error(t('dashboard.activityLog.loadFailed')))
      .finally(() => setLoading(false));
  }, [token, page, type, search, t]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.activityLog.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.activityLog.subtitle')}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('dashboard.activityLog.searchPlaceholder')}
          className="input-field w-full sm:max-w-xs"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="input-field w-full sm:w-auto"
        >
          <option value="">{t('dashboard.activityLog.allTypes')}</option>
          {ACTIVITY_TYPES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.activityLog.empty')}</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-data">
                <thead className="border-b text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">{t('dashboard.activityLog.colTime')}</th>
                    <th className="px-4 py-3">{t('dashboard.activityLog.colType')}</th>
                    <th className="px-4 py-3">{t('dashboard.activityLog.colMessage')}</th>
                    <th className="px-4 py-3">{t('dashboard.activityLog.colActor')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activities.map((entry) => (
                    <tr key={entry.id} className="bg-white">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
                          {entry.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{entry.message}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.user ? (
                          <div>
                            <p className="font-medium">{entry.user.name}</p>
                            <p className="text-xs text-gray-500">{entry.user.email}</p>
                          </div>
                        ) : (
                          '—'
                        )}
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
    </div>
  );
}
