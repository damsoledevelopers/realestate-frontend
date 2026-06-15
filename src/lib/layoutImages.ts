import { Layout } from '@/lib/types';
import { resolveMediaUrl, resolveMediaUrls } from '@/lib/media';

export const MAX_LAYOUT_IMAGES = 10;

export function getLayoutImages(layout: Pick<Layout, 'images' | 'imageUrl'>): string[] {
  if (layout.images?.length) return resolveMediaUrls(layout.images);
  if (layout.imageUrl) return [resolveMediaUrl(layout.imageUrl)].filter(Boolean);
  return [];
}

export function getPrimaryLayoutImage(layout: Pick<Layout, 'images' | 'imageUrl'>): string {
  return getLayoutImages(layout)[0] || '';
}
