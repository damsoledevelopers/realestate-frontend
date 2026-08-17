import { api } from '@/lib/api';
import {
  DashboardSearchEntityType,
  DashboardSearchResponse,
  StartupDashboardData,
} from '@/lib/types';

export function fetchStartupDashboard(token: string) {
  return api.get<StartupDashboardData>('/dashboard/startup', token);
}

export function searchDashboard(
  token: string,
  params: { q?: string; type?: DashboardSearchEntityType; page?: number; limit?: number }
) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set('q', params.q.trim());
  if (params.type) searchParams.set('type', params.type);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  return api.get<DashboardSearchResponse>(`/dashboard/search?${searchParams.toString()}`, token);
}

export function getDashboardSearchHref(result: {
  type: DashboardSearchEntityType;
  id: string;
  layoutId: string;
}): string {
  if (result.type === 'layout') {
    return `/dashboard/layouts/${result.id}`;
  }
  if (result.type === 'plot') {
    return result.layoutId ? `/dashboard/layouts/${result.layoutId}` : '/dashboard/plots';
  }
  if (result.type === 'farm') return '/dashboard/farms';
  if (result.type === 'land') return '/dashboard/lands';
  return result.layoutId ? `/dashboard/layouts/${result.layoutId}` : '/dashboard/layouts';
}
