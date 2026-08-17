'use client';

import { CSSProperties } from 'react';
import {
  getConstructionStatusDefinition,
  shouldShowConstructionHatching,
} from '@/lib/constructionStatusConfig';

interface PlotHatchingOverlayProps {
  constructionStatus?: string | null;
  className?: string;
  style?: CSSProperties;
}

/**
 * Visual hatching overlay for plot markers on the layout map.
 * Renders nothing for empty plots.
 */
export default function PlotHatchingOverlay({
  constructionStatus,
  className = '',
  style,
}: PlotHatchingOverlayProps) {
  if (!shouldShowConstructionHatching(constructionStatus)) {
    return null;
  }

  const definition = getConstructionStatusDefinition(constructionStatus);

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
      style={{
        backgroundImage: definition.hatchBackground,
        backgroundBlendMode: 'multiply',
        ...style,
      }}
    />
  );
}

interface ConstructionHatchLegendSwatchProps {
  constructionStatus: 'under_construction' | 'construction_completed';
  label: string;
}

export function ConstructionHatchLegendSwatch({
  constructionStatus,
  label,
}: ConstructionHatchLegendSwatchProps) {
  const definition = getConstructionStatusDefinition(constructionStatus);

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
      <span
        className="h-3 w-3 rounded-sm border border-gray-300"
        style={{
          backgroundColor: '#e5e7eb',
          backgroundImage: definition.hatchBackground,
          backgroundBlendMode: 'multiply',
        }}
      />
      {label}
    </div>
  );
}
