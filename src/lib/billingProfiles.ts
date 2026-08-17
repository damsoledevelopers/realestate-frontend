import { api } from '@/lib/api';
import type { BillingProfile } from '@/lib/types';

export function fetchMyBillingProfile(token: string) {
  return api.get<BillingProfile>('/billing-profiles/me', token);
}

export function saveMyBillingProfile(formData: FormData, token: string) {
  return api.putForm<BillingProfile>('/billing-profiles/me', formData, token);
}

export function fetchLayoutIssuerProfile(layoutId: string, token: string) {
  return api.get<BillingProfile | null>(`/estimates/layout/${layoutId}/issuer`, token);
}
