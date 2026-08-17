'use client';

import DashboardProfilePage from '@/components/profile/dashboard/DashboardProfilePage';

interface ProfilePageContentProps {
  inDashboard?: boolean;
}

export default function ProfilePageContent({ inDashboard = false }: ProfilePageContentProps) {
  return <DashboardProfilePage variant={inDashboard ? 'dashboard' : 'customer'} />;
}
