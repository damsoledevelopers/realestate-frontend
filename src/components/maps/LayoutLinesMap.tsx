'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  FullscreenControl,
  LngLatBounds,
  type GeoJSONSource,
  type SourceSpecification,
  type LayerSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapTypeToggle from '@/components/maps/MapTypeToggle';
import {
  clearLayoutMapGeoJsonCache,
  prefetchLayoutMapGeoJson,
  hasGeoJsonLines,
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
import { Layout, LatLngPoint } from '@/lib/types';

ensureMapLibreWorker();

interface LayoutLinesMapProps {
  layoutId: string;
  layout?: Layout | null;
  className?: string;
  /** Optional preloaded GeoJSON from parent (avoids race after KML upload). */
  initialGeoJson?: LayoutMapGeoJson | null;
}

const SOURCE_ID = 'layout-lines';
const CASING_ID = 'layout-lines-casing';
const STROKE_ID = 'layout-lines-stroke';

function boundaryPathToGeoJson(path?: LatLngPoint[] | null): LayoutMapGeoJson | null {
  if (!path || path.length < 2) return null;
  const coordinates = path.map((point) => [Number(point.lng), Number(point.lat)] as [number, number]);
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coordinates.push([...first]);
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'layout-boundary' },
        geometry: { type: 'LineString', coordinates },
      },
    ],
  };
}

function toDrawableCollection(data: LayoutMapGeoJson | null | undefined): GeoJSON.FeatureCollection {
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

    if (type === 'LineString') {
      pushLine(coords as number[][]);
    } else if (type === 'MultiLineString') {
      (coords as number[][][]).forEach((line) => pushLine(line));
    } else if (type === 'Polygon' && Array.isArray(coords[0])) {
      pushLine(coords[0] as number[][]);
    } else if (type === 'MultiPolygon' && Array.isArray(coords[0]) && Array.isArray((coords[0] as number[][])[0])) {
      const ring = (coords as unknown as number[][][][])[0]?.[0];
      if (ring) pushLine(ring);
    }
  });

  // One MultiLineString is much cheaper for MapLibre's worker than hundreds of LineStrings.
  if (!lineCoords.length) {
    return { type: 'FeatureCollection', features: [] };
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'layout-border', lineCount: lineCoords.length },
        geometry: { type: 'MultiLineString', coordinates: lineCoords },
      },
    ],
  };
}

function collectionBounds(collection: GeoJSON.FeatureCollection): LngLatBounds | null {
  const bounds = new LngLatBounds();
  let hasPoint = false;
  collection.features.forEach((feature) => {
    const geometry = feature.geometry;
    if (!geometry) return;
    if (geometry.type === 'LineString') {
      geometry.coordinates.forEach((pair) => {
        bounds.extend([pair[0], pair[1]]);
        hasPoint = true;
      });
    } else if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((line) => {
        line.forEach((pair) => {
          bounds.extend([pair[0], pair[1]]);
          hasPoint = true;
        });
      });
    }
  });
  return hasPoint ? bounds : null;
}

function ensureLineLayers(map: MapLibreMap) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  if (!map.getLayer(CASING_ID)) {
    map.addLayer({
      id: CASING_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': 5, 'line-opacity': 1 },
    });
  }

  if (!map.getLayer(STROKE_ID)) {
    map.addLayer({
      id: STROKE_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ff0000', 'line-width': 3, 'line-opacity': 1 },
    });
  }

  try {
    map.moveLayer(CASING_ID);
    map.moveLayer(STROKE_ID);
  } catch {
    /* ignore */
  }
}

function applyLines(map: MapLibreMap, collection: GeoJSON.FeatureCollection, lineCount: number) {
  ensureLineLayers(map);
  const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
  if (!source) return;

  source.setData(collection);

  const bounds = collectionBounds(collection);
  if (bounds && !bounds.isEmpty() && lineCount > 0) {
    map.fitBounds(bounds, { padding: 64, maxZoom: MAP_FIT_MAX_ZOOM, duration: 0 });
  }
}

function syncBasemap(map: MapLibreMap, styleId: MapStyleId) {
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
    const before = map.getLayer(CASING_ID) ? CASING_ID : undefined;
    map.addLayer(layer as LayerSpecification, before);
  });

  // Keep CAD lines above basemap tiles after basemap swap.
  ensureLineLayers(map);
}

export default function LayoutLinesMap({
  layoutId,
  layout = null,
  className = 'min-h-[400px] w-full rounded-xl',
  initialGeoJson = null,
}: LayoutLinesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const geoJsonRef = useRef<LayoutMapGeoJson | null>(initialGeoJson);
  const appliedSigRef = useRef<string>('');
  const mapStyleRef = useRef<MapStyleId>('satellite');
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('satellite');
  const [linesLoading, setLinesLoading] = useState(!hasGeoJsonLines(initialGeoJson));
  const [lineCount, setLineCount] = useState(() => {
    if (!hasGeoJsonLines(initialGeoJson)) return 0;
    return toDrawableCollection(initialGeoJson).features[0]?.properties?.lineCount || initialGeoJson?.features?.length || 0;
  });
  const [geoJson, setGeoJson] = useState<LayoutMapGeoJson | null>(initialGeoJson);
  const [mapReady, setMapReady] = useState(false);

  const fallbackCenter = useMemo(() => {
    const lat = layout?.latitude ?? layout?.coordinates?.lat ?? layout?.mapCoordinates?.lat;
    const lng = layout?.longitude ?? layout?.coordinates?.lng ?? layout?.mapCoordinates?.lng;
    if (hasValidCoordinates(lat, lng)) return { lng: lng as number, lat: lat as number };
    return { lng: 74.9069, lat: 21.351 };
  }, [layout]);

  mapStyleRef.current = mapStyleId;

  // 1) Load GeoJSON. Keep any prefetched/initial data visible while refreshing.
  useEffect(() => {
    let cancelled = false;
    const hasInitial = hasGeoJsonLines(initialGeoJson);
    const boundaryFallback = boundaryPathToGeoJson(layout?.boundaryPath);

    if (hasInitial) {
      geoJsonRef.current = initialGeoJson;
      setGeoJson(initialGeoJson);
      const count =
        toDrawableCollection(initialGeoJson).features[0]?.properties?.lineCount ||
        initialGeoJson?.features?.length ||
        0;
      setLineCount(Number(count) || 0);
      setLinesLoading(false);
    } else {
      setLinesLoading(true);
    }

    clearLayoutMapGeoJsonCache(layoutId);

    prefetchLayoutMapGeoJson(layoutId)
      .then((data) => {
        if (cancelled) return;
        if (hasGeoJsonLines(data)) {
          geoJsonRef.current = data;
          setGeoJson(data);
          const count =
            toDrawableCollection(data).features[0]?.properties?.lineCount || data.features.length;
          setLineCount(Number(count) || 0);
        } else if (boundaryFallback && hasGeoJsonLines(boundaryFallback)) {
          geoJsonRef.current = boundaryFallback;
          setGeoJson(boundaryFallback);
          setLineCount(1);
        } else if (!hasInitial) {
          geoJsonRef.current = null;
          setGeoJson(null);
          setLineCount(0);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (hasGeoJsonLines(geoJsonRef.current)) return;
        if (boundaryFallback && hasGeoJsonLines(boundaryFallback)) {
          geoJsonRef.current = boundaryFallback;
          setGeoJson(boundaryFallback);
          setLineCount(1);
        } else {
          setLineCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLinesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Only refetch when layout identity changes — not on every parent object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialGeoJson used once as seed
  }, [layoutId, layout?.boundaryPath]);

  // 2) Create map once per layout.
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: {
        version: 8,
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
    appliedSigRef.current = '';

    map.on('load', () => {
      map.resize();
      syncBasemap(map, mapStyleRef.current);
      ensureLineLayers(map);

      const current = geoJsonRef.current;
      if (current && hasGeoJsonLines(current)) {
        const drawable = toDrawableCollection(current);
        const count = Number(drawable.features[0]?.properties?.lineCount) || 0;
        if (count > 0) {
          applyLines(map, drawable, count);
          appliedSigRef.current = `${layoutId}:${count}`;
          setLineCount(count);
        }
      }
      setMapReady(true);
    });

    const onResize = () => map.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
      appliedSigRef.current = '';
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per layout
  }, [layoutId]);

  // 3) Paint lines when GeoJSON arrives (once per signature — avoid setData thrash).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!geoJson || !hasGeoJsonLines(geoJson)) return;

    const drawable = toDrawableCollection(geoJson);
    const count = Number(drawable.features[0]?.properties?.lineCount) || 0;
    if (!count) return;

    const signature = `${layoutId}:${count}`;
    if (appliedSigRef.current === signature) return;

    try {
      applyLines(map, drawable, count);
      appliedSigRef.current = signature;
      setLineCount(count);
      map.resize();
    } catch (err) {
      console.error('Failed to draw layout lines', err);
    }
  }, [geoJson, mapReady, layoutId]);

  // 4) Basemap toggle only — do not re-set GeoJSON (that stuck the worker).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    try {
      syncBasemap(map, mapStyleId);
      map.resize();
    } catch (err) {
      console.error('Failed to switch basemap', err);
    }
  }, [mapStyleId, mapReady]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${className}`}>
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: 420 }} />

      <MapTypeToggle
        mapStyleId={mapStyleId}
        onChange={setMapStyleId}
        styles={['street', 'satellite']}
      />

      {linesLoading ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-gray-800 shadow">
            Loading layout border…
          </span>
        </div>
      ) : null}

      {!linesLoading && lineCount > 0 ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
          Layout border · {lineCount} lines
        </div>
      ) : null}

      {!linesLoading && lineCount === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow">
            {(layout?.mapLineCount ?? 0) > 0 || layout?.layoutFileName || layout?.hasMapGeoJson
              ? 'KML is saved but the border could not be drawn — refresh the page'
              : 'No KML border yet — edit layout and upload the KML file'}
          </span>
        </div>
      ) : null}

      {getMapAttribution(mapStyleId) ? (
        <div className="pointer-events-none absolute bottom-1 right-2 z-10 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
          {getMapAttribution(mapStyleId)}
        </div>
      ) : null}
    </div>
  );
}
