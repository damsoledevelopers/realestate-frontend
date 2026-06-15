const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(
  /\/api\/?$/,
  ''
);

export function resolveMediaUrl(url?: string | null): string {
  if (!url?.trim()) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;
  return `${API_ORIGIN}/${trimmed}`;
}

export function resolveMediaUrls(urls?: string[] | null): string[] {
  if (!urls?.length) return [];
  return urls.map(resolveMediaUrl).filter(Boolean);
}
