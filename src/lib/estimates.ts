import { api } from '@/lib/api';
import type {
  EstimateDiscountType,
  EstimateLineItem,
  EstimateRecord,
  EstimateStatus,
  EstimatesListResponse,
} from '@/lib/types';

export interface CreateEstimatePayload {
  layoutId: string;
  bookingId?: string;
  plotId?: string;
  propertyId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  lineItems: EstimateLineItem[];
  discountType?: EstimateDiscountType;
  discountValue?: number;
  taxRate?: number;
  validUntil?: string;
  status?: EstimateStatus;
  notes?: string;
  terms?: string;
}

export interface UpdateEstimatePayload {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  lineItems?: EstimateLineItem[];
  discountType?: EstimateDiscountType;
  discountValue?: number;
  taxRate?: number;
  validUntil?: string | null;
  status?: EstimateStatus;
  notes?: string;
  terms?: string;
}

export function fetchEstimates(
  token: string,
  params: { page?: number; limit?: number; layoutId?: string; bookingId?: string; status?: string } = {}
) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.layoutId) search.set('layoutId', params.layoutId);
  if (params.bookingId) search.set('bookingId', params.bookingId);
  if (params.status) search.set('status', params.status);
  const query = search.toString();
  return api.get<EstimatesListResponse>(`/estimates${query ? `?${query}` : ''}`, token);
}

export function fetchEstimate(id: string, token: string) {
  return api.get<EstimateRecord>(`/estimates/${id}`, token);
}

export function createEstimate(payload: CreateEstimatePayload, token: string) {
  return api.post<EstimateRecord>('/estimates', payload, token);
}

export function updateEstimate(id: string, payload: UpdateEstimatePayload, token: string) {
  return api.patch<EstimateRecord>(`/estimates/${id}`, payload, token);
}

export function deleteEstimate(id: string, token: string) {
  return api.delete(`/estimates/${id}`, token);
}

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const DISCOUNT_TYPE_LABELS: Record<EstimateDiscountType, string> = {
  none: 'No discount',
  percent: 'Percentage',
  fixed: 'Fixed amount',
};

export function calculateEstimatePreview(
  lineItems: EstimateLineItem[],
  discountType: EstimateDiscountType = 'none',
  discountValue = 0,
  taxRate = 0
) {
  const normalized = lineItems.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const amount = quantity * unitPrice;
    return { ...item, quantity, unitPrice, amount };
  });

  const subtotal = normalized.reduce((sum, item) => sum + item.amount, 0);
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (subtotal * Math.min(Number(discountValue) || 0, 100)) / 100;
  } else if (discountType === 'fixed') {
    discountAmount = Math.min(Number(discountValue) || 0, subtotal);
  }
  const taxable = Math.max(subtotal - discountAmount, 0);
  const taxAmount = (taxable * (Number(taxRate) || 0)) / 100;
  const total = taxable + taxAmount;

  return { lineItems: normalized, subtotal, discountAmount, taxAmount, total };
}
