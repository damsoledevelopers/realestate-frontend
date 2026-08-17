const DEFAULT_API_BASE = 'http://localhost:5001/api';

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return DEFAULT_API_BASE;
  return raw.replace(/\/$/, '');
}

export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}
