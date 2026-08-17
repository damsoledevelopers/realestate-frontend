'use client';

import StatusBadge from '@/components/property/StatusBadge';
import { formatPropertyArea, formatPropertyPrice } from '@/lib/properties';
import { formatPropertyTypeLocalized } from '@/components/property/PropertyGisDetails';
import { useLocale } from '@/context/LocaleContext';
import { MapProperty } from '@/lib/types';

interface PropertyMapPopupProps {
  property: MapProperty;
}

export default function PropertyMapPopup({ property }: PropertyMapPopupProps) {
  const { t } = useLocale();

  return (
    <div className="min-w-[220px] max-w-[280px] p-1 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{property.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">#{property.propertyNumber}</p>
        </div>
        <StatusBadge status={property.status} size="sm" />
      </div>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">{t('map.type')}</dt>
          <dd className="font-medium text-gray-900">
            {formatPropertyTypeLocalized(property.propertyType, t)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">{t('property.area')}</dt>
          <dd className="font-medium text-gray-900">{formatPropertyArea(property.area)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">{t('property.price')}</dt>
          <dd className="font-medium text-gray-900">{formatPropertyPrice(property.price)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">{t('property.latitude')}</dt>
          <dd className="font-mono text-[11px] text-gray-800">{property.latitude.toFixed(6)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">{t('property.longitude')}</dt>
          <dd className="font-mono text-[11px] text-gray-800">{property.longitude.toFixed(6)}</dd>
        </div>
      </dl>
    </div>
  );
}
