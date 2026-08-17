import { api } from '@/lib/api';
import type { PricingEntityType, PriceHistoryEntry, PriceUpdateReason } from '@/lib/types';

export const PRICE_UPDATE_REASON_LABELS: Record<PriceUpdateReason, string> = {
  market_value: 'Market Value',
  location: 'Location',
  customer_requirements: 'Customer Requirements',
  manual: 'Manual Update',
};

export interface PricingEntitySummary {
  entityType: PricingEntityType;
  entityId: string;
  entityName: string;
  layoutId?: string | null;
  layoutName?: string;
  price: number | null;
  location?: string;
}

export interface PricingListResponse {
  items: PricingEntitySummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdatePropertyPricePayload {
  price: number | null;
  updateReason: PriceUpdateReason;
  notes?: string;
}

export interface PriceHistoryResponse {
  history: PriceHistoryEntry[];
}

export function fetchPricingEntities(
  token: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    entityType?: PricingEntityType;
  } = {}
) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.search) search.set('search', params.search);
  if (params.entityType) search.set('entityType', params.entityType);
  const query = search.toString();
  return api.get<PricingListResponse>(`/property-pricing${query ? `?${query}` : ''}`, token);
}

export function fetchPriceHistory(
  entityType: PricingEntityType,
  entityId: string,
  token: string,
  limit = 20
) {
  return api.get<PriceHistoryResponse>(
    `/property-pricing/${entityType}/${entityId}/history?limit=${limit}`,
    token
  );
}

export function updatePropertyPrice(
  entityType: PricingEntityType,
  entityId: string,
  payload: UpdatePropertyPricePayload,
  token: string
) {
  return api.patch<{ changed: boolean; previousPrice: number | null; newPrice: number | null }>(
    `/property-pricing/${entityType}/${entityId}`,
    payload,
    token
  );
}
