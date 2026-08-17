import { api } from '@/lib/api';
import type {
  BuyerCategory,
  CustomerDetailResponse,
  CustomerKycStatus,
  CustomerRecord,
  CustomerStatus,
  CustomersListResponse,
} from '@/lib/types';

export interface CreateCustomerPayload {
  buyerCategory: BuyerCategory;
  name: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  kycStatus?: CustomerKycStatus;
  pan?: string;
  aadhaarLast4?: string;
  gstNumber?: string;
  kycNotes?: string;
  notes?: string;
  primaryLayoutId: string;
  plotId?: string;
  propertyId?: string;
  bookingId?: string;
  tags?: string[];
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {}

export function fetchCustomers(
  token: string,
  params: {
    page?: number;
    limit?: number;
    layoutId?: string;
    status?: CustomerStatus | '';
    buyerCategory?: BuyerCategory | '';
    kycStatus?: CustomerKycStatus | '';
    search?: string;
  } = {}
) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.layoutId) search.set('layoutId', params.layoutId);
  if (params.status) search.set('status', params.status);
  if (params.buyerCategory) search.set('buyerCategory', params.buyerCategory);
  if (params.kycStatus) search.set('kycStatus', params.kycStatus);
  if (params.search?.trim()) search.set('search', params.search.trim());
  const query = search.toString();
  return api.get<CustomersListResponse>(`/customers${query ? `?${query}` : ''}`, token);
}

export function fetchCustomer(id: string, token: string) {
  return api.get<CustomerDetailResponse>(`/customers/${id}`, token);
}

export function createCustomer(payload: CreateCustomerPayload, token: string) {
  return api.post<CustomerRecord>('/customers', payload, token);
}

export function updateCustomer(id: string, payload: UpdateCustomerPayload, token: string) {
  return api.patch<CustomerRecord>(`/customers/${id}`, payload, token);
}

export function archiveCustomer(id: string, token: string, archiveReason = '') {
  return api.post<CustomerRecord>(`/customers/${id}/archive`, { archiveReason }, token);
}

export function uploadCustomerDocument(
  customerId: string,
  formData: FormData,
  token: string
) {
  return api.postForm(`/customers/${customerId}/documents`, formData, token);
}

export const BUYER_CATEGORY_LABELS: Record<BuyerCategory, string> = {
  plot_buyer: 'Plot Buyer',
  farm_buyer: 'Farm Buyer',
  land_buyer: 'Land Buyer',
  row_house_buyer: 'Row House Buyer',
  bungalow_buyer: 'Bungalow Buyer',
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Active',
  archived: 'Archived',
};

export const KYC_STATUS_LABELS: Record<CustomerKycStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  verified: 'Verified',
  rejected: 'Rejected',
};
