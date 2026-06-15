'use client';

import { useEffect, useMemo, useState } from 'react';
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch';
import { Plot } from '@/lib/types';
import { PLOT_STATUS } from '@/constants/css';
import PlotPopup from '@/components/plots/PlotPopup';

type PlotFilter = 'all' | 'available' | 'booked' | 'sold';

interface PlotMapProps {
  layoutId: string;
  layoutImage?: string;
  layoutName?: string;
  layoutLocation?: string;
  layoutCoordinates?: { lat?: number; lng?: number };
  plots: Plot[];
  highlightPlotId?: string | null;
  onBookNow?: (plot: Plot) => void;
  onViewMap?: (plot: Plot) => void;
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-lg bg-white/95 p-1 shadow-md ring-1 ring-gray-200">
      <button
        type="button"
        onClick={() => zoomIn()}
        className="rounded px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className="rounded px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
        aria-label="Reset zoom"
      >
        Reset
      </button>
    </div>
  );
}

export default function PlotMap({
  layoutId,
  layoutImage,
  layoutName,
  layoutLocation,
  layoutCoordinates,
  plots,
  highlightPlotId,
  onBookNow,
  onViewMap,
}: PlotMapProps) {
  const [filter, setFilter] = useState<PlotFilter>('all');
  const [popupPlot, setPopupPlot] = useState<Plot | null>(null);
  const [imageError, setImageError] = useState(false);

  const showLayoutImage = Boolean(layoutImage) && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [layoutImage]);

  const filteredPlots = useMemo(() => {
    if (filter === 'all') return plots;
    return plots.filter((p) => p.status === filter);
  }, [plots, filter]);

  const filters: { key: PlotFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'booked', label: 'Booked' },
    { key: 'sold', label: 'Sold' },
  ];

  const handleBookNow = (plot: Plot) => {
    setPopupPlot(null);
    onBookNow?.(plot);
  };

  return (
    <div className="space-y-4" data-layout-id={layoutId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Pinch or scroll to zoom · {filteredPlots.length} plot{filteredPlots.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: false, mode: 'zoomIn' }}
        >
          <ZoomControls />
          <TransformComponent
            wrapperClass="!w-full"
            contentClass="!w-full"
          >
            <div
              className={`relative aspect-[16/10] w-full min-w-[320px] ${
                showLayoutImage ? 'bg-gray-50' : 'bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:32px_32px] bg-gray-100'
              }`}
            >
              {showLayoutImage ? (
                <img
                  src={layoutImage}
                  alt="Layout map"
                  className="h-full w-full object-contain p-2"
                  draggable={false}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-4 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <p className="mt-2 text-sm font-medium">
                    {imageError ? 'Layout image could not be loaded' : 'No layout image uploaded'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Plot markers are still clickable below. Upload a site plan in admin.
                  </p>
                </div>
              )}

              {filteredPlots.map((plot) => (
                <button
                  key={plot._id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupPlot(plot);
                  }}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border-2 font-semibold text-white shadow-sm transition hover:scale-110 ${
                    showLayoutImage ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-8 min-w-8 px-1 text-[10px] sm:h-9 sm:min-w-9 sm:text-xs'
                  } ${PLOT_STATUS[plot.status].map} ${
                    popupPlot?._id === plot._id || highlightPlotId === plot._id
                      ? 'z-10 scale-125 ring-2 ring-primary-500 ring-offset-1'
                      : ''
                  }`}
                  style={{
                    left: `${plot.coordinates?.x ?? 50}%`,
                    top: `${plot.coordinates?.y ?? 50}%`,
                  }}
                  title={`Plot ${plot.plotNumber} — ${plot.status}`}
                  aria-label={`Plot ${plot.plotNumber}, ${plot.status}`}
                >
                  {!showLayoutImage ? plot.plotNumber : null}
                </button>
              ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded ${PLOT_STATUS.available.legend}`} />
          Available
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded ${PLOT_STATUS.booked.legend}`} />
          Booked
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded ${PLOT_STATUS.sold.legend}`} />
          Sold
        </div>
      </div>

      {popupPlot && (
        <PlotPopup
          plot={popupPlot}
          onClose={() => setPopupPlot(null)}
          onBookNow={onBookNow ? handleBookNow : undefined}
          onViewMap={onViewMap}
          layoutName={layoutName}
          layoutLocation={layoutLocation}
          layoutCoordinates={layoutCoordinates}
        />
      )}
    </div>
  );
}
