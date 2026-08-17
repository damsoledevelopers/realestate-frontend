'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api';
import { LoginHistoryEntry, LoginHistoryListResponse } from '@/lib/types';
import { notify } from '@/lib/notify';
import Pagination from '@/components/ui/Pagination';
import LoginHistoryTable from '@/components/login-history/LoginHistoryTable';

export default function LoginHistoryPage() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const fetchLoginHistory = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);

    api
      .get<LoginHistoryListResponse>(`/login-history?page=${page}&limit=20`, token)
      .then((data) => {
        setEntries(data.entries);
        setPagination(data.pagination);
      })
      .catch((err) => {
        const message = getApiErrorMessage(err, t('dashboard.loginHistory.loadFailed'));
        setLoadError(message);
        notify.error(message);
      })
      .finally(() => setLoading(false));
  }, [token, page, t]);

  useEffect(() => {
    fetchLoginHistory();
  }, [fetchLoginHistory]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.loginHistory.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.loginHistory.subtitle')}</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-500">{loadError}</p>
            <button type="button" onClick={fetchLoginHistory} className="btn-primary mt-4">
              {t('common.retry')}
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.loginHistory.empty')}</p>
        ) : (
          <>
            <LoginHistoryTable entries={entries} />
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
