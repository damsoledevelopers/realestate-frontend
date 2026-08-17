import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { fetchStartupDashboard } from '@/lib/dashboard';
import { StartupDashboardData } from '@/lib/types';

export function useStartupDashboard() {
  const { token } = useAuth();

  return useSWR<StartupDashboardData>(
    token ? ['startup-dashboard', token] : null,
    () => fetchStartupDashboard(token!),
    { revalidateOnFocus: false }
  );
}
