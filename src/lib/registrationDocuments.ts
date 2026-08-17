import { getApiBaseUrl } from '@/lib/apiBase';

export async function downloadRegistrationDocument(
  userId: string,
  token: string,
  filename?: string
) {
  const res = await fetch(`${getApiBaseUrl()}/users/${userId}/registration-document`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to download document');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `registration-${userId}`;
  link.target = '_blank';
  link.click();
  URL.revokeObjectURL(url);
}

export async function openRegistrationDocument(userId: string, token: string) {
  const res = await fetch(`${getApiBaseUrl()}/users/${userId}/registration-document`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to open document');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
