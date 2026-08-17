'use client';

import { useRef, useState } from 'react';
import { Files, Link2 } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import { useConfirm } from '@/context/ConfirmContext';
import { usePrompt } from '@/context/PromptContext';
import { useAuth } from '@/context/AuthContext';
import { useDocuments } from '@/hooks/useLayoutDocuments';
import type { LayoutDocumentFile, LayoutDocumentFolder } from '@/lib/documents';
import type { Layout } from '@/lib/types';
import FolderBreadcrumb from './FolderBreadcrumb';
import DocumentToolbar from './DocumentToolbar';
import FileUploadZone from './FileUploadZone';
import FolderList from './FolderList';
import FileList from './FileList';
import FilePreviewModal from './FilePreviewModal';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName } from '@/lib/localizedText';

interface DocumentManagerProps {
  layouts?: Layout[];
  layoutFilter?: string | null;
  onLayoutFilterChange?: (layoutId: string | null) => void;
}

function getLayoutId(layout: Layout) {
  return layout._id || (layout as Layout & { id?: string }).id || '';
}

export default function DocumentManager({
  layouts = [],
  layoutFilter = null,
  onLayoutFilterChange,
}: DocumentManagerProps) {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [previewFile, setPreviewFile] = useState<LayoutDocumentFile | null>(null);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [uploadLayoutId, setUploadLayoutId] = useState<string>('');

  const {
    data,
    loading,
    error,
    currentFolderId,
    search,
    openFolder,
    setSearch,
    refresh,
  } = useDocuments({ token, layoutFilter });

  const layoutPayload = (layoutId: string) => (layoutId ? { layoutId } : {});

  const handleCreateFolder = async (name: string) => {
    if (!token) return;
    setCreatingFolder(true);
    try {
      await api.post(
        '/documents/folders',
        { name, parentId: currentFolderId, ...layoutPayload(layoutFilter || '') },
        token
      );
      notify.success('Folder created');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to create folder'));
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!token || !files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      if (currentFolderId) formData.append('folderId', currentFolderId);
      const mapLayoutId = uploadLayoutId || layoutFilter || '';
      if (mapLayoutId) formData.append('layoutId', mapLayoutId);
      await api.postForm('/documents/files', formData, token);
      notify.success(`${files.length} file(s) uploaded`);
      setShowUploadZone(false);
      setUploadLayoutId('');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRenameFolder = async (folder: LayoutDocumentFolder) => {
    if (!token) return;
    const name = await prompt.input({
      title: t('documents.renameFolderTitle'),
      defaultValue: folder.name,
      placeholder: t('documents.folderNamePlaceholder'),
    });
    if (!name || name === folder.name) return;
    try {
      await api.patch(`/documents/folders/${folder.id}`, { name }, token);
      notify.success('Folder renamed');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to rename folder'));
    }
  };

  const handleDeleteFolder = async (folder: LayoutDocumentFolder) => {
    if (!token) return;
    const ok = await confirm({
      title: 'Delete folder',
      message: `Delete empty folder "${folder.name}"? Only empty folders can be deleted.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/documents/folders/${folder.id}`, token);
      notify.success('Folder deleted');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to delete folder'));
    }
  };

  const handleRenameFile = async (file: LayoutDocumentFile) => {
    if (!token) return;
    const name = await prompt.input({
      title: t('documents.renameFileTitle'),
      defaultValue: file.name,
      placeholder: t('documents.fileNamePlaceholder'),
    });
    if (!name || name === file.name) return;
    try {
      await api.patch(`/documents/files/${file.id}`, { name }, token);
      notify.success('File renamed');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to rename file'));
    }
  };

  const handleMapLayout = async (file: LayoutDocumentFile) => {
    if (!token || !layouts.length) return;
    const layoutId = await prompt.select({
      title: t('documents.linkLayoutTitle'),
      message: t('documents.linkLayoutMessage', { name: file.name }),
      defaultValue: file.layoutId || '',
      options: [
        { value: '', label: t('documents.linkLayoutNone') },
        ...layouts.map((layout) => ({
          value: getLayoutId(layout),
          label: getLayoutDisplayName(layout, locale),
        })),
      ],
    });
    if (layoutId === null) return;

    try {
      await api.patch(
        `/documents/files/${file.id}`,
        { layoutId: layoutId || null },
        token
      );
      notify.success(layoutId ? 'Document linked to layout' : 'Layout link removed');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to update layout link'));
    }
  };

  const handleMoveFile = async (file: LayoutDocumentFile) => {
    if (!token) return;
    const folderOptions = [
      { value: '', label: t('documents.moveFileRoot') },
      ...(data?.folders || []).map((folder) => ({
        value: folder.id,
        label: folder.name,
      })),
    ];
    const folderId = await prompt.select({
      title: t('documents.moveFileTitle'),
      message: t('documents.moveFileMessage', { name: file.name }),
      defaultValue: file.folderId || '',
      options: folderOptions,
    });
    if (folderId === null) return;
    try {
      await api.patch(
        `/documents/files/${file.id}`,
        { folderId: folderId || null },
        token
      );
      notify.success('File moved');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to move file'));
    }
  };

  const handleDeleteFile = async (file: LayoutDocumentFile) => {
    if (!token) return;
    const ok = await confirm({
      title: 'Delete file',
      message: `Delete "${file.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/documents/files/${file.id}`, token);
      notify.success('File deleted');
      await refresh();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to delete file'));
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Files className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">My Documents</h3>
            <p className="text-xs text-gray-500">
              Upload and organize your files. Linking to a layout is optional.
            </p>
          </div>
        </div>

        {onLayoutFilterChange && (
          <div className="sm:min-w-[220px]">
            <label htmlFor="doc-layout-filter" className="mb-1 block text-xs font-medium text-gray-600">
              Filter by layout (optional)
            </label>
            <select
              id="doc-layout-filter"
              value={layoutFilter || ''}
              onChange={(e) => onLayoutFilterChange(e.target.value || null)}
              className="input-field text-sm"
            >
              <option value="">All documents</option>
              {layouts.map((layout) => {
                const id = getLayoutId(layout);
                return (
                  <option key={id} value={id}>
                    {getLayoutDisplayName(layout, locale)}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      <DocumentToolbar
        search={search}
        onSearchChange={setSearch}
        onCreateFolder={handleCreateFolder}
        onUploadClick={() => {
          setShowUploadZone((v) => !v);
          fileInputRef.current?.click();
        }}
        creating={creatingFolder}
      />

      {showUploadZone && (
        <div className="mt-4 space-y-3">
          {layouts.length > 0 && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <label htmlFor="upload-layout-map" className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <Link2 className="h-3.5 w-3.5" />
                Link to layout (optional)
              </label>
              <select
                id="upload-layout-map"
                value={uploadLayoutId || layoutFilter || ''}
                onChange={(e) => setUploadLayoutId(e.target.value)}
                className="input-field max-w-xs text-sm"
              >
                <option value="">No layout</option>
                {layouts.map((layout) => {
                  const id = getLayoutId(layout);
                  return (
                    <option key={id} value={id}>
                      {getLayoutDisplayName(layout, locale)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          <FileUploadZone
            onUpload={handleUpload}
            uploading={uploading}
            inputRef={fileInputRef}
          />
        </div>
      )}

      {data?.breadcrumb && !search && (
        <div className="mt-4">
          <FolderBreadcrumb items={data.breadcrumb} onNavigate={openFolder} />
        </div>
      )}

      <div className="mt-4 space-y-4">
        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded-xl bg-gray-100" />
            <div className="h-12 rounded-xl bg-gray-100" />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && data && (
          <>
            <FolderList
              folders={data.folders}
              onOpen={openFolder}
              onRename={handleRenameFolder}
              onDelete={handleDeleteFolder}
            />
            <FileList
              files={data.files}
              token={token}
              showLayoutColumn={!layoutFilter}
              onPreview={setPreviewFile}
              onRename={handleRenameFile}
              onDelete={handleDeleteFile}
              onMove={handleMoveFile}
              onMapLayout={layouts.length ? handleMapLayout : undefined}
            />
            {!data.folders.length && !data.files.length && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                <p className="text-sm text-gray-500">
                  {search
                    ? 'No files or folders match your search.'
                    : layoutFilter
                      ? 'No documents linked to this layout yet. Upload files or clear the filter.'
                      : 'No documents yet. Upload files or create a folder.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <FilePreviewModal
        file={previewFile}
        token={token}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
