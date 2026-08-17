export type ConstructionStatus = 'empty_plot' | 'under_construction' | 'construction_completed';

export interface ConstructionStatusDefinition {
  key: ConstructionStatus;
  label: string;
  /** Whether the plot marker should show a hatching overlay */
  showHatching: boolean;
  badgeBg: string;
  badgeText: string;
  /** CSS background for hatch pattern overlay */
  hatchBackground: string;
}

export const CONSTRUCTION_STATUSES: ConstructionStatusDefinition[] = [
  {
    key: 'empty_plot',
    label: 'Empty Plot',
    showHatching: false,
    badgeBg: '#f3f4f6',
    badgeText: '#4b5563',
    hatchBackground: 'transparent',
  },
  {
    key: 'under_construction',
    label: 'Under Construction',
    showHatching: true,
    badgeBg: '#ffedd5',
    badgeText: '#c2410c',
    hatchBackground:
      'repeating-linear-gradient(45deg, rgba(234, 88, 12, 0.55) 0, rgba(234, 88, 12, 0.55) 2px, transparent 2px, transparent 6px)',
  },
  {
    key: 'construction_completed',
    label: 'Construction Completed',
    showHatching: true,
    badgeBg: '#dbeafe',
    badgeText: '#1d4ed8',
    hatchBackground:
      'repeating-linear-gradient(0deg, rgba(37, 99, 235, 0.45) 0, rgba(37, 99, 235, 0.45) 1px, transparent 1px, transparent 5px), repeating-linear-gradient(90deg, rgba(37, 99, 235, 0.45) 0, rgba(37, 99, 235, 0.45) 1px, transparent 1px, transparent 5px)',
  },
];

export const DEFAULT_CONSTRUCTION_STATUS: ConstructionStatus = 'empty_plot';

const statusMap = Object.fromEntries(
  CONSTRUCTION_STATUSES.map((status) => [status.key, status])
) as Record<ConstructionStatus, ConstructionStatusDefinition>;

export function normalizeConstructionStatus(value?: string | null): ConstructionStatus {
  if (value && value in statusMap) {
    return value as ConstructionStatus;
  }
  return DEFAULT_CONSTRUCTION_STATUS;
}

export function getConstructionStatusDefinition(
  value?: string | null
): ConstructionStatusDefinition {
  return statusMap[normalizeConstructionStatus(value)];
}

export function shouldShowConstructionHatching(value?: string | null): boolean {
  return getConstructionStatusDefinition(value).showHatching;
}

export type ConstructionMarkerStyle = {
  backgroundColor: string;
  borderColor: string;
  backgroundImage?: string;
  backgroundBlendMode?: string;
};

export function getConstructionMarkerStyle(
  saleStatusStyle: { backgroundColor: string; borderColor: string },
  constructionStatus?: string | null
): ConstructionMarkerStyle {
  const definition = getConstructionStatusDefinition(constructionStatus);

  if (!definition.showHatching) {
    return saleStatusStyle;
  }

  return {
    ...saleStatusStyle,
    backgroundImage: definition.hatchBackground,
    backgroundBlendMode: 'multiply',
  };
}
