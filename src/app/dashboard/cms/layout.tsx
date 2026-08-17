'use client';

import SuperAdminRoute from '@/components/auth/SuperAdminRoute';

export default function DashboardCmsLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminRoute>{children}</SuperAdminRoute>;
}
