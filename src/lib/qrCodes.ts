import { api } from '@/lib/api';

export type QrEntityType = 'layout' | 'plot' | 'farm' | 'land' | 'bungalow' | 'row_house';

export interface QrCodeRecord {
  id: string;
  entityType: QrEntityType;
  entityId: string;
  code: string;
  imageUrl: string;
  scanUrl: string;
  source: 'auto' | 'upload';
  lastRegeneratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QrScanPayload {
  qr: QrCodeRecord;
  entityType: QrEntityType;
  entityId: string;
  title: string;
  subtitle?: string;
  property: Record<string, unknown>;
  contactUser?: {
    name: string;
    phone?: string;
    email?: string;
    companyName?: string;
    designation?: string;
  } | null;
}

import { getApiBaseUrl } from '@/lib/apiBase';

export function getQrDownloadUrl(entityType: QrEntityType, entityId: string): string {
  return `${getApiBaseUrl()}/qr/${entityType}/${entityId}/download`;
}

export function fetchQrCode(entityType: QrEntityType, entityId: string, token: string) {
  return api.get<QrCodeRecord | null>(`/qr/${entityType}/${entityId}`, token);
}

export function uploadQrCode(entityType: QrEntityType, entityId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append('qrImage', file);
  return api.postForm<QrCodeRecord>(`/qr/${entityType}/${entityId}/upload`, formData, token);
}

export function fetchQrScan(code: string) {
  return api.get<QrScanPayload>(`/qr/scan/${code}`);
}

export async function downloadQrImage(
  entityType: QrEntityType,
  entityId: string,
  token: string,
  filename = 'property-qr.png'
) {
  const res = await fetch(getQrDownloadUrl(entityType, entityId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to download QR code');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printQrImage(imageUrl: string, title: string) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=640,height=720');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head><title>${title}</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 24px;">
        <h2 style="margin-bottom: 16px;">${title}</h2>
        <img src="${imageUrl}" alt="QR code" style="max-width: 320px; width: 100%;" />
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
