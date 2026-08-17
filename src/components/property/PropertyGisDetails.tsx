'use client';

import StatusBadge from '@/components/property/StatusBadge';
import ConstructionStatusBadge from '@/components/plots/ConstructionStatusBadge';
import { useLocale } from '@/context/LocaleContext';
import { PropertyStatus } from '@/lib/types';
import { ConstructionStatus } from '@/lib/constructionStatusConfig';

export interface PropertyGisDetailsData {
  propertyName: string;
  propertyNumber: string;
  propertyType: string;
  area: string;
  price: number | string;
  status: string;
  statusKey?: PropertyStatus | string;
  constructionStatus?: ConstructionStatus | string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface PropertyGisDetailsProps {
  property: PropertyGisDetailsData;
  className?: string;
}

export function formatPropertyTypeLocalized(
  type: string,
  t: (key: string) => string
): string {
  const key = `property.type.${type}`;
  const translated = t(key);
  return translated !== key ? translated : type;
}

export default function PropertyGisDetails({ property, className = '' }: PropertyGisDetailsProps) {
  const { t } = useLocale();
  const hasCoords =
    typeof property.latitude === 'number' &&
    typeof property.longitude === 'number' &&
    !Number.isNaN(property.latitude) &&
    !Number.isNaN(property.longitude);

  const priceValue =
    typeof property.price === 'number'
      ? `₹${property.price.toLocaleString('en-IN')}`
      : property.price === 'On request' || property.price === 'On Request'
        ? t('common.onRequest')
        : property.price;

  return (
    <dl className={`grid gap-3 text-sm sm:grid-cols-2 ${className}`}>
      <DetailItem label={t('property.name')} value={property.propertyName} />
      <DetailItem label={t('property.number')} value={property.propertyNumber} />
      <DetailItem
        label={t('property.type')}
        value={formatPropertyTypeLocalized(property.propertyType, t)}
      />
      <DetailItem label={t('property.area')} value={property.area} />
      <DetailItem label={t('property.price')} value={String(priceValue)} />
      <div className="rounded-lg bg-gray-50 px-3 py-2.5">
        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('property.status')}
        </dt>
        <dd className="mt-2">
          {property.statusKey ? (
            <StatusBadge status={property.statusKey} size="sm" />
          ) : (
            <span className="font-semibold text-gray-900">{property.status}</span>
          )}
        </dd>
      </div>
      <div className="rounded-lg bg-gray-50 px-3 py-2.5">
        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('property.constructionStatus')}
        </dt>
        <dd className="mt-2">
          <ConstructionStatusBadge status={property.constructionStatus} size="sm" showPattern />
        </dd>
      </div>
      <DetailItem
        label={t('property.address')}
        value={property.address?.trim() || t('property.notSet')}
        className="sm:col-span-2"
      />
      <DetailItem
        label={t('property.latitude')}
        value={hasCoords ? property.latitude!.toFixed(6) : t('property.notSet')}
        mono
      />
      <DetailItem
        label={t('property.longitude')}
        value={hasCoords ? property.longitude!.toFixed(6) : t('property.notSet')}
        mono
      />
    </dl>
  );
}

function DetailItem({
  label,
  value,
  capitalize,
  mono,
  className = '',
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-gray-50 px-3 py-2.5 ${className}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd
        className={`mt-1 font-semibold text-gray-900 ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}
