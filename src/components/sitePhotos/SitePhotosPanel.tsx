'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, MapPin, Trash2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import { getGoogleMapsExternalUrl } from '@/lib/googleMaps';
import { formatDateTime } from '@/lib/formatLocale';
import {
  deleteSitePhoto,
  downloadSitePhoto,
  fetchSitePhotos,
  getCurrentPosition,
  uploadSitePhotos,
} from '@/lib/sitePhotos';
import type { SitePhotoEntityType, SitePhotoRecord } from '@/lib/types';
import SitePhotoUploadZone from '@/components/sitePhotos/SitePhotoUploadZone';

interface SitePhotosPanelProps {
  entityType: SitePhotoEntityType;
  entityId: string;
  entityLabel: string;
  canManage?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

export default function SitePhotosPanel({
  entityType,
  entityId,
  entityLabel,
  canManage = false,
  compact = false,
  onClose,
}: SitePhotosPanelProps) {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const confirm = useConfirm();
  const [photos, setPhotos] = useState<SitePhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<SitePhotoRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSitePhotos(entityType, entityId);
      setPhotos(data.photos);
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('sitePhotos.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (files: File[], source: 'camera' | 'gallery' | 'upload') => {
    if (!token || !canManage) return;
    setUploading(true);
    try {
      const position = await getCurrentPosition();
      await uploadSitePhotos(entityType, entityId, files, token, {
        source,
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
      });
      notify.success(t('sitePhotos.uploadSuccess'));
      await load();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('sitePhotos.uploadFailed')));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: SitePhotoRecord) => {
    if (!token || !canManage) return;
    const ok = await confirm({
      title: t('sitePhotos.deleteTitle'),
      message: t('sitePhotos.deleteMessage'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteSitePhoto(photo._id, token);
      notify.success(t('sitePhotos.deleteSuccess'));
      setPreview(null);
      await load();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('sitePhotos.deleteFailed')));
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('sitePhotos.title')}</h3>
          <p className="text-sm text-gray-500">{entityLabel}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary text-sm">
            {t('common.close')}
          </button>
        )}
      </div>

      {canManage && (
        <SitePhotoUploadZone onUpload={handleUpload} uploading={uploading} />
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('common.loading')}</p>
      ) : photos.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('sitePhotos.empty')}</p>
      ) : (
        <div className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
          {photos.map((photo) => {
            const mapsUrl =
              photo.latitude != null && photo.longitude != null
                ? getGoogleMapsExternalUrl(photo.latitude, photo.longitude)
                : null;
            const imageUrl = resolveMediaUrl(photo.imageUrl);
            const when = photo.capturedAt || photo.createdAt;

            return (
              <div key={photo._id} className="card overflow-hidden !p-0">
                <button
                  type="button"
                  onClick={() => setPreview(photo)}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-100"
                >
                  <Image
                    src={imageUrl}
                    alt={photo.caption || entityLabel}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    unoptimized
                  />
                </button>
                <div className="space-y-1 p-3 text-xs text-gray-600">
                  <p className="font-medium text-gray-900">
                    {when ? formatDateTime(when, locale) : '—'}
                  </p>
                  {photo.latitude != null && photo.longitude != null ? (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-primary-600" />
                      {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
                    </p>
                  ) : (
                    <p className="text-gray-400">{t('sitePhotos.noGps')}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => token && downloadSitePhoto(photo, token)}
                      className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      {t('sitePhotos.download')}
                    </button>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        <MapPin className="h-3 w-3" />
                        {t('sitePhotos.viewMap')}
                      </a>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDelete(photo)}
                        className="inline-flex items-center gap-1 text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" />
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setPreview(null)}
            aria-label="Close"
          />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-4 shadow-xl">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative mx-auto aspect-[4/3] max-h-[60vh] w-full overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={resolveMediaUrl(preview.imageUrl)}
                alt={preview.caption || entityLabel}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-900">{t('sitePhotos.captured')}:</span>{' '}
                {preview.capturedAt
                  ? formatDateTime(preview.capturedAt, locale)
                  : formatDateTime(preview.createdAt, locale)}
              </p>
              {preview.latitude != null && preview.longitude != null && (
                <p>
                  <span className="font-medium text-gray-900">{t('sitePhotos.location')}:</span>{' '}
                  {preview.latitude.toFixed(6)}, {preview.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (compact && onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button type="button" className="absolute inset-0 bg-gray-900/50" onClick={onClose} aria-label="Close" />
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border bg-surface p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return <div className="card">{content}</div>;
}
