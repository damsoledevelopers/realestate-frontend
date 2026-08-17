import { PropertyStatus } from '@/lib/types';

export type PlotStatus = 'available' | 'booked' | 'sold' | 'reserved';

export type StatusKey = PropertyStatus | PlotStatus | string;

export interface StatusColorTokens {
  indicator: string;
  badgeBg: string;
  badgeText: string;
}

export interface PropertyStatusRecord {
  key: string;
  label: string;
  description?: string;
  bookable: boolean;
  sortOrder?: number;
  isActive?: boolean;
  colors: StatusColorTokens;
}

/** Fallback used only while DB config is loading */
export const FALLBACK_PROPERTY_STATUSES: PropertyStatusRecord[] = [
  {
    key: 'available',
    label: 'Available',
    bookable: true,
    colors: { indicator: '#22c55e', badgeBg: '#dcfce7', badgeText: '#15803d' },
  },
  {
    key: 'booked',
    label: 'Booked (Transaction in Progress)',
    bookable: false,
    colors: { indicator: '#eab308', badgeBg: '#fef9c3', badgeText: '#854d0e' },
  },
  {
    key: 'sold',
    label: 'Sold',
    bookable: false,
    colors: { indicator: '#ef4444', badgeBg: '#fee2e2', badgeText: '#b91c1c' },
  },
  {
    key: 'reserved',
    label: 'Reserved',
    bookable: false,
    colors: { indicator: '#ec4899', badgeBg: '#fce7f3', badgeText: '#be185d' },
  },
  {
    key: 'active',
    label: 'Active',
    bookable: false,
    colors: { indicator: '#3b82f6', badgeBg: '#dbeafe', badgeText: '#1d4ed8' },
  },
  {
    key: 'inactive',
    label: 'Inactive',
    bookable: false,
    colors: { indicator: '#9ca3af', badgeBg: '#f3f4f6', badgeText: '#4b5563' },
  },
];

export const SALE_PROPERTY_STATUS_KEYS = ['available', 'booked', 'sold', 'reserved'];

export function buildStatusMap(statuses: PropertyStatusRecord[]): Record<string, PropertyStatusRecord> {
  return Object.fromEntries(statuses.map((status) => [status.key, status]));
}

export function getStatusDefinitionFromList(
  statuses: PropertyStatusRecord[],
  status: string
): PropertyStatusRecord {
  const map = buildStatusMap(statuses);
  const match = map[status];

  if (match) return match;

  return {
    key: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    bookable: false,
    colors: FALLBACK_PROPERTY_STATUSES.find((item) => item.key === 'inactive')!.colors,
  };
}

export function isPropertyBookable(status: string, statuses: PropertyStatusRecord[]): boolean {
  return getStatusDefinitionFromList(statuses, status).bookable;
}

export function getMapMarkerStyle(colors: StatusColorTokens): {
  backgroundColor: string;
  borderColor: string;
} {
  return {
    backgroundColor: `${colors.indicator}B3`,
    borderColor: colors.indicator,
  };
}

/** @deprecated Use usePropertyStatusConfig().getDefinition instead */
export function getDefaultStatusDefinition(status: string): PropertyStatusRecord {
  return getStatusDefinitionFromList(FALLBACK_PROPERTY_STATUSES, status);
}
