'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, Upload } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { SITE_PHOTO_ACCEPT } from '@/lib/sitePhotos';

interface SitePhotoUploadZoneProps {
  onUpload: (files: File[], source: 'camera' | 'gallery' | 'upload') => Promise<void>;
  uploading?: boolean;
  disabled?: boolean;
}

export default function SitePhotoUploadZone({
  onUpload,
  uploading = false,
  disabled = false,
}: SitePhotoUploadZoneProps) {
  const { t } = useLocale();
  const [dragOver, setDragOver] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null, source: 'camera' | 'gallery' | 'upload') => {
      if (!fileList?.length || uploading || disabled) return;
      await onUpload(Array.from(fileList), source);
    },
    [onUpload, uploading, disabled]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        await handleFiles(e.dataTransfer.files, 'upload');
      }}
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
        dragOver
          ? 'border-primary-400 bg-primary-50/60'
          : 'border-gray-200 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/30'
      } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
        <Upload className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-gray-900">
        {uploading ? t('sitePhotos.uploading') : t('sitePhotos.uploadHint')}
      </p>
      <p className="mt-1 text-xs text-gray-500">{t('sitePhotos.uploadLimits')}</p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          disabled={uploading || disabled}
          onClick={() => cameraInputRef.current?.click()}
          className="btn-primary inline-flex items-center gap-1.5 text-xs"
        >
          <Camera className="h-4 w-4" />
          {t('sitePhotos.takePhoto')}
        </button>
        <button
          type="button"
          disabled={uploading || disabled}
          onClick={() => galleryInputRef.current?.click()}
          className="btn-secondary inline-flex items-center gap-1.5 text-xs"
        >
          <ImagePlus className="h-4 w-4" />
          {t('sitePhotos.chooseGallery')}
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept={SITE_PHOTO_ACCEPT}
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          await handleFiles(e.target.files, 'camera');
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={SITE_PHOTO_ACCEPT}
        multiple
        className="hidden"
        onChange={async (e) => {
          await handleFiles(e.target.files, 'gallery');
          e.target.value = '';
        }}
      />
    </div>
  );
}
