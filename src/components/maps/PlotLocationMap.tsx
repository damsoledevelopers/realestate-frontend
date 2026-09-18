'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import PropertyMapView from '@/components/maps/PropertyMapView';
import { MapPropertiesResponse, MapProperty } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';

interface PlotLocationMapProps {
  plotId: string;
  className?: string;
}

export default function PlotLocationMap({ plotId, className = 'h-72 w-full rounded-xl' }: PlotLocationMapProps) {
  const { t } = useLocale();
  const [property, setProperty] = useState<MapProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<MapPropertiesResponse>(`/properties/map?linkedPlotId=${encodeURIComponent(plotId)}`)
      .then((response) => {
        if (cancelled) return;
        setProperty(response.properties[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(t('plotMap.locationUnavailable'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plotId, t]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 px-4 text-center ${className}`}>
        <p className="text-sm text-gray-500">{error || t('plotMap.locationUnavailable')}</p>
      </div>
    );
  }

  return (
    <PropertyMapView
      properties={[property]}
      focusPropertyId={property.id}
      className={className}
      showDetailsPanel={false}
    />
  );
}
