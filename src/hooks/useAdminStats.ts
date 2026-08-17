import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { DashboardStats } from '@/lib/types';

export function useAdminStats() {
  const { token } = useAuth();

  return useSWR<DashboardStats>(
    token ? ['admin-stats', token] : null,
    () => api.get<DashboardStats>('/dashboard/stats', token),
    { revalidateOnFocus: false }
  );
}
