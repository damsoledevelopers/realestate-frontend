import { Layout } from '@/lib/types';
import { resolveMediaUrl, resolveMediaUrls } from '@/lib/media';

export const MAX_LAYOUT_IMAGES = 10;

/** Local SVG placeholders — always available, no external CDN */
export const LAYOUT_FALLBACK_IMAGES = [
  '/images/placeholders/layout-1.svg',
  '/images/placeholders/layout-2.svg',
  '/images/placeholders/layout-3.svg',
  '/images/placeholders/layout-4.svg',
  '/images/placeholders/layout-5.svg',
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getLayoutFallbackImage(seed = 'default'): string {
  const index = hashString(seed) % LAYOUT_FALLBACK_IMAGES.length;
  return LAYOUT_FALLBACK_IMAGES[index];
}

export function isLocalPlaceholderImage(src: string): boolean {
  return src.startsWith('/images/placeholders/');
}

/** Uploaded layout photos only — empty when none exist */
export function getLayoutImages(layout: Pick<Layout, 'images' | 'imageUrl'>): string[] {
  if (layout.images?.length) return resolveMediaUrls(layout.images);
  if (layout.imageUrl) return [resolveMediaUrl(layout.imageUrl)].filter(Boolean);
  return [];
}

export function getPrimaryLayoutImage(layout: Pick<Layout, 'images' | 'imageUrl'>): string {
  return getLayoutImages(layout)[0] || '';
}

export function getHeroImage(layout: Pick<Layout, '_id' | 'images' | 'imageUrl'>): string {
  const custom = getLayoutImages(layout);
  if (custom.length) return custom[0];
  return getLayoutFallbackImage(layout._id || 'hero');
}

export function hasCustomLayoutImages(layout: Pick<Layout, 'images' | 'imageUrl'>): boolean {
  return getLayoutImages(layout).length > 0;
}

export function getGalleryImages(layout: Pick<Layout, '_id' | 'images' | 'imageUrl'>): string[] {
  return getLayoutImages(layout);
}
