import { api } from '@/lib/api';
import { Plot } from '@/lib/types';
import { ConstructionStatus } from '@/lib/constructionStatusConfig';

export interface PlotListFilters {
  layoutId?: string;
  status?: string;
  constructionStatus?: ConstructionStatus | string;
}

function buildPlotQuery(filters?: PlotListFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();
  if (filters.layoutId) params.set('layoutId', filters.layoutId);
  if (filters.status) params.set('status', filters.status);
  if (filters.constructionStatus) params.set('constructionStatus', filters.constructionStatus);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function fetchPlots(token: string, filters?: PlotListFilters): Promise<Plot[]> {
  return api.get<Plot[]>(`/plots${buildPlotQuery(filters)}`, token);
}

export function createPlot(
  body: Record<string, unknown> & { layoutId: string },
  token: string,
  qrImage?: File | null
): Promise<Plot> {
  if (qrImage) {
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    formData.append('qrImage', qrImage);
    return api.postForm<Plot>('/plots', formData, token);
  }
  return api.post<Plot>('/plots', body, token);
}

export function updatePlotConstructionStatus(
  plotId: string,
  constructionStatus: ConstructionStatus,
  token: string
): Promise<Plot> {
  return api.patch<Plot>(`/plots/${plotId}/construction-status`, { constructionStatus }, token);
}

export function updatePlotSaleStatus(
  plotId: string,
  status: string,
  token: string,
  options?: { confirmSold?: boolean }
): Promise<Plot> {
  return api.patch<Plot>(
    `/plots/${plotId}/status`,
    { status, confirmSold: options?.confirmSold || undefined },
    token
  );
}
