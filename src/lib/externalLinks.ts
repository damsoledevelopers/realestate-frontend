import { api } from '@/lib/api';
import type { ExternalLinkCategory, ExternalLinkEntityType, ExternalLinkRecord } from '@/lib/types';

export type { ExternalLinkEntityType };

export const EXTERNAL_LINK_CATEGORY_LABELS: Record<ExternalLinkCategory, string> = {
  '7_12_extract': '7/12 Extract',
  measurement_map: 'Measurement Map',
  google_maps: 'Google Maps',
  google_drive: 'Google Drive',
  other_documents: 'Other Documents',
  custom: 'Custom Links',
};

export const EXTERNAL_LINK_CATEGORIES: ExternalLinkCategory[] = [
  '7_12_extract',
  'measurement_map',
  'google_maps',
  'google_drive',
  'other_documents',
  'custom',
];

export interface ExternalLinksResponse {
  links: ExternalLinkRecord[];
}

export interface CreateExternalLinkPayload {
  title: string;
  url: string;
  category: ExternalLinkCategory;
  description?: string;
  sortOrder?: number;
}

export interface UpdateExternalLinkPayload {
  title?: string;
  url?: string;
  category?: ExternalLinkCategory;
  description?: string;
  sortOrder?: number;
}

export function fetchExternalLinks(entityType: ExternalLinkEntityType, entityId: string) {
  return api.get<ExternalLinksResponse>(`/external-links/${entityType}/${entityId}`);
}

export function createExternalLink(
  entityType: ExternalLinkEntityType,
  entityId: string,
  payload: CreateExternalLinkPayload,
  token: string
) {
  return api.post<{ link: ExternalLinkRecord }>(
    `/external-links/${entityType}/${entityId}`,
    payload,
    token
  );
}

export function updateExternalLink(
  linkId: string,
  payload: UpdateExternalLinkPayload,
  token: string
) {
  return api.patch<{ link: ExternalLinkRecord }>(`/external-links/${linkId}`, payload, token);
}

export function deleteExternalLink(linkId: string, token: string) {
  return api.delete(`/external-links/${linkId}`, token);
}

export function getCategoryLabel(category: ExternalLinkCategory): string {
  return EXTERNAL_LINK_CATEGORY_LABELS[category] || category;
}
