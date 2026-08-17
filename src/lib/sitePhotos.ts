import { api } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/apiBase';
import type { SitePhotoEntityType, SitePhotoRecord } from '@/lib/types';

export type { SitePhotoEntityType };

export const SITE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export interface SitePhotosResponse {
  photos: SitePhotoRecord[];
}

export function fetchSitePhotos(entityType: SitePhotoEntityType, entityId: string) {
  return api.get<SitePhotosResponse>(`/site-photos/${entityType}/${entityId}`);
}

export function getSitePhotoDownloadUrl(photoId: string): string {
  return `${getApiBaseUrl()}/site-photos/file/${photoId}/download`;
}

export async function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export async function uploadSitePhotos(
  entityType: SitePhotoEntityType,
  entityId: string,
  files: File[],
  token: string,
  options: {
    source?: 'camera' | 'gallery' | 'upload';
    caption?: string;
    latitude?: number | null;
    longitude?: number | null;
  } = {}
) {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  if (options.source) formData.append('source', options.source);
  if (options.caption) formData.append('caption', options.caption);
  if (options.latitude != null) formData.append('latitude', String(options.latitude));
  if (options.longitude != null) formData.append('longitude', String(options.longitude));
  formData.append('capturedAt', new Date().toISOString());

  return api.postForm<SitePhotosResponse>(
    `/site-photos/${entityType}/${entityId}`,
    formData,
    token
  );
}

export function deleteSitePhoto(photoId: string, token: string) {
  return api.delete(`/site-photos/file/${photoId}`, token);
}

export async function downloadSitePhoto(
  photo: SitePhotoRecord,
  token: string,
  filename?: string
) {
  const res = await fetch(getSitePhotoDownloadUrl(photo._id), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to download photo');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `site-photo-${photo._id}.jpg`;
  link.click();
  URL.revokeObjectURL(url);
}
