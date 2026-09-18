import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';
import { PROPERTY_TYPE_COLORS } from '@/lib/properties';
import { hasValidCoordinates } from '@/lib/googleMaps';
import { LatLngPoint, MapProperty, PropertyType } from '@/lib/types';

export type MapStyleId = 'plan' | 'street' | 'satellite';

const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
const ESRI_ATTRIBUTION = '© Esri, Maxar, Earthstar Geographics';

/**
 * Esri World Imagery shows gray "Map data not yet available" past ~z18.
 * Cap sources + map so MapLibre overzooms existing tiles instead.
 */
export const MAP_MAX_ZOOM = 18;
export const MAP_FIT_MAX_ZOOM = 17;

export const MAP_STYLE_LABELS: Record<MapStyleId, string> = {
  plan: 'Plan',
  street: 'Map',
  satellite: 'Satellite',
};

/** Free raster tiles — no API key required. Plan = white canvas for instant CAD lines. */
export const MAP_STYLES: Record<MapStyleId, StyleSpecification> = {
  plan: {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#ffffff' },
      },
    ],
  },
  street: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: MAP_MAX_ZOOM,
        attribution: OSM_ATTRIBUTION,
      },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
  },
  satellite: {
    version: 8,
    sources: {
      satellite: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: MAP_MAX_ZOOM,
        attribution: ESRI_ATTRIBUTION,
      },
    },
    layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
  },
};

export function getMapAttribution(styleId: MapStyleId): string {
  if (styleId === 'satellite') return ESRI_ATTRIBUTION;
  if (styleId === 'street') return OSM_ATTRIBUTION;
  return '';
}

function toCoord(point: LatLngPoint): [number, number] {
  return [point.lng, point.lat];
}

function closeRing(points: LatLngPoint[]): [number, number][] {
  if (points.length === 0) return [];
  const ring = points.map(toCoord);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first);
  }
  return ring;
}

const PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_COLORS) as PropertyType[];

function colorMatch(property: 'fill' | 'stroke' | 'marker'): ExpressionSpecification {
  const expression: unknown[] = ['match', ['get', 'propertyType']];
  for (const type of PROPERTY_TYPES) {
    expression.push(type, PROPERTY_TYPE_COLORS[type][property]);
  }
  expression.push('#64748b');
  return expression as ExpressionSpecification;
}

export const POLYGON_FILL_COLOR = colorMatch('fill');
export const POLYGON_STROKE_COLOR = colorMatch('stroke');
export const POLYLINE_COLOR: ExpressionSpecification = [
  'case',
  ['all', ['==', ['get', 'propertyType'], 'layout'], ['==', ['get', 'geometryKind'], 'polyline']],
  '#ff0000',
  colorMatch('stroke'),
];
export const POINT_COLOR = colorMatch('marker');

export interface PropertyMapGeoJson {
  polygons: GeoJSON.FeatureCollection;
  polylines: GeoJSON.FeatureCollection;
  points: GeoJSON.FeatureCollection;
}

export function buildPropertyMapGeoJson(properties: MapProperty[]): PropertyMapGeoJson {
  const polygonFeatures: GeoJSON.Feature[] = [];
  const polylineFeatures: GeoJSON.Feature[] = [];
  const pointFeatures: GeoJSON.Feature[] = [];

  properties.forEach((property) => {
    const baseProps = {
      id: property.id,
      propertyType: property.propertyType,
      name: property.name,
    };

    if (property.boundary && property.boundary.length >= 3) {
      polygonFeatures.push({
        type: 'Feature',
        properties: { ...baseProps, geometryKind: 'polygon' },
        geometry: {
          type: 'Polygon',
          coordinates: [closeRing(property.boundary)],
        },
      });
    }

    property.polylines?.forEach((path, index) => {
      if (path.length < 2) return;
      polylineFeatures.push({
        type: 'Feature',
        properties: { ...baseProps, geometryKind: 'polyline', lineIndex: index },
        geometry: {
          type: 'LineString',
          coordinates: path.map(toCoord),
        },
      });
    });

    const hasGeometry =
      (property.boundary && property.boundary.length >= 3) ||
      (property.polylines && property.polylines.some((path) => path.length >= 2));

    if (!hasGeometry && hasValidCoordinates(property.latitude, property.longitude)) {
      pointFeatures.push({
        type: 'Feature',
        properties: { ...baseProps, geometryKind: 'point' },
        geometry: {
          type: 'Point',
          coordinates: [property.longitude, property.latitude],
        },
      });
    }
  });

  return {
    polygons: { type: 'FeatureCollection', features: polygonFeatures },
    polylines: { type: 'FeatureCollection', features: polylineFeatures },
    points: { type: 'FeatureCollection', features: pointFeatures },
  };
}

export function computePropertyBounds(
  properties: MapProperty[],
  focusPropertyId?: string | null
): [[number, number], [number, number]] | null {
  const targets = focusPropertyId
    ? properties.filter((property) => property.id === focusPropertyId)
    : properties;

  if (targets.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const extend = (lng: number, lat: number) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  };

  targets.forEach((property) => {
    property.boundary?.forEach((point) => extend(point.lng, point.lat));
    property.polylines?.forEach((path) => path.forEach((point) => extend(point.lng, point.lat)));
    if (hasValidCoordinates(property.latitude, property.longitude)) {
      extend(property.longitude, property.latitude);
    }
  });

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

export function computeDefaultCenter(properties: MapProperty[]): { lat: number; lng: number } {
  if (properties.length === 0) return { lat: 20.5937, lng: 78.9629 };
  const lat = properties.reduce((sum, property) => sum + property.latitude, 0) / properties.length;
  const lng = properties.reduce((sum, property) => sum + property.longitude, 0) / properties.length;
  return { lat, lng };
}

export const INTERACTIVE_LAYER_IDS = [
  'property-polygons-fill',
  'property-polylines',
  'property-points',
  'property-clusters',
] as const;
