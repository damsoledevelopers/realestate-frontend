'use client';

import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import UsersManagementView from '@/components/dashboard/UsersManagementView';
import CustomersManagementView from '@/components/customers/CustomersManagementView';

function UsersPageContent() {
  const { isSuperAdmin } = useAuth();

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
