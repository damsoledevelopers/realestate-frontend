'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchQrScan, type QrScanPayload } from '@/lib/qrCodes';
import { formatPropertyArea, formatPropertyType } from '@/lib/properties';
import type { PropertyType } from '@/lib/types';
import PropertyContact from '@/components/property/PropertyContact';
import SitePhotoPublicGallery from '@/components/sitePhotos/SitePhotoPublicGallery';
import ExternalLinksPublicSection from '@/components/externalLinks/ExternalLinksPublicSection';
import StatusBadge from '@/components/property/StatusBadge';
import { useLocale } from '@/context/LocaleContext';

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="min-w-[8rem] text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function QrScanPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useLocale();
  const [data, setData] = useState<QrScanPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetchQrScan(code)
      .then(setData)
      .catch(() => setError(t('qr.scanNotFound')))
      .finally(() => setLoading(false));
  }, [code, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-gray-500">
        {t('common.loading')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
        <p className="text-red-500">{error || t('qr.scanNotFound')}</p>
        <Link href="/layouts" className="btn-primary mt-4 text-sm">
          {t('qr.browseLayouts')}
        </Link>
      </div>
    );
  }

  const property = data.property as Record<string, unknown>;
  const layoutId = property.linkedLayoutId as string | undefined;
  const linkedLayoutId =
    (property.layoutId as { _id?: string } | string | undefined) &&
    (typeof property.layoutId === 'object'
      ? (property.layoutId as { _id?: string })._id
      : (property.layoutId as string));
  const area =
    property.area && typeof property.area === 'object'
      ? formatPropertyArea(property.area as { value: number; unit: string })
      : null;
  const entityTypeLabel = formatPropertyType(data.entityType as PropertyType);
  const layoutName =
    typeof property.layoutName === 'string'
      ? property.layoutName
      : typeof property.name === 'string' && data.entityType === 'layout'
        ? property.name
        : null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            {t('qr.scanBadge')}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{data.title}</h1>
          {data.subtitle && <p className="mt-1 text-sm text-gray-500">{data.subtitle}</p>}
        </div>

        <div className="space-y-6">
          <section className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">{t('qr.propertyDetails')}</h2>
            <dl className="space-y-3">
              <DetailRow label={t('qr.field.type')} value={entityTypeLabel} />
              {layoutName && data.entityType !== 'layout' && (
                <DetailRow label="Layout" value={layoutName} />
              )}
              {typeof property.location === 'string' && (
                <DetailRow label={t('qr.field.location')} value={property.location} />
              )}
              {typeof property.layoutLocation === 'string' && (
                <DetailRow label={t('qr.field.location')} value={property.layoutLocation} />
              )}
              {area && <DetailRow label={t('qr.field.size')} value={area} />}
              {property.plotNumber != null && (
                <DetailRow label={t('qr.field.plotNumber')} value={String(property.plotNumber)} />
              )}
              {property.size != null && (
                <DetailRow label={t('qr.field.size')} value={String(property.size)} />
              )}
              {property.price != null && (
                <DetailRow
                  label={t('qr.field.price')}
                  value={`₹${Number(property.price).toLocaleString()}`}
                />
              )}
              {property.propertyNumber != null && (
                <DetailRow label={t('qr.field.number')} value={String(property.propertyNumber)} />
              )}
              {property.status != null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">{t('qr.field.status')}</span>
                  <StatusBadge status={String(property.status)} />
                </div>
              )}
              {property.description != null && String(property.description).trim() && (
                <DetailRow label={t('qr.field.description')} value={String(property.description)} />
              )}
            </dl>
          </section>

          <SitePhotoPublicGallery
            entityType={data.entityType}
            entityId={data.entityId}
          />

          <ExternalLinksPublicSection
            entityType={data.entityType}
            entityId={data.entityId}
          />

          {data.entityId && (
            <section className="card">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">{t('qr.contact')}</h2>
              <PropertyContact
                entityType={data.entityType}
                entityId={data.entityId}
                propertyName={data.title}
              />
            </section>
          )}

          {(layoutId || linkedLayoutId) && (
            <Link
              href={`/layouts/${layoutId || linkedLayoutId}`}
              className="btn-primary inline-flex w-full justify-center sm:w-auto"
            >
              {t('qr.viewLayout')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
