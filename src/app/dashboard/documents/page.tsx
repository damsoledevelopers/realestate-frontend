'use client';

import { useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { getApiErrorMessage } from '@/lib/api';
import DocumentManager from '@/components/documents/DocumentManager';
import { useManagedLayoutList } from '@/hooks/useManagedLayoutList';

export default function DashboardDocumentsPage() {
  const { t } = useLocale();
  const { data: layouts = [], error, isLoading } = useManagedLayoutList();
  const [layoutFilter, setLayoutFilter] = useState<string | null>(null);
  const fetchError = error ? getApiErrorMessage(error, t('dashboard.documents.loadFailed')) : null;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.documents.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.documents.subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="card">
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        </div>
      ) : fetchError ? (
        <div className="card">
          <p className="text-sm text-red-600">{fetchError}</p>
        </div>
      ) : (
        <DocumentManager
          layouts={layouts}
          layoutFilter={layoutFilter}
          onLayoutFilterChange={setLayoutFilter}
        />
      )}
    </div>
  );
}
