'use client';

import { useMemo, useRef, useState } from 'react';
import { Files, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { usePrompt } from '@/context/PromptContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  deleteCompanyDocument,
  replaceCompanyDocument,
  updateCompanyDocument,
  uploadCompanyDocuments,
} from '@/lib/companyDocuments';
import {
  COMPANY_DOCUMENT_CATEGORIES,
  getCompanyDocumentCategoryLabel,
  type CompanyDocumentCategory,
  type CompanyDocumentFile,
} from '@/lib/documents';
import { useCompanyDocuments } from '@/hooks/useCompanyDocuments';
import FileUploadZone from '@/components/documents/FileUploadZone';
import FilePreviewModal from '@/components/documents/FilePreviewModal';
import CompanyDocumentList from '@/components/documents/CompanyDocumentList';
import { getCompanyDocumentDownloadUrl } from '@/lib/documents';

interface CompanyDocumentsPanelProps {
  layoutId: string;
  layoutName: string;
  canManage?: boolean;
  /** Images uploaded through the Add/Edit Layout form. */
  layoutImages?: string[];
  /** Images hidden from the public website remain visible to managers here. */
  hiddenImages?: string[];
  /** Files uploaded directly on the layout form. */
  layoutFiles?: Array<{ name: string; url: string; visible?: boolean; mimeType?: string }>;
}

export default function CompanyDocumentsPanel({
  layoutId,
  layoutName,
  canManage = true,
  layoutImages = [],
  hiddenImages = [],
  layoutFiles = [],
}: CompanyDocumentsPanelProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryFilter, setCategoryFilter] = useState<CompanyDocumentCategory | ''>('');
  const [search, setSearch] = useState('');
  const [uploadCategory, setUploadCategory] = useState<CompanyDocumentCategory>('layout_brochure');
  const [uploading, setUploading] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [previewFile, setPreviewFile] = useState<CompanyDocumentFile | null>(null);

  const { data, loading, error, refresh } = useCompanyDocuments({
    layoutId,
    token,
    category: categoryFilter,
    search,
  });

  const documents = data?.documents ?? [];

  const groupedCounts = useMemo(() => {
    const counts = Object.fromEntries(
      COMPANY_DOCUMENT_CATEGORIES.map((category) => [category, 0])
    ) as Record<CompanyDocumentCategory, number>;
    for (const doc of documents) {
      counts[doc.category] += 1;
    }
    return counts;
  }, [documents]);

  const handleUpload = async (files: File[]) => {
    if (!token || !files.length || !canManage) return;
    setUploading(true);
    try {
      await uploadCompanyDocuments(layoutId, token, {
        category: uploadCategory,
        files,
      });
      notify.success(t('companyDocuments.uploadSuccess', { count: files.length }));
      setShowUploadZone(false);
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('companyDocuments.uploadFailed')));
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async (file: CompanyDocumentFile) => {
    if (!token || !canManage) return;
    const name = await prompt.input({
      title: t('companyDocuments.renamePrompt'),
      defaultValue: file.name,
      placeholder: t('documents.fileNamePlaceholder'),
    });
    if (!name || name === file.name) return;
    try {
      await updateCompanyDocument(layoutId, file.id, token, { name });
      notify.success(t('companyDocuments.renameSuccess'));
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('companyDocuments.renameFailed')));
    }
  };

  const handleReplace = async (file: CompanyDocumentFile, input: HTMLInputElement) => {
    if (!token || !canManage || !input.files?.length) return;
    const replacement = input.files[0];
    try {
      await replaceCompanyDocument(layoutId, file.id, token, replacement);
      notify.success(t('companyDocuments.replaceSuccess'));
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('companyDocuments.replaceFailed')));
    }
  };

  const handleDelete = async (file: CompanyDocumentFile) => {
    if (!token || !canManage) return;
    const ok = await confirm({
      title: t('companyDocuments.deleteTitle'),
      message: t('companyDocuments.deleteMessage', { name: file.name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCompanyDocument(layoutId, file.id, token);
      notify.success(t('companyDocuments.deleteSuccess'));
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('companyDocuments.deleteFailed')));
    }
  };

  const previewAdapter = previewFile
    ? {
        ...previewFile,
        folderId: null,
        layout: null,
        layoutId,
      }
    : null;

  const savedLayoutImages = Array.from(new Set(layoutImages.filter((url) => typeof url === 'string' && url.trim())));
  const savedLayoutFiles = layoutFiles.filter((file) => file && typeof file.url === 'string' && file.url.trim());

  return (
    <div className="space-y-6">
      {(savedLayoutImages.length > 0 || savedLayoutFiles.length > 0) && (
        <section className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('companyDocuments.layoutUploadsTitle')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('companyDocuments.layoutUploadsSubtitle')}</p>
            </div>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              {t('companyDocuments.imageCount', { count: savedLayoutImages.length + savedLayoutFiles.length })}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {savedLayoutImages.map((url, index) => {
              const isHidden = hiddenImages.includes(url);
              return (
                <article key={`${url}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <a href={url} target="_blank" rel="noreferrer" className="block bg-gray-50">
                    <img
                      src={url}
                      alt={t('companyDocuments.layoutImageAlt', { index: index + 1 })}
                      loading="lazy"
                      className="h-48 w-full object-cover"
                    />
                  </a>
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="text-sm font-medium text-gray-800">
                      {t('companyDocuments.layoutImageLabel', { index: index + 1 })}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${isHidden ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>
                      {isHidden ? t('companyDocuments.hiddenFromWebsite') : t('companyDocuments.visibleOnWebsite')}
                    </span>
                    <a href={url} target="_blank" rel="noreferrer" className="ml-auto text-sm font-semibold text-primary-700 hover:underline">
                      {t('companyDocuments.openImage')} ↗
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          {savedLayoutFiles.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {savedLayoutFiles.map((file, index) => {
                const isImage = (file.mimeType || '').startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(file.url);
                return (
                  <article key={`${file.url}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {isImage ? (
                      <a href={file.url} target="_blank" rel="noreferrer" className="block bg-gray-50">
                        <img src={file.url} alt={file.name || `Layout file ${index + 1}`} loading="lazy" className="h-48 w-full object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-24 items-center justify-center bg-gray-50"><Files className="h-9 w-9 text-gray-400" /></div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                      <span className="min-w-0 break-words text-sm font-medium text-gray-800">{file.name || t('companyDocuments.layoutImageLabel', { index: index + 1 })}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${file.visible === false ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>
                        {file.visible === false ? t('companyDocuments.hiddenFromWebsite') : t('companyDocuments.visibleOnWebsite')}
                      </span>
                      <a href={file.url} target="_blank" rel="noreferrer" className="ml-auto text-sm font-semibold text-primary-700 hover:underline">{t('companyDocuments.openImage')} ↗</a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Files className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('companyDocuments.title')}</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t('companyDocuments.subtitle', { layout: layoutName })}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowUploadZone((open) => !open)}
            className="btn-primary text-sm"
          >
            {showUploadZone ? t('companyDocuments.hideUpload') : t('companyDocuments.upload')}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('companyDocuments.searchPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            !categoryFilter
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          {t('companyDocuments.allCategories')}
        </button>
        {COMPANY_DOCUMENT_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              categoryFilter === category
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {getCompanyDocumentCategoryLabel(category, t)}
            {!categoryFilter && groupedCounts[category] > 0 ? ` (${groupedCounts[category]})` : ''}
          </button>
        ))}
      </div>

      {showUploadZone && canManage && (
        <div className="card space-y-4">
          <div>
            <label htmlFor="company-doc-category" className="text-sm font-medium text-gray-700">
              {t('companyDocuments.categoryLabel')}
            </label>
            <select
              id="company-doc-category"
              value={uploadCategory}
              onChange={(event) => setUploadCategory(event.target.value as CompanyDocumentCategory)}
              className="input-field mt-2"
            >
              {COMPANY_DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {getCompanyDocumentCategoryLabel(category, t)}
                </option>
              ))}
            </select>
          </div>
          <FileUploadZone onUpload={handleUpload} uploading={uploading} inputRef={fileInputRef} />
        </div>
      )}

      {loading ? (
        <div className="card py-12 text-center text-sm text-gray-400">{t('common.loading')}</div>
      ) : error ? (
        <div className="card py-12 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button type="button" onClick={() => refresh()} className="btn-primary mt-4 text-sm">
            {t('dashboard.startup.retry')}
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="card py-12 text-center">
          <Files className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">{t('companyDocuments.emptyTitle')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('companyDocuments.emptySubtitle')}</p>
        </div>
      ) : (
        <CompanyDocumentList
          documents={documents}
          layoutId={layoutId}
          token={token}
          canManage={canManage}
          onPreview={setPreviewFile}
          onRename={handleRename}
          onReplace={handleReplace}
          onDelete={handleDelete}
        />
      )}

      {previewAdapter && token && (
        <FilePreviewModal
          file={previewAdapter}
          token={token}
          onClose={() => setPreviewFile(null)}
          downloadUrlBuilder={(file) => getCompanyDocumentDownloadUrl(layoutId, file.id)}
        />
      )}
    </div>
  );
}
