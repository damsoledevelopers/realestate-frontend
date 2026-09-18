'use client';

import LayoutLinesMap from '@/components/maps/LayoutLinesMap';
import { Layout } from '@/lib/types';

interface LayoutBoundaryMapProps {
  layoutId: string;
  layout?: Layout | null;
  className?: string;
  /** Kept for API compatibility; layout map always shows layout lines only. */
  includePlots?: boolean;
}

/** Fast layout map: simplified GeoJSON as red CAD lines (Plan / Map / Satellite). */
export default function LayoutBoundaryMap({
  layoutId,
  layout = null,
  className = 'min-h-[400px] w-full rounded-xl',
}: LayoutBoundaryMapProps) {
  return <LayoutLinesMap layoutId={layoutId} layout={layout} className={className} />;
}
