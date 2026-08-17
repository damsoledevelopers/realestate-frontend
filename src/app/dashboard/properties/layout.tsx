'use client';

import SuperAdminRoute from '@/components/auth/SuperAdminRoute';

export default function DashboardPropertiesLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminRoute>{children}</SuperAdminRoute>;
}
