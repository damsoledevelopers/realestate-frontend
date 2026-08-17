import { api } from '@/lib/api';
import type {
  PaymentHistoryResponse,
  PaymentMode,
  PaymentRecord,
  PaymentsListResponse,
  PaymentStatus,
} from '@/lib/types';

export interface CreatePaymentPayload {
  bookingId: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  remarks?: string;
  status?: PaymentStatus;
}

export interface UpdatePaymentPayload {
  amount?: number;
  paymentDate?: string;
  paymentMode?: PaymentMode;
  referenceNumber?: string;
  remarks?: string;
  status?: PaymentStatus;
}

export function fetchPayments(
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
  return api.get<PaymentsListResponse>(`/payments${query ? `?${query}` : ''}`, token);
}

export function fetchBookingPayments(bookingId: string, token: string) {
  return api.get<PaymentHistoryResponse>(`/payments/booking/${bookingId}`, token);
}

export function createPayment(payload: CreatePaymentPayload, token: string) {
  return api.post<{ payment: PaymentRecord; summary: PaymentHistoryResponse['summary'] }>(
    '/payments',
    payload,
    token
  );
}

export function updatePayment(id: string, payload: UpdatePaymentPayload, token: string) {
  return api.patch<{ payment: PaymentRecord; summary: PaymentHistoryResponse['summary'] }>(
    `/payments/${id}`,
    payload,
    token
  );
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  card: 'Card',
  other: 'Other',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  success: 'Success',
  failed: 'Failed',
  cancelled: 'Cancelled',
};
