import useSWR from 'swr';
import { api } from '@/lib/api';
import { Layout } from '@/lib/types';

export type LayoutStatusFilter = 'active' | 'all';

export function useLayouts(
  statusFilter: LayoutStatusFilter = 'active',
  options?: { enabled?: boolean }
) {
  const endpoint = statusFilter === 'all' ? '/layouts?status=all' : '/layouts';
  const enabled = options?.enabled !== false;

  return useSWR<Layout[]>(enabled ? ['layouts', statusFilter] : null, () => api.get<Layout[]>(endpoint), {
    revalidateOnFocus: false,
  });
}
