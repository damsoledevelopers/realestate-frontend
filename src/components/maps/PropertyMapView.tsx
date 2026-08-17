'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AdvancedMarker,
  Map,
  Pin,
  Polygon,
  useMap,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { GOOGLE_MAPS_MAP_ID, hasValidCoordinates } from '@/lib/googleMaps';
import { PROPERTY_TYPE_COLORS } from '@/lib/properties';
import { LatLngPoint, MapProperty } from '@/lib/types';
import PropertyDetailsPanel from '@/components/property/PropertyDetailsPanel';

interface PropertyMapViewProps {
  properties: MapProperty[];
  className?: string;
  focusPropertyId?: string | null;
}

function FocusProperty({ property }: { property: MapProperty | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !property) return;

    if (property.boundary && property.boundary.length >= 3) {
      const bounds = new google.maps.LatLngBounds();
      property.boundary.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, { top: 64, right: 64, bottom: 64, left: 64 });
      return;
    }

    map.panTo({ lat: property.latitude, lng: property.longitude });
    map.setZoom(17);
  }, [map, property]);

  return null;
}

function FitBoundsToProperties({ properties }: { properties: MapProperty[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || properties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    properties.forEach((property) => {
      if (property.boundary?.length) {
        property.boundary.forEach((point) => bounds.extend(point));
      } else if (hasValidCoordinates(property.latitude, property.longitude)) {
        bounds.extend({ lat: property.latitude, lng: property.longitude });
      }
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    }
  }, [map, properties]);

  return null;
}

function PropertyPolygon({
  property,
  onSelect,
}: {
  property: MapProperty;
  onSelect: (property: MapProperty) => void;
}) {
  const colors = PROPERTY_TYPE_COLORS[property.propertyType];
  const paths = property.boundary as LatLngPoint[];

  return (
    <Polygon
      paths={paths}
      fillColor={colors.fill}
      fillOpacity={0.35}
      strokeColor={colors.stroke}
      strokeOpacity={0.9}
      strokeWeight={2}
      clickable
      onClick={() => onSelect(property)}
    />
  );
}

function PropertyPointMarker({
  property,
  selected,
  onSelect,
}: {
  property: MapProperty;
  selected: boolean;
  onSelect: (property: MapProperty) => void;
}) {
  const colors = PROPERTY_TYPE_COLORS[property.propertyType];

  return (
    <AdvancedMarker
      position={{ lat: property.latitude, lng: property.longitude }}
      onClick={() => onSelect(property)}
      title={property.name}
      zIndex={selected ? 1000 : 1}
    >
      <Pin background={colors.marker} borderColor={colors.stroke} glyphColor="#ffffff" />
    </AdvancedMarker>
  );
}

function MarkerClusterLayer({
  properties,
  onSelect,
}: {
  properties: MapProperty[];
  onSelect: (property: MapProperty) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || properties.length === 0) return;

    const markers = properties.map((property) => {
      const colors = PROPERTY_TYPE_COLORS[property.propertyType];
      const pin = new google.maps.marker.PinElement({
        background: colors.marker,
        borderColor: colors.stroke,
        glyphColor: '#ffffff',
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: property.latitude, lng: property.longitude },
        title: property.name,
        content: pin.element,
      });

      marker.addListener('click', () => onSelect(property));
      return marker;
    });

    const clusterer = new MarkerClusterer({ map, markers });

    return () => {
      clusterer.clearMarkers();
      markers.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [map, properties, onSelect]);

  return null;
}

export default function PropertyMapView({
  properties,
  className = '',
  focusPropertyId = null,
}: PropertyMapViewProps) {
  const focusProperty = useMemo(
    () => properties.find((property) => property.id === focusPropertyId) ?? null,
    [properties, focusPropertyId]
  );

  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);

  useEffect(() => {
    if (focusProperty) {
      setSelectedProperty(focusProperty);
    }
  }, [focusProperty]);

  const handleSelect = useCallback((property: MapProperty) => {
    setSelectedProperty(property);
  }, []);

  const { polygonProperties, pointProperties } = useMemo(() => {
    const polygons: MapProperty[] = [];
    const points: MapProperty[] = [];

    properties.forEach((property) => {
      if (property.boundary && property.boundary.length >= 3) {
        polygons.push(property);
      } else if (hasValidCoordinates(property.latitude, property.longitude)) {
        points.push(property);
      }
    });

    return { polygonProperties: polygons, pointProperties: points };
  }, [properties]);

  const defaultCenter = useMemo(() => {
    if (properties.length === 0) return { lat: 20.5937, lng: 78.9629 };
    const lat =
      properties.reduce((sum, property) => sum + property.latitude, 0) / properties.length;
    const lng =
      properties.reduce((sum, property) => sum + property.longitude, 0) / properties.length;
    return { lat, lng };
  }, [properties]);

  const useClustering = pointProperties.length >= 25;

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border border-gray-200 ${className}`}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={properties.length === 1 ? 15 : 7}
          mapId={GOOGLE_MAPS_MAP_ID}
          gestureHandling="cooperative"
          fullscreenControl
          zoomControl
          mapTypeControl
          streetViewControl={false}
          style={{ width: '100%', height: '100%', minHeight: '420px' }}
          reuseMaps
          onClick={() => setSelectedProperty(null)}
        >
          {focusProperty ? (
            <FocusProperty property={focusProperty} />
          ) : (
            <FitBoundsToProperties properties={properties} />
          )}

          {polygonProperties.map((property) => (
            <PropertyPolygon key={property.id} property={property} onSelect={handleSelect} />
          ))}

          {useClustering ? (
            <MarkerClusterLayer properties={pointProperties} onSelect={handleSelect} />
          ) : (
            pointProperties.map((property) => (
              <PropertyPointMarker
                key={property.id}
                property={property}
                selected={selectedProperty?.id === property.id}
                onSelect={handleSelect}
              />
            ))
          )}
        </Map>
      </div>

      {selectedProperty && (
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
      )}
    </>
  );
}
