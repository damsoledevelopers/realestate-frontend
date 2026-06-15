'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserShell from '@/components/user-dashboard/UserShell';

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireUser>
      <UserShell>{children}</UserShell>
    </ProtectedRoute>
  );
}
