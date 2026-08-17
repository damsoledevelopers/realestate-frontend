import { api } from '@/lib/api';
import {
  Layout,
  LayoutAdminDetail,
  LayoutListPagination,
  ManagedLayoutsResponse,
} from '@/lib/types';
import { LayoutSortOption } from '@/lib/layoutFilters';

export interface ManagedLayoutFilters {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  status?: 'all' | 'active' | 'inactive';
  sortBy?: LayoutSortOption | 'updated' | 'plots';
}

function buildManagedLayoutQuery(filters?: ManagedLayoutFilters): string {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.search?.trim()) params.set('search', filters.search.trim());
  if (filters?.location?.trim()) params.set('location', filters.location.trim());
  if (filters?.status) params.set('status', filters.status);
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function fetchManagedLayouts(
  token: string,
  filters?: ManagedLayoutFilters
): Promise<ManagedLayoutsResponse> {
  return api.get<ManagedLayoutsResponse>(`/layouts/admin/all${buildManagedLayoutQuery(filters)}`, token);
}

/** Flat list helper for pages that only need layout options. */
export async function fetchManagedLayoutList(
  token: string,
  filters?: Omit<ManagedLayoutFilters, 'page' | 'limit'>
): Promise<Layout[]> {
  const response = await fetchManagedLayouts(token, { ...filters, page: 1, limit: 100 });
  return response.layouts;
}

export function fetchLayoutAdminDetail(
  layoutId: string,
  token: string
): Promise<LayoutAdminDetail> {
  return api.get<LayoutAdminDetail>(`/layouts/admin/${layoutId}`, token);
}

export type { LayoutListPagination, ManagedLayoutsResponse };
