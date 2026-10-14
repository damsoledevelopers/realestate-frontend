'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardInquiriesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireDashboard>{children}</ProtectedRoute>;
}
