'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  FullscreenControl,
  LngLatBounds,
  type ExpressionSpecification,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type SourceSpecification,
  type LayerSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapTypeToggle from '@/components/maps/MapTypeToggle';
import PropertyDetailsPanel from '@/components/property/PropertyDetailsPanel';
import {
  clearLayoutMapGeoJsonCache,
  hasGeoJsonLines,
  prefetchLayoutMapGeoJson,
  LayoutMapGeoJson,
} from '@/lib/layoutMapGeoJson';
import {
  getMapAttribution,
  MAP_FIT_MAX_ZOOM,
  MAP_MAX_ZOOM,
  MAP_STYLES,
  MapStyleId,
} from '@/lib/maplibre';
import { ensureMapLibreWorker } from '@/lib/maplibreWorker';
import { hasValidCoordinates } from '@/lib/googleMaps';
import { plotToMapProperty } from '@/lib/propertyDetails';
import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';
import { useLocale } from '@/context/LocaleContext';
import { FALLBACK_PROPERTY_STATUSES, SALE_PROPERTY_STATUS_KEYS } from '@/lib/propertyStatusConfig';
import { Layout, LatLngPoint, Plot } from '@/lib/types';

ensureMapLibreWorker();

type PlotFilter = 'all' | 'available' | 'booked' | 'sold' | 'reserved';

interface ImportedPlotLike {
  plotNumber: string;
  size?: string;
  latitude?: number | null;
  longitude?: number | null;
  boundary?: {
    type?: string;
    coordinates?: number[][][];
  } | null;
  boundaryPath?: LatLngPoint[] | null;
}

interface LayoutSitePlanMapProps {
  layoutId: string;
  layout: Layout;
  plots: Plot[];
  layoutName?: string;
  layoutLocation?: string;
  onEnquire?: (plot: Plot) => void;
  highlightPlotId?: string | null;
  className?: string;
}

interface SitePlotFeature {
  id: string;
  plotNumber: string;
  status: string;
  size?: string;
  price?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  ring: [number, number][] | null;
  salePlot: Plot | null;
}

const LINES_SOURCE = 'site-layout-lines';
const LINES_LAYER = 'site-layout-lines-stroke';
const PLOTS_SOURCE = 'site-plots';
const PLOTS_FILL = 'site-plots-fill';
const PLOTS_OUTLINE = 'site-plots-outline';
const MARKERS_SOURCE = 'site-plot-markers';
const MARKERS_CIRCLE = 'site-plot-markers-circle';
const MARKERS_LABEL = 'site-plot-markers-label';

const STATUS_FILL: Record<string, string> = {
  available: '#22c55e',
  booked: '#eab308',
  sold: '#ef4444',
  reserved: '#ec4899',
};

function normalizePlotNumber(value?: string | null) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function ringFromBoundaryPath(path?: LatLngPoint[] | null): [number, number][] | null {
  if (!path || path.length < 3) return null;
  const ring: [number, number][] = [];
  path.forEach((point) => {
    const lng = Number(point.lng);
    const lat = Number(point.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) ring.push([lng, lat]);
  });
  if (ring.length < 3) return null;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return isUsableRing(ring) ? ring : null;
}

function ringFromGeoJsonPolygon(boundary?: ImportedPlotLike['boundary']): [number, number][] | null {
  const raw = boundary?.coordinates?.[0];
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const ring: [number, number][] = [];
  raw.forEach((pair) => {
    if (!Array.isArray(pair) || pair.length < 2) return;
    const lng = Number(pair[0]);
    const lat = Number(pair[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) ring.push([lng, lat]);
  });
  if (ring.length < 3) return null;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return isUsableRing(ring) ? ring : null;
}

/** Skip degenerate CAD stubs that collapse to a point. */
function isUsableRing(ring: [number, number][]) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  ring.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  return maxLng - minLng > 1e-5 || maxLat - minLat > 1e-5;
}

function ringCentroid(ring: [number, number][]): { lng: number; lat: number } | null {
  if (!ring.length) return null;
  let lng = 0;
  let lat = 0;
  const count = ring.length - (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? 1 : 0);
  const n = Math.max(count, 1);
  for (let i = 0; i < n; i += 1) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return { lng: lng / n, lat: lat / n };
}

function toDrawableLines(data: LayoutMapGeoJson | null | undefined): GeoJSON.FeatureCollection {
  const lineCoords: [number, number][][] = [];

  (data?.features || []).forEach((feature) => {
    const geometry = feature?.geometry;
    if (!geometry?.coordinates) return;
    const type = String(geometry.type || 'LineString');
    const coords = geometry.coordinates as number[][] | number[][][];

    const pushLine = (line: number[][]) => {
      if (!Array.isArray(line) || line.length < 2) return;
      const cleaned: [number, number][] = [];
      line.forEach((pair) => {
        if (!Array.isArray(pair) || pair.length < 2) return;
        const lng = Number(pair[0]);
        const lat = Number(pair[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
        cleaned.push([lng, lat]);
      });
      if (cleaned.length >= 2) lineCoords.push(cleaned);
    };

    if (type === 'LineString') pushLine(coords as number[][]);
    else if (type === 'MultiLineString') (coords as number[][][]).forEach(pushLine);
  });

  if (!lineCoords.length) return { type: 'FeatureCollection', features: [] };

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'layout-border' },
        geometry: { type: 'MultiLineString', coordinates: lineCoords },
      },
    ],
  };
}

function buildSitePlots(layout: Layout, plots: Plot[]): SitePlotFeature[] {
  const imported = (layout.importedPlots || []) as ImportedPlotLike[];
  const importedByNumber = new Map<string, ImportedPlotLike>();
  imported.forEach((item) => {
    const key = normalizePlotNumber(item.plotNumber);
    if (key) importedByNumber.set(key, item);
  });

  // Only Admin-registered Plot documents are for sale / status — KML alone never creates listings.
  const features = plots.map((plot) => {
    const importedMatch = importedByNumber.get(normalizePlotNumber(plot.plotNumber));
    const ring =
      ringFromBoundaryPath(plot.boundaryPath) ||
      ringFromGeoJsonPolygon(importedMatch?.boundary) ||
      ringFromBoundaryPath(importedMatch?.boundaryPath);
    const centroid = ring ? ringCentroid(ring) : null;

    return {
      id: plot._id,
      plotNumber: plot.plotNumber,
      status: plot.status,
      size: plot.size,
      price: plot.price,
      latitude:
        plot.latitude ??
        plot.mapCoordinates?.lat ??
        importedMatch?.latitude ??
        centroid?.lat ??
        null,
      longitude:
        plot.longitude ??
        plot.mapCoordinates?.lng ??
        importedMatch?.longitude ??
        centroid?.lng ??
        null,
      ring,
      salePlot: plot,
    };
  });

  return spreadCoLocatedMarkers(features);
}

/** When KML centroids collapse to one point, fan markers so every registered plot is visible. */
function spreadCoLocatedMarkers(features: SitePlotFeature[]): SitePlotFeature[] {
  const groups = new Map<string, number[]>();

  features.forEach((plot, index) => {
    if (!hasValidCoordinates(plot.latitude, plot.longitude)) return;
    const key = `${Number(plot.latitude).toFixed(6)},${Number(plot.longitude).toFixed(6)}`;
    const list = groups.get(key) || [];
    list.push(index);
    groups.set(key, list);
  });

  const next = features.map((plot) => ({ ...plot }));

  groups.forEach((indices) => {
    if (indices.length < 2) return;
    const baseLat = Number(next[indices[0]].latitude);
    const baseLng = Number(next[indices[0]].longitude);
    // ~12–18m spacing at this latitude — enough to see separate pins + labels.
    const step = 0.00012;

    indices.forEach((featureIndex, i) => {
      const angle = (i / indices.length) * Math.PI * 2;
      const radius = step * (1 + Math.floor(i / 6));
      next[featureIndex] = {
        ...next[featureIndex],
        latitude: baseLat + Math.sin(angle) * radius,
        longitude: baseLng + Math.cos(angle) * radius,
      };
    });
  });

  return next;
}

function statusColorExpression(): ExpressionSpecification {
  return [
    'match',
    ['get', 'status'],
    'available',
    STATUS_FILL.available,
    'booked',
    STATUS_FILL.booked,
    'sold',
    STATUS_FILL.sold,
    'reserved',
    STATUS_FILL.reserved,
    '#64748b',
  ];
}

export default function LayoutSitePlanMap({
  layoutId,
  layout,
  plots,
  layoutName,
  layoutLocation,
  onEnquire,
  highlightPlotId = null,
  className = 'min-h-[520px] w-full',
}: LayoutSitePlanMapProps) {
  const { t } = useLocale();
  const { saleStatuses, isBookable } = usePropertyStatusConfig();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const sitePlotsRef = useRef<SitePlotFeature[]>([]);
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('satellite');
  const [mapReady, setMapReady] = useState(false);
  const [linesLoading, setLinesLoading] = useState(true);
  const [lineGeoJson, setLineGeoJson] = useState<LayoutMapGeoJson | null>(null);
  const [filter, setFilter] = useState<PlotFilter>('all');
  const [selected, setSelected] = useState<SitePlotFeature | null>(null);

  const sitePlots = useMemo(() => buildSitePlots(layout, plots), [layout, plots]);
  sitePlotsRef.current = sitePlots;

  const filteredPlots = useMemo(
    () => (filter === 'all' ? sitePlots : sitePlots.filter((plot) => plot.status === filter)),
    [filter, sitePlots]
  );

  const fallbackCenter = useMemo(() => {
    const lat = layout.latitude ?? layout.coordinates?.lat ?? layout.mapCoordinates?.lat;
    const lng = layout.longitude ?? layout.coordinates?.lng ?? layout.mapCoordinates?.lng;
    if (hasValidCoordinates(lat, lng)) return { lng: lng as number, lat: lat as number };
    return { lng: 74.9069, lat: 21.351 };
  }, [layout]);

  const filterOptions = useMemo(() => {
    const counts = Object.fromEntries(SALE_PROPERTY_STATUS_KEYS.map((key) => [key, 0])) as Record<
      string,
      number
    >;
    sitePlots.forEach((plot) => {
      counts[plot.status] = (counts[plot.status] || 0) + 1;
    });
    return [
      { key: 'all' as const, label: t('common.all') || 'All', count: sitePlots.length },
      ...saleStatuses.map((status) => ({
        key: status.key as PlotFilter,
        label: status.label,
        count: counts[status.key] || 0,
      })),
    ];
  }, [saleStatuses, sitePlots, t]);

  useEffect(() => {
    if (!highlightPlotId) return;
    const match = sitePlots.find((plot) => plot.id === highlightPlotId || plot.salePlot?._id === highlightPlotId);
    if (match) setSelected(match);
  }, [highlightPlotId, sitePlots]);

  useEffect(() => {
    let cancelled = false;
    setLinesLoading(true);
    clearLayoutMapGeoJsonCache(layoutId);
    prefetchLayoutMapGeoJson(layoutId)
      .then((data) => {
        if (!cancelled) setLineGeoJson(hasGeoJsonLines(data) ? data : null);
      })
      .catch(() => {
        if (!cancelled) setLineGeoJson(null);
      })
      .finally(() => {
        if (!cancelled) setLinesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [layoutId]);

  const fitMap = useCallback((map: MapLibreMap, lines: GeoJSON.FeatureCollection, plotFeatures: SitePlotFeature[]) => {
    const bounds = new LngLatBounds();
    let hasPoint = false;

    lines.features.forEach((feature) => {
      const geometry = feature.geometry;
      if (!geometry) return;
      if (geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach((line) =>
          line.forEach((pair) => {
            bounds.extend([pair[0], pair[1]]);
            hasPoint = true;
          })
        );
      }
    });

    plotFeatures.forEach((plot) => {
      if (plot.ring) {
        plot.ring.forEach(([lng, lat]) => {
          bounds.extend([lng, lat]);
          hasPoint = true;
        });
      } else if (hasValidCoordinates(plot.latitude, plot.longitude)) {
        bounds.extend([plot.longitude as number, plot.latitude as number]);
        hasPoint = true;
      }
    });

    if (hasPoint && !bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 56, maxZoom: MAP_FIT_MAX_ZOOM, duration: 0 });
    }
  }, []);

  const syncBasemap = useCallback((map: MapLibreMap, styleId: MapStyleId) => {
    const style = MAP_STYLES[styleId];
    ['satellite', 'osm'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    Object.entries(style.sources || {}).forEach(([id, source]) => {
      if (!map.getSource(id)) map.addSource(id, source as SourceSpecification);
    });
    (style.layers || []).forEach((layer) => {
      if (map.getLayer(layer.id)) return;
      const before = map.getLayer(LINES_LAYER) || map.getLayer(PLOTS_FILL) || map.getLayer(MARKERS_CIRCLE);
      map.addLayer(layer as LayerSpecification, before ? before.id : undefined);
    });
  }, []);

  const paintMap = useCallback(
    (map: MapLibreMap, styleId: MapStyleId, linesData: LayoutMapGeoJson | null, visiblePlots: SitePlotFeature[]) => {
      syncBasemap(map, styleId);

      const lines = toDrawableLines(linesData);
      if (!map.getSource(LINES_SOURCE)) {
        map.addSource(LINES_SOURCE, { type: 'geojson', data: lines });
      } else {
        (map.getSource(LINES_SOURCE) as GeoJSONSource).setData(lines);
      }
      if (!map.getLayer(LINES_LAYER)) {
        map.addLayer({
          id: LINES_LAYER,
          type: 'line',
          source: LINES_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ff0000', 'line-width': 1.5, 'line-opacity': 0.95 },
        });
      } else {
        map.setPaintProperty(LINES_LAYER, 'line-color', '#ff0000');
        map.setPaintProperty(LINES_LAYER, 'line-width', 1.5);
        map.setPaintProperty(LINES_LAYER, 'line-opacity', 0.95);
      }

      const polygonFeatures: GeoJSON.Feature[] = [];
      const markerFeatures: GeoJSON.Feature[] = [];

      visiblePlots.forEach((plot) => {
        const props = {
          id: plot.id,
          plotNumber: plot.plotNumber,
          status: plot.status,
        };
        if (plot.ring) {
          polygonFeatures.push({
            type: 'Feature',
            properties: props,
            geometry: { type: 'Polygon', coordinates: [plot.ring] },
          });
        }
        if (hasValidCoordinates(plot.latitude, plot.longitude)) {
          markerFeatures.push({
            type: 'Feature',
            properties: props,
            geometry: {
              type: 'Point',
              coordinates: [plot.longitude as number, plot.latitude as number],
            },
          });
        }
      });

      const polygons: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: polygonFeatures };
      const markers: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: markerFeatures };

      if (!map.getSource(PLOTS_SOURCE)) {
        map.addSource(PLOTS_SOURCE, { type: 'geojson', data: polygons });
      } else {
        (map.getSource(PLOTS_SOURCE) as GeoJSONSource).setData(polygons);
      }

      if (!map.getLayer(PLOTS_FILL)) {
        map.addLayer({
          id: PLOTS_FILL,
          type: 'fill',
          source: PLOTS_SOURCE,
          paint: {
            'fill-color': statusColorExpression(),
            'fill-opacity': 0.42,
          },
        });
      }
      if (!map.getLayer(PLOTS_OUTLINE)) {
        map.addLayer({
          id: PLOTS_OUTLINE,
          type: 'line',
          source: PLOTS_SOURCE,
          paint: {
            'line-color': statusColorExpression(),
            'line-width': 2.5,
            'line-opacity': 1,
          },
        });
      }

      if (!map.getSource(MARKERS_SOURCE)) {
        map.addSource(MARKERS_SOURCE, { type: 'geojson', data: markers });
      } else {
        (map.getSource(MARKERS_SOURCE) as GeoJSONSource).setData(markers);
      }

      if (!map.getLayer(MARKERS_CIRCLE)) {
        map.addLayer({
          id: MARKERS_CIRCLE,
          type: 'circle',
          source: MARKERS_SOURCE,
          paint: {
            'circle-radius': 7,
            'circle-color': statusColorExpression(),
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
      if (!map.getLayer(MARKERS_LABEL)) {
        map.addLayer({
          id: MARKERS_LABEL,
          type: 'symbol',
          source: MARKERS_SOURCE,
          layout: {
            'text-field': ['get', 'plotNumber'],
            'text-size': 11,
            'text-offset': [0, 1.35],
            'text-anchor': 'top',
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#0f172a',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5,
          },
        });
      }

      try {
        map.moveLayer(LINES_LAYER);
        map.moveLayer(PLOTS_FILL);
        map.moveLayer(PLOTS_OUTLINE);
        map.moveLayer(MARKERS_CIRCLE);
        map.moveLayer(MARKERS_LABEL);
      } catch {
        /* ignore */
      }

      fitMap(map, lines, visiblePlots);
      map.resize();
    },
    [fitMap, syncBasemap]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#d1d5db' } }],
      },
      center: [fallbackCenter.lng, fallbackCenter.lat],
      zoom: 16,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new FullscreenControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.resize();
      setMapReady(true);
    });

    const onClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id;
      if (!id) {
        setSelected(null);
        return;
      }
      const match = sitePlotsRef.current.find((plot) => plot.id === String(id));
      setSelected(match || null);
    };

    map.on('click', PLOTS_FILL, onClick);
    map.on('click', MARKERS_CIRCLE, onClick);
    map.on('mouseenter', PLOTS_FILL, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', PLOTS_FILL, () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', MARKERS_CIRCLE, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', MARKERS_CIRCLE, () => {
      map.getCanvas().style.cursor = '';
    });

    const onResize = () => map.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per layout
  }, [layoutId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || linesLoading) return;
    try {
      paintMap(map, mapStyleId, lineGeoJson, filteredPlots);
    } catch (err) {
      console.error('Failed to paint site plan map', err);
    }
  }, [filteredPlots, lineGeoJson, linesLoading, mapReady, mapStyleId, paintMap]);

  const selectedSalePlot = selected?.salePlot;
  const selectedAsPlot: Plot | null = selectedSalePlot
    ? selectedSalePlot
    : selected
      ? ({
          _id: selected.id,
          layoutId,
          plotNumber: selected.plotNumber,
          size: selected.size || '',
          price: selected.price,
          status: (selected.status as Plot['status']) || 'available',
          coordinates: { x: 0, y: 0 },
          latitude: selected.latitude,
          longitude: selected.longitude,
          boundaryPath: selected.ring
            ? selected.ring.map(([lng, lat]) => ({ lat, lng }))
            : null,
          description: '',
        } as Plot)
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === option.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
            <span className="ml-1 opacity-80">({option.count})</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          {filteredPlots.length} registered {filteredPlots.length === 1 ? 'plot' : 'plots'}
        </span>
      </div>

      {sitePlots.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No plots registered for sale yet. The map shows the layout border from the KML file. Plots appear
          here only after Admin adds them.
        </p>
      ) : null}

      <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${className}`}>
        <div ref={containerRef} className="h-full w-full" style={{ minHeight: 520 }} />

        <MapTypeToggle mapStyleId={mapStyleId} onChange={setMapStyleId} styles={['street', 'satellite']} />

        {linesLoading ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-gray-800 shadow">
              Loading layout map…
            </span>
          </div>
        ) : null}

        {getMapAttribution(mapStyleId) ? (
          <div className="pointer-events-none absolute bottom-1 right-2 z-10 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
            {getMapAttribution(mapStyleId)}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 ring-1 ring-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('common.legend')}</p>
        {(saleStatuses.length ? saleStatuses : FALLBACK_PROPERTY_STATUSES.filter((s) => SALE_PROPERTY_STATUS_KEYS.includes(s.key))).map(
          (status) => (
            <span key={status.key} className="inline-flex items-center gap-1.5 text-xs text-gray-700">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: status.colors.indicator }}
              />
              {status.label}
            </span>
          )
        )}
      </div>

      {selectedAsPlot ? (
        <PropertyDetailsPanel
          property={plotToMapProperty(selectedAsPlot, {
            layoutId,
            layoutName,
            layoutLocation,
            layoutCoordinates: layout.coordinates,
          })}
          onClose={() => setSelected(null)}
          footer={
            <div className="space-y-3">
              {selectedSalePlot?.sellerName ? (
                <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('plotMap.ownerLabel')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedSalePlot.sellerName}</p>
                  <p className="mt-1 text-xs text-gray-500">{t('plotMap.ownerContactViaAdmin')}</p>
                </div>
              ) : null}

              <div className="rounded-xl bg-primary-50 px-4 py-3 ring-1 ring-primary-100">
                <p className="text-sm font-semibold text-primary-900">{t('plotMap.contactAdminTitle')}</p>
                <p className="mt-1 text-sm text-primary-800/80">{t('plotMap.contactAdminHint')}</p>
              </div>
              {onEnquire && selectedSalePlot && isBookable(selectedSalePlot.status) ? (
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => {
                    onEnquire(selectedSalePlot);
                    setSelected(null);
                  }}
                >
                  {t('plotMap.submitEnquiry')}
                </button>
              ) : null}
            </div>
          }
        />
      ) : null}
    </div>
  );
}
