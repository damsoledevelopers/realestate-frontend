'use client';

import {
  Download,
  Eye,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderInput,
  Link2,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  formatFileSize,
  getDocumentDownloadUrl,
  getFileIconType,
  type LayoutDocumentFile,
} from '@/lib/documents';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName } from '@/lib/localizedText';

interface FileListProps {
  files: LayoutDocumentFile[];
  token: string | null;
  showLayoutColumn?: boolean;
  onPreview: (file: LayoutDocumentFile) => void;
  onRename: (file: LayoutDocumentFile) => void;
  onDelete: (file: LayoutDocumentFile) => void;
  onMove: (file: LayoutDocumentFile) => void;
  onMapLayout?: (file: LayoutDocumentFile) => void;
}

const actionButtonClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-primary-600';

function FileIcon({ file }: { file: LayoutDocumentFile }) {
  const type = getFileIconType(file.mimeType, file.extension);
  const className = 'h-5 w-5';
  switch (type) {
    case 'image':
      return <FileImage className={className} />;
    case 'pdf':
    case 'doc':
      return <FileText className={className} />;
    case 'sheet':
      return <FileSpreadsheet className={className} />;
    case 'archive':
      return <FileArchive className={className} />;
    default:
      return <File className={className} />;
  }
}

export default function FileList({
  files,
  token,
  showLayoutColumn = false,
  onPreview,
  onRename,
  onDelete,
  onMove,
  onMapLayout,
}: FileListProps) {
  const { locale, t } = useLocale();
  if (!files.length) return null;

  const tableGrid = showLayoutColumn
    ? 'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_5.5rem_5.5rem_11rem]'
    : 'md:grid-cols-[minmax(0,1.6fr)_4.5rem_5.5rem_5.5rem_11rem]';

  const handleDownload = async (file: LayoutDocumentFile) => {
    if (!token) return;
    try {
      const res = await fetch(getDocumentDownloadUrl(file.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalName || file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t('documents.filesSection')}
      </h4>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <div className="min-w-[52rem]">
          <div
            className={`hidden gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid ${tableGrid}`}
          >
            <span>{t('documents.col.name')}</span>
            {showLayoutColumn && <span>{t('documents.col.layout')}</span>}
            <span>{t('documents.col.size')}</span>
            <span>{t('documents.col.uploaded')}</span>
            <span>{t('documents.col.modified')}</span>
            <span className="text-right">{t('documents.col.actions')}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {files.map((file) => {
              const layoutLabel = file.layout ? getLayoutDisplayName(file.layout, locale) : '—';
              const uploadedLabel = new Date(file.createdAt).toLocaleDateString();
              const modifiedLabel = new Date(file.updatedAt).toLocaleDateString();
              const sizeLabel = formatFileSize(file.fileSize);

              return (
                <div
                  key={file.id}
                  className={`grid gap-3 px-4 py-3 transition hover:bg-gray-50 md:items-center ${tableGrid}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <FileIcon file={file} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {t('documents.uploadedBy', { name: file.uploadedBy?.name || 'Unknown' })}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 md:hidden">
                        {showLayoutColumn && (
                          <span>
                            {t('documents.col.layout')}: {layoutLabel}
                          </span>
                        )}
                        <span>
                          {t('documents.col.size')}: {sizeLabel}
                        </span>
                        <span>
                          {t('documents.col.uploaded')}: {uploadedLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {showLayoutColumn && (
                    <p className="hidden truncate text-sm text-gray-600 md:block">{layoutLabel}</p>
                  )}

                  <p className="hidden text-sm text-gray-600 md:block md:text-xs">{sizeLabel}</p>
                  <p className="hidden text-sm text-gray-600 md:block md:text-xs">{uploadedLabel}</p>
                  <p className="hidden text-sm text-gray-600 md:block md:text-xs">{modifiedLabel}</p>

                  <div className="flex flex-wrap items-center justify-start gap-0.5 md:justify-end">
                    {(file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') && (
                      <button
                        type="button"
                        onClick={() => onPreview(file)}
                        className={actionButtonClass}
                        aria-label={t('documents.action.preview', { name: file.name })}
                        title={t('documents.action.preview', { name: file.name })}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className={actionButtonClass}
                      aria-label={t('documents.action.download', { name: file.name })}
                      title={t('documents.action.download', { name: file.name })}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {onMapLayout && (
                      <button
                        type="button"
                        onClick={() => onMapLayout(file)}
                        className={actionButtonClass}
                        aria-label={t('documents.action.linkLayout', { name: file.name })}
                        title={t('documents.action.linkLayout', { name: file.name })}
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onMove(file)}
                      className={actionButtonClass}
                      aria-label={t('documents.action.move', { name: file.name })}
                      title={t('documents.action.move', { name: file.name })}
                    >
                      <FolderInput className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRename(file)}
                      className={actionButtonClass}
                      aria-label={t('documents.action.rename', { name: file.name })}
                      title={t('documents.action.rename', { name: file.name })}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(file)}
                      className={`${actionButtonClass} hover:bg-red-50 hover:text-red-600`}
                      aria-label={t('documents.action.delete', { name: file.name })}
                      title={t('documents.action.delete', { name: file.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
