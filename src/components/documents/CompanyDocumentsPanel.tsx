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
}

export default function CompanyDocumentsPanel({
  layoutId,
  layoutName,
  canManage = true,
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

  return (
    <div className="space-y-6">
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
