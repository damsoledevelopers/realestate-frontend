export const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

export function getGoogleMapsApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

export function hasValidCoordinates(
  lat?: number | null,
  lng?: number | null
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function getGoogleMapsExternalUrl(
  lat?: number | null,
  lng?: number | null
): string | null {
  if (!hasValidCoordinates(lat, lng)) return null;
  // Prefer standard map mode with an exact pinned query.
  return `https://www.google.com/maps?q=${lat},${lng}&z=18`;
}

export function openGoogleMaps(lat?: number | null, lng?: number | null): boolean {
  const url = getGoogleMapsExternalUrl(lat, lng);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function getMapEmbedUrl(lat?: number, lng?: number, address?: string): string | null {
  if (hasValidCoordinates(lat, lng)) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  }
  if (isUsableMapAddress(address)) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(address!.trim())}&output=embed`;
  }
  return null;
}

export function getDirectionsUrl(lat?: number, lng?: number, address?: string): string {
  if (hasValidCoordinates(lat, lng)) {
    const destination = isUsableMapAddress(address)
      ? encodeURIComponent(address!.trim())
      : `${lat},${lng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }
  if (isUsableMapAddress(address)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address!.trim())}`;
  }
  return 'https://www.google.com/maps';
}

export function getMapSearchUrl(
  lat?: number,
  lng?: number,
  address?: string,
  label?: string
): string | null {
  if (hasValidCoordinates(lat, lng)) {
    const query = label ? `${label}@${lat},${lng}` : `${lat},${lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  if (isUsableMapAddress(address)) {
    const query = label ? `${label}, ${address!.trim()}` : address!.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return null;
}

/** Skip embed for placeholder text like "ewq4" that only shows a useless world map. */
export function isUsableMapAddress(address?: string | null): boolean {
  const trimmed = address?.trim() || '';
  if (trimmed.length < 8) return false;
  return trimmed.includes(',') || trimmed.includes(' ') || /\d/.test(trimmed);
}
