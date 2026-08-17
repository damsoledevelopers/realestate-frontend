'use client';

import Image from 'next/image';
import { X, Download } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { getDocumentDownloadUrl, type LayoutDocumentFile } from '@/lib/documents';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName } from '@/lib/localizedText';

interface FilePreviewModalProps {
  file: LayoutDocumentFile | null;
  token: string | null;
  onClose: () => void;
  downloadUrlBuilder?: (file: LayoutDocumentFile) => string;
}

export default function FilePreviewModal({
  file,
  token,
  onClose,
  downloadUrlBuilder,
}: FilePreviewModalProps) {
  const { locale } = useLocale();
  if (!file) return null;

  const url = resolveMediaUrl(file.fileUrl);
  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  const download = async () => {
    if (!token) return;
    const res = await fetch(
      downloadUrlBuilder ? downloadUrlBuilder(file) : getDocumentDownloadUrl(file.id),
      {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = file.originalName || file.name;
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close preview"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="min-w-0 pr-4">
            <h3 className="truncate text-sm font-semibold text-gray-900">{file.name}</h3>
            <p className="text-xs text-gray-500">
              {file.mimeType}
              {file.layout ? ` · ${getLayoutDisplayName(file.layout, locale)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={download} className="btn-secondary text-xs">
              <Download className="mr-1 inline h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {isImage && (
            <div className="relative mx-auto aspect-auto max-h-[70vh] w-full">
              <Image
                src={url}
                alt={file.name}
                width={1200}
                height={800}
                className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain"
                unoptimized
              />
            </div>
          )}
          {isPdf && (
            <iframe
              src={url}
              title={file.name}
              className="h-[70vh] w-full rounded-lg border border-gray-200 bg-white"
            />
          )}
          {!isImage && !isPdf && (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500">
              Preview not available for this file type. Please download to view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
