'use client';

import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import UsersManagementView from '@/components/dashboard/UsersManagementView';
import CustomersManagementView from '@/components/customers/CustomersManagementView';

function UsersPageContent() {
  const { isSuperAdmin, user } = useAuth();

  if (user?.role === 'dashboard_admin' || user?.role === 'admin') {
    return <div className="dashboard-page"><p className="text-sm text-gray-600">You do not have access to User Management.</p></div>;
  }

  if (isSuperAdmin) {
    return <UsersManagementView />;
  }

  return <CustomersManagementView />;
}

export default function DashboardUsersPage() {
  return (
    <Suspense fallback={<div className="dashboard-page text-sm text-gray-400">Loading...</div>}>
      <UsersPageContent />
    </Suspense>
  );
}
