import { api } from '@/lib/api';
import {
  MapProperty,
  PropertyContactAssignmentMeta,
  PropertyContactEntityType,
  PropertyContactHistoryEntry,
  PropertyContactUser,
  User,
} from '@/lib/types';

export interface PropertyContactResponse {
  contactUser: PropertyContactUser | null;
  assignment: PropertyContactAssignmentMeta | null;
}

export interface UserAssignmentsResponse {
  assignments: Record<PropertyContactEntityType, { entityId: string; assignedAt: string; updatedAt: string }[]>;
}

export function getContactEntityType(
  propertyType: string
): PropertyContactEntityType {
  if (
    propertyType === 'farm' ||
    propertyType === 'land' ||
    propertyType === 'bungalow' ||
    propertyType === 'row_house' ||
    propertyType === 'plot' ||
    propertyType === 'layout'
  ) {
    return propertyType;
  }
  return 'layout';
}

export function resolveContactTarget(property: Pick<
  MapProperty,
  'id' | 'propertyType' | 'linkedLayoutId' | 'linkedPlotId'
>) {
  const entityType = getContactEntityType(property.propertyType);

  if (entityType === 'layout' && property.linkedLayoutId) {
    return { entityType: 'layout' as const, entityId: property.linkedLayoutId };
  }

  if (entityType === 'plot') {
    return {
      entityType: 'plot' as const,
      entityId: property.linkedPlotId || property.id,
    };
  }

  return { entityType, entityId: property.id };
}

export function fetchPropertyContact(entityType: PropertyContactEntityType, entityId: string) {
  return api.get<PropertyContactResponse>(`/property-contacts/${entityType}/${entityId}`);
}

export function assignPropertyContact(
  payload: {
    entityType: PropertyContactEntityType;
    entityId: string;
    assignedUserId: string;
    note?: string;
  },
  token: string
) {
  return api.post<{ assignment: unknown; contactUser: PropertyContactUser }>(
    '/property-contacts/assign',
    payload,
    token
  );
}

export function updatePropertyContact(
  entityType: PropertyContactEntityType,
  entityId: string,
  payload: { assignedUserId: string; note?: string },
  token: string
) {
  return api.put<{ assignment: unknown; contactUser: PropertyContactUser }>(
    `/property-contacts/${entityType}/${entityId}`,
    payload,
    token
  );
}

export function removePropertyContact(
  entityType: PropertyContactEntityType,
  entityId: string,
  token: string,
  note?: string
) {
  return api.delete(`/property-contacts/${entityType}/${entityId}`, token, note ? { note } : undefined);
}

export function fetchContactHistory(
  entityType: PropertyContactEntityType,
  entityId: string,
  token: string
) {
  return api.get<{ history: PropertyContactHistoryEntry[] }>(
    `/property-contacts/${entityType}/${entityId}/history`,
    token
  );
}

export function fetchUserAssignments(userId: string, token: string) {
  return api.get<UserAssignmentsResponse>(`/property-contacts/user/${userId}`, token);
}

export function fetchAssignableUsers(token: string) {
  return api.get<{ users: User[] }>('/users?limit=100&role=user', token).catch(() =>
    api.get<{ users: User[] }>('/users?limit=100', token)
  );
}

export function buildWhatsAppUrl(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function formatContactDetails(
  contact: PropertyContactUser,
  labels?: { phone?: string; email?: string }
) {
  return [
    contact.name,
    contact.designation,
    contact.companyName,
    contact.phone && `${labels?.phone || 'Phone'}: ${contact.phone}`,
    contact.email && `${labels?.email || 'Email'}: ${contact.email}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function copyContactDetails(
  contact: PropertyContactUser,
  labels?: { phone?: string; email?: string }
) {
  await navigator.clipboard.writeText(formatContactDetails(contact, labels));
}

export function buildVCard(contact: PropertyContactUser) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
    contact.phone ? `TEL;TYPE=CELL:${contact.phone}` : '',
    contact.email ? `EMAIL:${contact.email}` : '',
    contact.companyName ? `ORG:${contact.companyName}` : '',
    contact.designation ? `TITLE:${contact.designation}` : '',
    'END:VCARD',
  ].filter(Boolean);
  return lines.join('\n');
}

export function downloadVCard(contact: PropertyContactUser) {
  const blob = new Blob([buildVCard(contact)], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${contact.name.replace(/\s+/g, '-').toLowerCase()}.vcf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
