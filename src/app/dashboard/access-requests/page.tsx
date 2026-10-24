'use client';

import { useAuth } from '@/context/AuthContext';
import DashboardAccessRequestsPanel from '@/components/dashboard/DashboardAccessRequestsPanel';

export default function DashboardAccessRequestsPage() {
  const { user } = useAuth();
  if (user?.role !== 'super_admin') return <div className="dashboard-page"><p className="text-sm text-gray-600">You do not have access to verification requests.</p></div>;
  return <DashboardAccessRequestsPanel />;
}
