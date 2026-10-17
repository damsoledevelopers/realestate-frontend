'use client';

import Link from 'next/link';
import StartupDashboardView from '@/components/dashboard/StartupDashboardView';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

export default function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const { t } = useLocale();

  // Partners have access to their assigned layouts only.
  if (user?.role === 'partner' && !isSuperAdmin) {
    return (
      <div className="dashboard-page min-w-0">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Partner Portal</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Your Assigned Layouts</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">You can access only layouts assigned to your partner account. Other layouts and administration settings are not available.</p>
          <Link href="/dashboard/layouts" className="btn-primary mt-6 inline-flex">View Assigned Layouts</Link>
        </div>
      </div>
    );
  }

  // Enquiry-only staff get a lightweight dashboard, never the full management overview.
  if (user?.role === 'admin' && !isSuperAdmin) {
    return (
      <div className="dashboard-page min-w-0">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">{t('dashboard.dashboard.badge')}</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">{t('dashboard.dashboard.title')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{t('dashboard.dashboard.description')}</p>
          <Link href="/dashboard/inquiries" className="btn-primary mt-6 inline-flex">{t('dashboard.dashboard.openEnquiries')}</Link>
        </div>
      </div>
    );
  }

  return <StartupDashboardView />;
}
