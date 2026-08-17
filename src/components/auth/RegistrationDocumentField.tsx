'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { FileText, ImageIcon, Upload } from 'lucide-react';
import FieldLabel from '@/components/ui/FieldLabel';
import { useLocale } from '@/context/LocaleContext';

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf';
const MAX_BYTES = 5 * 1024 * 1024;

export function validateRegistrationDocument(file: File): string | null {
  const mime = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.includes('heic') || mime.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif')) {
    return 'HEIC photos are not supported. Please choose a JPG, PNG, WEBP, or PDF file.';
  }

  const allowed =
    ACCEPTED_TYPES.includes(mime as (typeof ACCEPTED_TYPES)[number]) ||
    /\.(jpe?g|png|webp|pdf)$/.test(name);

  if (!allowed) {
    return 'Only JPG, PNG, WEBP, or PDF files are allowed.';
  }

  if (file.size > MAX_BYTES) {
    return 'File must be 5MB or smaller.';
  }

  if (file.size === 0) {
    return 'The selected file is empty.';
  }

  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  return mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

interface RegistrationDocumentFieldProps {
  label: string;
  hint: string;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
}

export default function RegistrationDocumentField({
  label,
  hint,
  file,
  error,
  onChange,
  onError,
}: RegistrationDocumentFieldProps) {
  const { t } = useLocale();
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (next: File | null) => {
      if (!next) {
        onChange(null);
        onError('');
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      const validationError = validateRegistrationDocument(next);
      if (validationError) {
        onChange(null);
        onError(validationError);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      onChange(next);
      onError('');
    },
    [onChange, onError]
  );

  const openFilePicker = () => inputRef.current?.click();

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files?.[0] || null);
  };

  const describedBy = [hintId, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  if (file) {
    const FileIcon = isPdfFile(file) ? FileText : ImageIcon;

    return (
      <div>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        <div
          className={`rounded-xl border px-3 py-2.5 transition ${
            error
              ? 'border-red-300 bg-red-50/50'
              : 'border-primary-200 bg-primary-50/40'
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  error ? 'bg-white text-red-600' : 'bg-white text-primary-600'
                }`}
              >
                <FileIcon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                  <span className="mx-1 text-gray-300" aria-hidden>
                    ·
                  </span>
                  <span className={error ? 'text-red-600' : 'text-primary-700'}>
                    {t('auth.register.sellerDocumentReady')}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 pl-10 sm:pl-0">
              <button
                type="button"
                className="text-xs font-medium text-primary-700 hover:text-primary-800"
                onClick={openFilePicker}
              >
                {t('auth.register.sellerDocumentChange')}
              </button>
              <span className="text-gray-200" aria-hidden>
                |
              </span>
              <button
                type="button"
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
                onClick={() => handleFile(null)}
              >
                {t('auth.register.sellerDocumentRemove')}
              </button>
            </div>
          </div>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="sr-only"
            aria-describedby={describedBy}
            onChange={(event) => handleFile(event.target.files?.[0] || null)}
          />
        </div>
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onClick={openFilePicker}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed px-3 py-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
          error
            ? 'border-red-300 bg-red-50/40'
            : dragOver
              ? 'border-primary-400 bg-primary-50/60'
              : 'border-gray-200 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/30'
        }`}
        aria-describedby={describedBy}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600">
          <Upload className="h-4 w-4" aria-hidden />
        </div>
        <p className="min-w-0 flex-1 text-sm text-gray-600">
          {t('auth.register.sellerDocumentEmptyTitle')}
        </p>
        <button
          type="button"
          className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            openFilePicker();
          }}
        >
          {t('auth.register.sellerDocumentBrowse')}
        </button>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          aria-describedby={describedBy}
          onChange={(event) => handleFile(event.target.files?.[0] || null)}
        />
      </div>
      <p id={hintId} className="mt-1 text-xs text-gray-500">
        {hint}
      </p>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
