'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Building2,
  Grid3x3,
  IndianRupee,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { useAdminStats } from '@/hooks/useAdminStats';
import DashboardStatGrid from '@/components/dashboard/DashboardStatGrid';

const ADMIN_LINKS = [
  {
    href: '/dashboard/users',
    labelKey: 'dashboard.system.link.users',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/dashboard/access-requests',
    labelKey: 'dashboard.system.link.accessRequests',
    icon: ShieldCheck,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/dashboard/layouts',
    labelKey: 'dashboard.system.link.layouts',
    icon: Building2,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    href: '/dashboard/plots',
    labelKey: 'dashboard.system.link.plots',
    icon: Grid3x3,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    href: '/dashboard/payments',
    labelKey: 'dashboard.system.link.payments',
    icon: IndianRupee,
    color: 'bg-teal-50 text-teal-600',
  },
  {
    href: '/dashboard/settings',
    labelKey: 'dashboard.system.link.settings',
    icon: Settings,
    color: 'bg-gray-100 text-gray-600',
  },
];

export default function SystemAdminView() {
  const { t } = useLocale();
  const { data: stats, error, isLoading, mutate } = useAdminStats();

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-500">{t('dashboard.system.loadFailed')}</p>
          <button type="button" onClick={() => mutate()} className="btn-primary mt-4">
            {t('dashboard.startup.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page space-y-8">
      <div className="page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            {t('dashboard.system.badge')}
          </p>
          <h2 className="page-header-title">{t('dashboard.system.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.system.subtitle')}</p>
        </div>
        <Link href="/dashboard/activity-log" className="btn-secondary w-full sm:w-auto">
          <Activity className="mr-2 inline h-4 w-4" />
          {t('dashboard.system.viewActivityLog')}
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.system.platformStats')}</h2>
        <div className="mt-4">
          <DashboardStatGrid stats={stats} loading={isLoading} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.system.quickActions')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ADMIN_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group card transition hover:border-primary-200 hover:shadow-md"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{t(item.labelKey)}</p>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {stats && (stats.recentBookings.length > 0 || stats.recentUsers.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {stats.recentUsers.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900">{t('dashboard.system.recentUsers')}</h3>
              <ul className="mt-4 space-y-2">
                {stats.recentUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(user.date).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {stats.recentBookings.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900">{t('dashboard.system.recentBookings')}</h3>
              <ul className="mt-4 space-y-2">
                {stats.recentBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {booking.userName} — Plot {booking.plotNumber}
                      </p>
                      <p className="text-xs text-gray-500">{booking.layoutName}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                      {booking.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
