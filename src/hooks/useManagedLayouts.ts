import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { fetchManagedLayouts, ManagedLayoutFilters } from '@/lib/layouts';
import { ManagedLayoutsResponse } from '@/lib/types';

export function useManagedLayouts(filters: ManagedLayoutFilters = {}) {
  const { token } = useAuth();
  const key = token
    ? [
        'managed-layouts',
        token,
        filters.page,
        filters.limit,
        filters.search,
        filters.location,
        filters.status,
        filters.sortBy,
      ]
    : null;

  return useSWR<ManagedLayoutsResponse>(
    key,
    () => fetchManagedLayouts(token!, filters),
    { keepPreviousData: true, revalidateOnFocus: false }
  );
}
