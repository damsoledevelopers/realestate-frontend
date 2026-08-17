import { PropertyStatus, PropertyType } from '@/lib/types';
import { getDefaultStatusDefinition } from '@/lib/propertyStatusConfig';

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  layout: 'Layout',
  plot: 'Plot',
  farm: 'Farm',
  land: 'Land',
  bungalow: 'Bungalow',
  row_house: 'Row House',
};

export const PROPERTY_TYPE_COLORS: Record<PropertyType, { fill: string; stroke: string; marker: string }> = {
  layout: { fill: '#3b82f6', stroke: '#1d4ed8', marker: '#2563eb' },
  plot: { fill: '#22c55e', stroke: '#15803d', marker: '#16a34a' },
  farm: { fill: '#f59e0b', stroke: '#b45309', marker: '#d97706' },
  land: { fill: '#a16207', stroke: '#713f12', marker: '#92400e' },
  bungalow: { fill: '#a855f7', stroke: '#6b21a8', marker: '#7c3aed' },
  row_house: { fill: '#14b8a6', stroke: '#0f766e', marker: '#0d9488' },
};

/** @deprecated Use StatusBadge component and propertyStatusConfig instead */
export const PROPERTY_STATUS_BADGE: Record<PropertyStatus, string> = {
  available: 'bg-green-100 text-green-700',
  booked: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-red-100 text-red-700',
  reserved: 'bg-pink-100 text-pink-700',
  active: 'bg-blue-100 text-blue-700',
  inactive: 'bg-gray-100 text-gray-600',
};

export const ALL_PROPERTY_TYPES: PropertyType[] = [
  'layout',
  'plot',
  'farm',
  'land',
  'bungalow',
  'row_house',
];

export function formatPropertyArea(area: { value: number; unit: string }): string {
  const unitLabels: Record<string, string> = {
    sqft: 'sq ft',
    sqm: 'sq m',
    acre: 'acre(s)',
    hectare: 'hectare(s)',
  };
  return `${area.value.toLocaleString()} ${unitLabels[area.unit] || area.unit}`;
}

export function formatPropertyPrice(
  price: number | null | undefined,
  onRequestLabel = 'On request'
): string {
  if (price == null) return onRequestLabel;
  return `₹${price.toLocaleString('en-IN')}`;
}

export function formatPropertyType(type: PropertyType): string {
  return PROPERTY_TYPE_LABELS[type] || type;
}

export function formatStatusLabel(status: PropertyStatus): string {
  return getDefaultStatusDefinition(status).label;
}
