import { api } from '@/lib/api';

export interface LayoutMapGeoJson {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties?: Record<string, unknown>;
    geometry?: {
      type: string;
      coordinates?: number[][] | number[][][];
    };
  }>;
  meta?: {
    sourceLineCount?: number;
    featureCount?: number;
    edgeCount?: number;
  };
  layoutId?: string;
  name?: string;
}

const cache = new Map<string, Promise<LayoutMapGeoJson>>();
const resolved = new Map<string, LayoutMapGeoJson>();

export function getCachedLayoutMapGeoJson(layoutId: string): LayoutMapGeoJson | null {
  return resolved.get(layoutId) ?? null;
}

export function clearLayoutMapGeoJsonCache(layoutId?: string) {
  if (layoutId) {
    cache.delete(layoutId);
    resolved.delete(layoutId);
    return;
  }
  cache.clear();
  resolved.clear();
}

export function prefetchLayoutMapGeoJson(layoutId: string): Promise<LayoutMapGeoJson> {
  if (!layoutId) {
    return Promise.resolve({ type: 'FeatureCollection', features: [] });
  }

  const existing = cache.get(layoutId);
  if (existing) return existing;

  const request = api
    .get<LayoutMapGeoJson>(`/layouts/${encodeURIComponent(layoutId)}/map-geojson`)
    .then((data) => {
      const geoJson: LayoutMapGeoJson = {
        type: 'FeatureCollection',
        features: Array.isArray(data?.features) ? data.features : [],
        meta: data?.meta,
        layoutId: data?.layoutId || layoutId,
        name: data?.name,
      };
      resolved.set(layoutId, geoJson);
      return geoJson;
    })
    .catch((err) => {
      cache.delete(layoutId);
      throw err;
    });

  cache.set(layoutId, request);
  return request;
}

export function computeGeoJsonBounds(
  geoJson: LayoutMapGeoJson | null
): [[number, number], [number, number]] | null {
  if (!geoJson?.features?.length) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const extend = (lng: number, lat: number) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  };

  const walk = (coords: unknown) => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      extend(coords[0] as number, coords[1] as number);
      return;
    }
    coords.forEach((item) => walk(item));
  };

  geoJson.features.forEach((feature) => walk(feature.geometry?.coordinates));

  if (!Number.isFinite(minLng)) return null;

  if (minLng === maxLng && minLat === maxLat) {
    const pad = 0.002;
    return [
      [minLng - pad, minLat - pad],
      [maxLng + pad, maxLat + pad],
    ];
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function hasGeoJsonLines(geoJson: LayoutMapGeoJson | null | undefined): boolean {
  return Boolean(
    geoJson?.features?.some((feature) => {
      const type = String(feature.geometry?.type || '');
      const coords = feature.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length === 0) return false;
      return /line/i.test(type) || type === 'Polygon' || type === 'MultiPolygon' || !type;
    })
  );
}
