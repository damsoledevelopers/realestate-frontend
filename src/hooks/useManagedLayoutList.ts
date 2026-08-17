import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { fetchManagedLayoutList } from '@/lib/layouts';
import { Layout } from '@/lib/types';

export function useManagedLayoutList() {
  const { token } = useAuth();

  return useSWR<Layout[]>(
    token ? ['managed-layout-list', token] : null,
    () => fetchManagedLayoutList(token!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    }
  );
}
