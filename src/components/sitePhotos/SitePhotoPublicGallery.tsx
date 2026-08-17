'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { resolveMediaUrl } from '@/lib/media';
import { getGoogleMapsExternalUrl } from '@/lib/googleMaps';
import { formatDateTime } from '@/lib/formatLocale';
import { fetchSitePhotos } from '@/lib/sitePhotos';
import type { SitePhotoEntityType, SitePhotoRecord } from '@/lib/types';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';

interface SitePhotoPublicGalleryProps {
  entityType: SitePhotoEntityType;
  entityId: string;
  title?: string;
}

export default function SitePhotoPublicGallery({
  entityType,
  entityId,
  title,
}: SitePhotoPublicGalleryProps) {
  const { t, locale } = useLocale();
  const [photos, setPhotos] = useState<SitePhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitePhotos(entityType, entityId)
      .then((data) => setPhotos(data.photos))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  if (loading || photos.length === 0) return null;

  return (
    <AnimatedSection className="section-container py-6 lg:py-8">
      <SectionHeading
        eyebrow={t('sitePhotos.publicEyebrow')}
        title={title || t('sitePhotos.publicTitle')}
        subtitle={t('sitePhotos.publicSubtitle')}
      />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => {
          const mapsUrl =
            photo.latitude != null && photo.longitude != null
              ? getGoogleMapsExternalUrl(photo.latitude, photo.longitude)
              : null;
          const when = photo.capturedAt || photo.createdAt;

          return (
            <div
              key={photo._id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src={resolveMediaUrl(photo.imageUrl)}
                  alt={photo.caption || t('sitePhotos.publicTitle')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized
                />
              </div>
              <div className="space-y-1 p-3 text-xs text-gray-600">
                <p className="font-medium text-gray-900">
                  {when ? formatDateTime(when, locale) : '—'}
                </p>
                {photo.latitude != null && photo.longitude != null ? (
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary-600" />
                    {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
                  </p>
                ) : (
                  <p className="text-gray-400">{t('sitePhotos.noGps')}</p>
                )}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-medium text-primary-600 hover:underline"
                  >
                    {t('sitePhotos.viewMap')}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
