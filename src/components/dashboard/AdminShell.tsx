'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import { DashboardSearchProvider } from '@/context/DashboardSearchContext';
import { useLocale } from '@/context/LocaleContext';

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'dashboard.nav.dashboard',
  '/dashboard/system': 'dashboard.system.title',
  '/dashboard/layouts': 'dashboard.nav.layouts',
  '/dashboard/partners': 'dashboard.nav.partners',
  '/dashboard/documents': 'dashboard.nav.documents',
  '/dashboard/plots': 'dashboard.nav.plots',
  '/dashboard/bookings': 'dashboard.nav.bookings',
  '/dashboard/payments': 'dashboard.nav.payments',
  '/dashboard/pricing': 'dashboard.nav.pricing',
  '/dashboard/estimates': 'dashboard.nav.estimates',
  '/dashboard/billing-profile': 'dashboard.nav.billingProfile',
  '/dashboard/users': 'dashboard.nav.users',
  '/dashboard/access-requests': 'dashboard.nav.accessRequests',
  '/dashboard/activity-log': 'dashboard.nav.activityLog',
  '/dashboard/inquiries': 'dashboard.inquiries.title',
  '/dashboard/cms': 'dashboard.nav.cms',
  '/dashboard/login-history': 'dashboard.nav.loginHistory',
  '/dashboard/profile': 'dashboard.nav.profile',
  '/dashboard/customers': 'dashboard.nav.customers',
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLocale();
  const titleKey = PAGE_TITLE_KEYS[pathname];
  const title = titleKey ? t(titleKey) : t('dashboard.nav.adminFallback');
  const hideNavbarTitle = pathname === '/dashboard/profile';

  return (
    <DashboardSearchProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminNavbar
            onMenuClick={() => setSidebarOpen(true)}
            title={title}
            hideTitle={hideNavbarTitle}
            hideDesktopSearch={pathname === '/dashboard'}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </DashboardSearchProvider>
  );
}
