const DEFAULT_SITE_URL = 'http://localhost:3001';

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return url.replace(/\/$/, '');
}

export const SITE_NAME = 'Real Estate Plot Management';

export const SITE_DESCRIPTION =
  'Browse premium land layouts, explore interactive plot maps, and book your dream property online.';

export const DEFAULT_OG_IMAGE = '/og-default.svg';

export function getOgImageUrl(path = DEFAULT_OG_IMAGE): string {
  if (path.startsWith('http')) return path;
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
