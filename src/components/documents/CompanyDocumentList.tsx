'use client';

import { useRef } from 'react';
import {
  Download,
  Eye,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  COMPANY_DOCUMENT_CATEGORIES,
  formatFileSize,
  getCompanyDocumentCategoryLabel,
  getCompanyDocumentDownloadUrl,
  getFileIconType,
  type CompanyDocumentFile,
} from '@/lib/documents';
import { useLocale } from '@/context/LocaleContext';

interface CompanyDocumentListProps {
  documents: CompanyDocumentFile[];
  layoutId: string;
  token: string | null;
  canManage: boolean;
  onPreview: (file: CompanyDocumentFile) => void;
  onRename: (file: CompanyDocumentFile) => void;
  onReplace: (file: CompanyDocumentFile, fileInput: HTMLInputElement) => void;
  onDelete: (file: CompanyDocumentFile) => void;
}

function FileIcon({ file }: { file: CompanyDocumentFile }) {
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

export default function CompanyDocumentList({
  documents,
  layoutId,
  token,
  canManage,
  onPreview,
  onRename,
  onReplace,
  onDelete,
}: CompanyDocumentListProps) {
  const { t } = useLocale();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replacingRef = useRef<CompanyDocumentFile | null>(null);

  if (!documents.length) return null;

  const handleDownload = async (file: CompanyDocumentFile) => {
    if (!token) return;
    try {
      const res = await fetch(getCompanyDocumentDownloadUrl(layoutId, file.id), {
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
    <>
      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.webp,.zip,.rar,.txt,.csv,.ppt,.pptx"
        onChange={(event) => {
          const target = replacingRef.current;
          if (target && replaceInputRef.current) {
            onReplace(target, replaceInputRef.current);
          }
          replacingRef.current = null;
          event.target.value = '';
        }}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="hidden grid-cols-[1.2fr_1fr_100px_120px_120px_120px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">
          <span>{t('companyDocuments.col.name')}</span>
          <span>{t('companyDocuments.col.category')}</span>
          <span>{t('companyDocuments.col.size')}</span>
          <span>{t('companyDocuments.col.uploaded')}</span>
          <span>{t('companyDocuments.col.uploadedBy')}</span>
          <span className="text-right">{t('companyDocuments.col.actions')}</span>
        </div>
        <div className="divide-y divide-gray-100">
          {documents.map((file) => (
            <div
              key={file.id}
              className="grid gap-3 px-4 py-3 transition hover:bg-gray-50 md:grid-cols-[1.2fr_1fr_100px_120px_120px_120px] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <FileIcon file={file} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="truncate text-xs text-gray-500 md:hidden">
                    {getCompanyDocumentCategoryLabel(file.category, t)}
                  </p>
                </div>
              </div>
              <p className="hidden truncate text-sm text-gray-600 md:block">
                {getCompanyDocumentCategoryLabel(file.category, t)}
              </p>
              <p className="text-sm text-gray-600 md:text-xs">{formatFileSize(file.fileSize)}</p>
              <p className="text-sm text-gray-600 md:text-xs">
                {new Date(file.createdAt).toLocaleDateString()}
              </p>
              <p className="truncate text-sm text-gray-600 md:text-xs">
                {file.uploadedBy?.name || '—'}
              </p>
              <div className="flex items-center justify-end gap-1">
                {(file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') && (
                  <button
                    type="button"
                    onClick={() => onPreview(file)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                    aria-label={`Preview ${file.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                  aria-label={`Download ${file.name}`}
                >
                  <Download className="h-4 w-4" />
                </button>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        replacingRef.current = file;
                        replaceInputRef.current?.click();
                      }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                      aria-label={`Replace ${file.name}`}
                      title="Replace file"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRename(file)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                      aria-label={`Rename ${file.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(file)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
