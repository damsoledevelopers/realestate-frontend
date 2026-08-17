'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminShell from '@/components/dashboard/AdminShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireDashboard>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
