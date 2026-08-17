'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch';
import { Plot } from '@/lib/types';
import PropertyDetailsPanel from '@/components/property/PropertyDetailsPanel';
import { plotToMapProperty } from '@/lib/propertyDetails';
import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';
import { formatPrice } from '@/lib/layoutStats';
import { normalizeConstructionStatus } from '@/lib/constructionStatusConfig';
import PlotHatchingOverlay, {
  ConstructionHatchLegendSwatch,
} from '@/components/plots/PlotHatchingOverlay';
import { useLocale } from '@/context/LocaleContext';

type PlotFilter = 'all' | 'available' | 'booked' | 'sold' | 'reserved';

interface PlotMapProps {
  layoutId: string;
  layoutImage?: string;
  layoutName?: string;
  layoutLocation?: string;
  layoutCoordinates?: { lat?: number; lng?: number };
  plots: Plot[];
  onBookNow?: (plot: Plot) => void;
}

function ZoomControls({
  onFullscreen,
  labels,
}: {
  onFullscreen: () => void;
  labels: { zoomIn: string; zoomOut: string; resetZoom: string; fullscreen: string };
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 rounded-lg bg-white/95 p-1 shadow-md ring-1 ring-gray-100 backdrop-blur-sm">
      <MapControlButton onClick={() => zoomIn()} label={labels.zoomIn} icon="+" />
      <MapControlButton onClick={() => zoomOut()} label={labels.zoomOut} icon="−" />
      <MapControlButton onClick={() => resetTransform()} label={labels.resetZoom} icon="↺" small />
      <div className="my-0.5 h-px bg-gray-200" />
      <MapControlButton onClick={onFullscreen} label={labels.fullscreen} icon="⛶" small />
    </div>
  );
}

function MapControlButton({
  onClick,
  label,
  icon,
  small,
}: {
  onClick: () => void;
  label: string;
  icon: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg font-medium text-gray-700 transition hover:bg-primary-50 hover:text-primary-700 ${
        small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
      }`}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

export default function PlotMap({
  layoutId,
  layoutImage,
  layoutName,
  layoutLocation,
  layoutCoordinates,
  plots,
  onBookNow,
}: PlotMapProps) {
  const { t } = useLocale();
  const { getDefinition, getMapMarkerStyle, isBookable } = usePropertyStatusConfig();
  const [filter, setFilter] = useState<PlotFilter>('all');
  const [popupPlot, setPopupPlot] = useState<Plot | null>(null);
  const [hoverPlot, setHoverPlot] = useState<Plot | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showLayoutImage = Boolean(layoutImage) && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [layoutImage]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const filteredPlots = useMemo(() => {
    if (filter === 'all') return plots;
    return plots.filter((p) => p.status === filter);
  }, [plots, filter]);

  const filters: { key: PlotFilter; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'available', label: getDefinition('available').label || t('common.available') },
    { key: 'booked', label: getDefinition('booked').label || t('common.booked') },
    { key: 'sold', label: getDefinition('sold').label || t('common.sold') },
    { key: 'reserved', label: getDefinition('reserved').label || t('common.reserved') },
  ];

  const constructionLabel = (status?: string | null) =>
    t(`construction.${normalizeConstructionStatus(status)}`);

  const handleBookNow = (plot: Plot) => {
    setPopupPlot(null);
    onBookNow?.(plot);
  };

  return (
    <div className="space-y-3" data-layout-id={layoutId}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === f.key
                  ? 'bg-primary-800 text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">
          {t('plotMap.scrollZoom')} · {filteredPlots.length}{' '}
          {filteredPlots.length === 1 ? t('common.plot') : t('common.plots')}
        </p>
      </div>

      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 ${
          isFullscreen ? 'bg-gray-900' : ''
        }`}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: false, mode: 'zoomIn' }}
        >
          <ZoomControls
            onFullscreen={toggleFullscreen}
            labels={{
              zoomIn: t('plotMap.zoomIn'),
              zoomOut: t('plotMap.zoomOut'),
              resetZoom: t('plotMap.resetZoom'),
              fullscreen: t('plotMap.fullscreen'),
            }}
          />
          <TransformComponent wrapperClass="!w-full" contentClass="!w-full">
            <div
              className={`relative w-full min-w-0 ${
                showLayoutImage
                  ? 'aspect-[16/9] max-h-[340px] bg-gray-50 sm:max-h-[380px]'
                  : 'h-[240px] bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] bg-gray-100 sm:h-[280px]'
              }`}
            >
              {showLayoutImage ? (
                <img
                  src={layoutImage}
                  alt="Layout map"
                  className="h-full w-full object-contain p-1.5"
                  draggable={false}
                  onError={() => setImageError(true)}
                />
              ) : filteredPlots.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center text-gray-500">
                  <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <p className="mt-1.5 text-xs font-medium">
                    {imageError ? t('plotMap.imageError') : t('plotMap.noImage')}
                  </p>
                </div>
              ) : (
                <p className="pointer-events-none absolute bottom-2 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] text-gray-400 ring-1 ring-gray-200">
                  {t('plotMap.gridHint')}
                </p>
              )}

              {filteredPlots.map((plot) => (
                <div
                  key={plot._id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${plot.coordinates?.x ?? 50}%`,
                    top: `${plot.coordinates?.y ?? 50}%`,
                  }}
                  onMouseEnter={() => setHoverPlot(plot)}
                  onMouseLeave={() => setHoverPlot(null)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopupPlot(plot);
                    }}
                    style={getMapMarkerStyle(plot.status)}
                    className={`relative flex items-center justify-center overflow-hidden rounded border-2 font-semibold text-white shadow-sm transition duration-200 hover:scale-110 ${
                      showLayoutImage ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-7 min-w-7 px-1 text-[9px] sm:h-8 sm:min-w-8 sm:text-[10px]'
                    } ${
                      popupPlot?._id === plot._id
                        ? 'z-10 scale-125 ring-2 ring-accent ring-offset-1'
                        : ''
                    }`}
                    title={`Plot ${plot.plotNumber} — ${plot.status} · ${constructionLabel(plot.constructionStatus)}`}
                    aria-label={`Plot ${plot.plotNumber}, ${plot.status}, ${constructionLabel(plot.constructionStatus)}`}
                  >
                    <PlotHatchingOverlay constructionStatus={plot.constructionStatus} />
                    {!showLayoutImage ? plot.plotNumber : null}
                  </button>

                  {hoverPlot?._id === plot._id && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-2 text-xs text-white shadow-xl">
                      <p className="font-bold">Plot {plot.plotNumber}</p>
                      <p className="mt-0.5 text-white/70">{plot.size}</p>
                      <p className="font-semibold text-accent">{formatPrice(plot.price)}</p>
                      <p className="mt-1 capitalize text-white/60">{getDefinition(plot.status).label}</p>
                      <p className="text-white/50">{constructionLabel(plot.constructionStatus)}</p>
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 ring-1 ring-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('common.legend')}</p>
        <LegendItem status="available" />
        <LegendItem status="booked" />
        <LegendItem status="sold" />
        <LegendItem status="reserved" />
        <div className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden />
        <ConstructionHatchLegendSwatch
          constructionStatus="under_construction"
          label={t('construction.under_construction')}
        />
        <ConstructionHatchLegendSwatch
          constructionStatus="construction_completed"
          label={t('construction.construction_completed')}
        />
      </div>

      {popupPlot && (
        <PropertyDetailsPanel
          property={plotToMapProperty(popupPlot, {
            layoutId,
            layoutName,
            layoutLocation,
            layoutCoordinates,
          })}
          onClose={() => setPopupPlot(null)}
          footer={
            isBookable(popupPlot.status) && onBookNow ? (
              <button type="button" onClick={() => handleBookNow(popupPlot)} className="btn-primary w-full">
                {t('plotMap.bookNow')}
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}

function LegendItem({ status }: { status: string }) {
  const { getDefinition, getIndicatorStyle } = usePropertyStatusConfig();
  const label = getDefinition(status).label || status;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <span className="h-2.5 w-2.5 rounded-full" style={getIndicatorStyle(status)} />
      {label}
    </div>
  );
}
