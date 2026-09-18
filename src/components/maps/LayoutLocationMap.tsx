'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapTypeToggle from '@/components/maps/MapTypeToggle';
import {
  getMapAttribution,
  MAP_MAX_ZOOM,
  MAP_STYLES,
  MapStyleId,
} from '@/lib/maplibre';
import { ensureMapLibreWorker } from '@/lib/maplibreWorker';
import { getDirectionsUrl } from '@/lib/googleMaps';

ensureMapLibreWorker();

interface LayoutLocationMapProps {
  lat: number;
  lng: number;
  layoutName: string;
  address: string;
  layoutId?: string;
}

export default function LayoutLocationMap({
  lat,
  lng,
  layoutName,
  address,
  layoutId,
}: LayoutLocationMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mounted, setMounted] = useState(false);
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>('satellite');
  const [infoOpen, setInfoOpen] = useState(false);
  const directionsUrl = getDirectionsUrl(lat, lng, address);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMarkerClick = useCallback((event: { originalEvent: MouseEvent }) => {
    event.originalEvent.stopPropagation();
    setInfoOpen((open) => !open);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-gray-200">
        <Map
          ref={mapRef}
          mapStyle={MAP_STYLES[mapStyleId]}
          initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
          style={{ width: '100%', height: '400px' }}
          maxZoom={MAP_MAX_ZOOM}
          onClick={() => setInfoOpen(false)}
          attributionControl={false}
          reuseMaps
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Marker longitude={lng} latitude={lat} anchor="bottom" onClick={handleMarkerClick}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-green-600 text-white shadow-lg">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
            </div>
          </Marker>
        </Map>

        <MapTypeToggle mapStyleId={mapStyleId} onChange={setMapStyleId} />

        {infoOpen ? (
          <div className="absolute bottom-4 left-4 z-10 max-w-[240px] rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg">
            <p className="font-semibold text-gray-900">{layoutName}</p>
            <p className="mt-1 text-gray-600">{address}</p>
            {layoutId ? (
              <Link
                href={`/layouts/${layoutId}`}
                className="mt-2 inline-block font-medium text-primary-600 hover:underline"
              >
                View layout details
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-1 right-2 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
          {getMapAttribution(mapStyleId)}
        </div>
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary inline-flex text-sm"
      >
        Get Directions
      </a>
    </div>
  );
}
