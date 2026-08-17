'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileBadge, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  deleteCompanyDocument,
  fetchCompanyDocuments,
  uploadCompanyDocuments,
} from '@/lib/companyDocuments';
import {
  DOCUMENT_ACCEPT,
  PLOT_CERTIFICATE_CATEGORIES,
  formatFileSize,
  getCompanyDocumentCategoryLabel,
  getCompanyDocumentDownloadUrl,
  type CompanyDocumentCategory,
  type CompanyDocumentFile,
} from '@/lib/documents';
import { resolveMediaUrl } from '@/lib/media';

interface PlotCertificatesPanelProps {
  layoutId: string;
  plotId: string;
  plotLabel: string;
  canManage?: boolean;
  onClose: () => void;
}

export default function PlotCertificatesPanel({
  layoutId,
  plotId,
  plotLabel,
  canManage = true,
  onClose,
}: PlotCertificatesPanelProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<CompanyDocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<CompanyDocumentCategory>('plot_certificate');

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetchCompanyDocuments(layoutId, token, { plotId });
      const filtered = (response.documents || []).filter((doc) =>
        PLOT_CERTIFICATE_CATEGORIES.includes(doc.category)
      );
      setDocuments(filtered);
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('plotCertificates.loadFailed')));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [token, layoutId, plotId, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = async (files: FileList | null) => {
    if (!token || !canManage || !files?.length) return;
    setUploading(true);
    try {
      await uploadCompanyDocuments(layoutId, token, {
        category,
        plotId,
        files: Array.from(files),
      });
      notify.success(t('plotCertificates.uploadSuccess', { count: files.length }));
      refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('plotCertificates.uploadFailed')));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: CompanyDocumentFile) => {
    if (!token || !canManage) return;
    const ok = await confirm({
      title: t('plotCertificates.deleteTitle'),
      message: t('plotCertificates.deleteMessage', { name: doc.name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCompanyDocument(layoutId, doc.id, token);
      notify.success(t('plotCertificates.deleteSuccess'));
      refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('plotCertificates.deleteFailed')));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <FileBadge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('plotCertificates.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('plotCertificates.subtitle', { plot: plotLabel })}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
              {t('plotCertificates.categoryLabel')}
            </label>
            <select
              className="input-field mb-3"
              value={category}
              onChange={(e) => setCategory(e.target.value as CompanyDocumentCategory)}
            >
              {PLOT_CERTIFICATE_CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {getCompanyDocumentCategoryLabel(key, t)}
                </option>
              ))}
            </select>
            <label className="btn-primary inline-flex cursor-pointer items-center gap-2 text-sm">
              <Upload className="h-4 w-4" />
              {uploading ? t('plotCertificates.uploading') : t('plotCertificates.upload')}
              <input
                type="file"
                accept={DOCUMENT_ACCEPT}
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">{t('plotCertificates.uploadHint')}</p>
          </div>
        )}

        <div className="mt-5 max-h-[50vh] space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('common.loading')}</p>
          ) : documents.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{t('plotCertificates.empty')}</p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{doc.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {getCompanyDocumentCategoryLabel(doc.category, t)} · {formatFileSize(doc.fileSize)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={resolveMediaUrl(doc.fileUrl) || getCompanyDocumentDownloadUrl(layoutId, doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs"
                  >
                    {t('common.view')}
                  </a>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      className="btn-secondary text-xs text-red-600"
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
