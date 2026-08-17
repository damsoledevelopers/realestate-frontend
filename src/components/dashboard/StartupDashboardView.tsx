'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useStartupDashboard } from '@/hooks/useStartupDashboard';
import DashboardGlobalSearch from '@/components/dashboard/DashboardGlobalSearch';
import QuickAccessGrid from '@/components/dashboard/QuickAccessGrid';
import RecentActivityPanel from '@/components/dashboard/RecentActivityPanel';
import StartupStatGrid from '@/components/dashboard/StartupStatGrid';

export default function StartupDashboardView() {
  const { t } = useLocale();
  const { isSuperAdmin } = useAuth();
  const { data, error, isLoading, mutate } = useStartupDashboard();

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-500">{t('dashboard.startup.error')}</p>
          <button onClick={() => mutate()} className="btn-primary mt-4">
            {t('dashboard.startup.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page space-y-8">
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            {t('home.startupBadge')}
          </p>
          <h2 className="page-header-title">{t('dashboard.startup.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.startup.subtitle')}</p>
          <p className="mt-2 text-sm text-gray-500">
            {isSuperAdmin
              ? t('dashboard.startup.scope.superAdmin')
              : t('dashboard.startup.scope.manager')}
          </p>
        </div>
        <Link href="/dashboard/layouts" className="btn-primary w-full sm:w-auto">
          {t('dashboard.startup.manageLayouts')}
        </Link>
        {isSuperAdmin && (
          <Link href="/dashboard/system" className="btn-secondary w-full sm:w-auto">
            {t('dashboard.nav.system')}
          </Link>
        )}
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.search.title')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('dashboard.search.subtitle')}</p>
        <p className="mt-2 text-xs text-gray-400">{t('dashboard.search.hint')}</p>
        <div className="mt-4">
          <DashboardGlobalSearch variant="page" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.startup.overview')}</h2>
        <div className="mt-4">
          <StartupStatGrid summary={data?.summary} loading={isLoading} />
        </div>
      </section>

      <QuickAccessGrid />

      <RecentActivityPanel
        recentlyUpdatedLayouts={data?.recentActivity.recentlyUpdatedLayouts ?? []}
        recentlyBookedSoldPlots={data?.recentActivity.recentlyBookedSoldPlots ?? []}
        recentlyAddedLayouts={data?.recentActivity.recentlyAddedLayouts ?? []}
        loading={isLoading}
      />
    </div>
  );
}
