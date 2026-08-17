import { api } from '@/lib/api';
import { Property, PropertyListResponse, PropertyType } from '@/lib/types';

export interface PropertyListFilters {
  propertyType?: PropertyType;
  status?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PropertyWritePayload {
  propertyType: PropertyType;
  name: string;
  propertyNumber: string;
  area: { value: number; unit: string };
  price?: number | null;
  status?: string;
  description?: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}

function buildQuery(filters: PropertyListFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.propertyType) params.set('propertyType', filters.propertyType);
  if (filters.status) params.set('status', filters.status);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function fetchProperties(filters: PropertyListFilters = {}, token?: string | null) {
  return api.get<PropertyListResponse>(`/properties${buildQuery(filters)}`, token);
}

export function createProperty(payload: PropertyWritePayload, token: string) {
  return api.post<Property>('/properties', payload, token);
}

export function updateProperty(id: string, payload: Partial<PropertyWritePayload>, token: string) {
  return api.put<Property>(`/properties/${id}`, payload, token);
}

export function deleteProperty(id: string, token: string) {
  return api.delete<{ deleted: boolean }>(`/properties/${id}`, token);
}
