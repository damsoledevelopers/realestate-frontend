'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Map, { Layer, Source, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapTypeToggle from '@/components/maps/MapTypeToggle';
import PropertyDetailsPanel from '@/components/property/PropertyDetailsPanel';
import {
  buildPropertyMapGeoJson,
  computeDefaultCenter,
  computePropertyBounds,
  getMapAttribution,
  INTERACTIVE_LAYER_IDS,
  MAP_MAX_ZOOM,
  MAP_STYLES,
  MapStyleId,
  POINT_COLOR,
  POLYGON_FILL_COLOR,
  POLYGON_STROKE_COLOR,
  POLYLINE_COLOR,
} from '@/lib/maplibre';
import { ensureMapLibreWorker } from '@/lib/maplibreWorker';
import { MapProperty } from '@/lib/types';

ensureMapLibreWorker();

interface PropertyMapViewProps {
  properties: MapProperty[];
  className?: string;
  focusPropertyId?: string | null;
  /** When false, map is view-only (no details modal on click or focus). */
  showDetailsPanel?: boolean;
}

export default function PropertyMapView({
  properties,
  className = '',
  focusPropertyId = null,
  showDetailsPanel = true,
}: PropertyMapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('satellite');
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const geoJson = useMemo(() => buildPropertyMapGeoJson(properties), [properties]);
  const defaultCenter = useMemo(() => computeDefaultCenter(properties), [properties]);
  const useClustering = geoJson.points.features.length >= 25;

  const fitToProperties = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const bounds = computePropertyBounds(properties, focusPropertyId);
    if (!bounds) return;

    map.fitBounds(bounds, {
      padding: 48,
      maxZoom: MAP_MAX_ZOOM,
      duration: focusPropertyId ? 400 : 0,
    });
  }, [properties, focusPropertyId]);

  useEffect(() => {
    if (!mapReady) return;
    fitToProperties();
  }, [mapReady, fitToProperties, mapStyleId]);

  const findPropertyById = useCallback(
    (id: string | undefined) => properties.find((property) => property.id === id) ?? null,
    [properties]
  );

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!showDetailsPanel) return;

      const feature = event.features?.[0];
      if (!feature) {
        setSelectedProperty(null);
        return;
      }

      const property = findPropertyById(String(feature.properties?.id ?? ''));
      if (property) setSelectedProperty(property);
    },
    [findPropertyById, showDetailsPanel]
  );

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!showDetailsPanel) return;
      const canvas = mapRef.current?.getMap()?.getCanvas();
      if (!canvas) return;
      canvas.style.cursor = event.features?.length ? 'pointer' : '';
    },
    [showDetailsPanel]
  );

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border border-gray-200 ${className}`}>
        <Map
          ref={mapRef}
          mapStyle={MAP_STYLES[mapStyleId]}
          initialViewState={{
            longitude: defaultCenter.lng,
            latitude: defaultCenter.lat,
            zoom: properties.length === 1 ? 16 : 7,
          }}
          style={{ width: '100%', height: '100%', minHeight: '420px' }}
          maxZoom={MAP_MAX_ZOOM}
          interactiveLayerIds={showDetailsPanel ? [...INTERACTIVE_LAYER_IDS] : []}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onLoad={() => {
            setMapReady(true);
            fitToProperties();
          }}
          attributionControl={false}
          reuseMaps
        >
          <NavigationControl position="top-right" showCompass={false} />
          <FullscreenControl position="top-right" />

          {geoJson.polygons.features.length > 0 ? (
            <Source id="property-polygons" type="geojson" data={geoJson.polygons}>
              <Layer
                id="property-polygons-fill"
                type="fill"
                paint={{
                  'fill-color': POLYGON_FILL_COLOR,
                  'fill-opacity': 0.35,
                }}
              />
              <Layer
                id="property-polygons-outline"
                type="line"
                paint={{
                  'line-color': POLYGON_STROKE_COLOR,
                  'line-width': 2,
                  'line-opacity': 0.9,
                }}
              />
            </Source>
          ) : null}

          {geoJson.polylines.features.length > 0 ? (
            <Source id="property-polylines" type="geojson" data={geoJson.polylines}>
              <Layer
                id="property-polylines"
                type="line"
                paint={{
                  'line-color': POLYLINE_COLOR,
                  'line-width': 2,
                  'line-opacity': 0.95,
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          ) : null}

          {geoJson.points.features.length > 0 ? (
            <Source
              id="property-points"
              type="geojson"
              data={geoJson.points}
              cluster={useClustering}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              {useClustering ? (
                <>
                  <Layer
                    id="property-clusters"
                    type="circle"
                    filter={['has', 'point_count']}
                    paint={{
                      'circle-color': '#2563eb',
                      'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 25, 28],
                      'circle-opacity': 0.85,
                    }}
                  />
                  <Layer
                    id="property-cluster-count"
                    type="symbol"
                    filter={['has', 'point_count']}
                    layout={{
                      'text-field': '{point_count_abbreviated}',
                      'text-size': 12,
                    }}
                    paint={{ 'text-color': '#ffffff' }}
                  />
                </>
              ) : null}
              <Layer
                id="property-points"
                type="circle"
                {...(useClustering ? { filter: ['!', ['has', 'point_count']] as const } : {})}
                paint={{
                  'circle-color': POINT_COLOR,
                  'circle-radius': 8,
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-width': 2,
                }}
              />
            </Source>
          ) : null}
        </Map>

        <MapTypeToggle mapStyleId={mapStyleId} onChange={setMapStyleId} />

        <div className="pointer-events-none absolute bottom-1 right-2 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
          {getMapAttribution(mapStyleId)}
        </div>
      </div>

      {showDetailsPanel && selectedProperty ? (
        <PropertyDetailsPanel
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          footer={
            selectedProperty.linkedLayoutId ? (
              <Link
                href={`/layouts/${selectedProperty.linkedLayoutId}`}
                className="btn-primary w-full text-center"
                onClick={() => setSelectedProperty(null)}
              >
                View layout &amp; plots
              </Link>
            ) : undefined
          }
        />
      ) : null}
    </>
  );
}
