'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { DOCUMENT_ACCEPT } from '@/lib/documents';

interface FileUploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  uploading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export default function FileUploadZone({ onUpload, uploading = false, inputRef }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length || uploading) return;
      await onUpload(Array.from(fileList));
    },
    [onUpload, uploading]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        await handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
        dragOver
          ? 'border-primary-400 bg-primary-50/60'
          : 'border-gray-200 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/30'
      }`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
        <Upload className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-gray-900">
        {uploading ? 'Uploading files...' : 'Drag & drop files here'}
      </p>
      <p className="mt-1 text-xs text-gray-500">PDF, Word, Excel, AutoCAD, images, ZIP/RAR (max 25MB each)</p>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef?.current?.click()}
        className="btn-secondary mt-4 text-xs"
      >
        Browse Files
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={async (e) => {
          await handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
