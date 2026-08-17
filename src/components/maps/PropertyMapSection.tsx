'use client';

import { useCallback, useMemo, useState } from 'react';
import PropertyMapView from '@/components/maps/PropertyMapView';
import PropertyMapEmptyState from '@/components/maps/PropertyMapEmptyState';
import PropertyMapLegend from '@/components/maps/PropertyMapLegend';
import { useLayouts } from '@/hooks/useLayouts';
import { useMapProperties } from '@/hooks/useMapProperties';
import { useLocale } from '@/context/LocaleContext';
import {
  enrichMapPropertiesWithAddress,
  mergeMapPropertiesWithLayouts,
  propertyToMapProperty,
} from '@/lib/propertyDetails';
import { ALL_PROPERTY_TYPES } from '@/lib/properties';
import { getGoogleMapsApiKey } from '@/lib/googleMaps';
import { Layout, MapProperty, Property, PropertyType } from '@/lib/types';

interface PropertyMapSectionProps {
  className?: string;
  /** Reuse layouts already loaded on the page (avoids duplicate fetches). */
  layouts?: Layout[];
}

function toMapPropertyRows(properties: MapProperty[]): MapProperty[] {
  return properties.map((property) =>
    propertyToMapProperty({
      ...property,
      _id: property.id,
      description: '',
      isActive: true,
      boundaryPath: property.boundary,
    } as Property)
  );
}

export default function PropertyMapSection({ className = '', layouts: layoutsProp }: PropertyMapSectionProps) {
  const { t, locale } = useLocale();
  const apiKey = getGoogleMapsApiKey();
  const { data: fetchedLayouts = [], isLoading: layoutsLoading } = useLayouts('active', {
    enabled: !layoutsProp,
  });
  const layouts = layoutsProp ?? fetchedLayouts;
  const { properties: mapApiProperties, loading: mapLoading } = useMapProperties({
    enabled: Boolean(apiKey),
  });

  const [activeTypes, setActiveTypes] = useState<Set<PropertyType>>(
    () => new Set(ALL_PROPERTY_TYPES)
  );

  const mergedProperties = useMemo(() => {
    const fromApi = toMapPropertyRows(mapApiProperties);
    const merged = mergeMapPropertiesWithLayouts(fromApi, layouts, locale);
    return enrichMapPropertiesWithAddress(merged, layouts);
  }, [mapApiProperties, layouts, locale]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(ALL_PROPERTY_TYPES.map((type) => [type, 0])) as Record<
      PropertyType,
      number
    >;
    mergedProperties.forEach((property) => {
      result[property.propertyType] = (result[property.propertyType] || 0) + 1;
    });
    return result;
  }, [mergedProperties]);

  const visibleProperties = useMemo(
    () => mergedProperties.filter((property) => activeTypes.has(property.propertyType)),
    [mergedProperties, activeTypes]
  );

  const isLoading = (!layoutsProp && layoutsLoading) || mapLoading;

  const onToggle = useCallback((type: PropertyType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const onSelectAll = useCallback(() => {
    setActiveTypes(new Set(ALL_PROPERTY_TYPES));
  }, []);

  const onClearAll = useCallback(() => {
    setActiveTypes(new Set());
  }, []);

  if (!apiKey) {
    return null;
  }

  return (
    <section className={`min-w-0 overflow-hidden ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900">{t('map.exploreTitle')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('map.exploreSubtitle')}</p>

      {!isLoading && mergedProperties.length === 0 && (
        <div className="mt-4">
          <PropertyMapEmptyState />
        </div>
      )}

      {(isLoading || mergedProperties.length > 0) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">{t('map.loading')}</p>
              </div>
            ) : visibleProperties.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">{t('map.emptyFiltered')}</p>
              </div>
            ) : (
              <PropertyMapView properties={visibleProperties} />
            )}
          </div>

          {!isLoading && (
            <PropertyMapLegend
              activeTypes={activeTypes}
              counts={counts}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onClearAll={onClearAll}
            />
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">{t('map.hint')}</p>
    </section>
  );
}
