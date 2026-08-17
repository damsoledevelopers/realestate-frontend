'use client';

import SuperAdminRoute from '@/components/auth/SuperAdminRoute';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminRoute>{children}</SuperAdminRoute>;
}
