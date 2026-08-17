'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Download, Printer, QrCode, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import {
  downloadQrImage,
  fetchQrCode,
  printQrImage,
  uploadQrCode,
  type QrCodeRecord,
  type QrEntityType,
} from '@/lib/qrCodes';

interface PropertyQrPanelProps {
  entityType: QrEntityType;
  entityId: string;
  entityLabel: string;
  canManage?: boolean;
  compact?: boolean;
  className?: string;
}

export default function PropertyQrPanel({
  entityType,
  entityId,
  entityLabel,
  canManage = true,
  compact = false,
  className = '',
}: PropertyQrPanelProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qr, setQr] = useState<QrCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const loadQr = useCallback(async () => {
    if (!token || !entityId) return;
    setLoading(true);
    try {
      const record = await fetchQrCode(entityType, entityId, token);
      setQr(record);
    } catch (err: unknown) {
      setQr(null);
      const message = getApiErrorMessage(err, '');
      if (message && !message.toLowerCase().includes('not found') && !message.toLowerCase().includes('uploaded')) {
        notify.error(getApiErrorMessage(err, t('qr.loadFailed')));
      }
    } finally {
      setLoading(false);
    }
  }, [token, entityType, entityId, t]);

  useEffect(() => {
    loadQr();
  }, [loadQr]);

  const handleUpload = async (file: File) => {
    if (!token || !canManage) return;
    setWorking(true);
    try {
      const record = await uploadQrCode(entityType, entityId, file, token);
      setQr(record);
      notify.success(t('qr.uploadSuccess'));
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('qr.uploadFailed')));
    } finally {
      setWorking(false);
    }
  };

  const handleDownload = async () => {
    if (!token || !qr) return;
    try {
      await downloadQrImage(entityType, entityId, token, `${entityType}-${entityId}.png`);
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('qr.downloadFailed')));
    }
  };

  const imageUrl = qr?.imageUrl ? resolveMediaUrl(qr.imageUrl) : '';

  const uploadInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) handleUpload(file);
        event.target.value = '';
      }}
    />
  );

  if (loading) {
    return (
      <div className={compact ? 'text-xs text-gray-400' : `card flex h-full flex-col py-6 text-center text-sm text-gray-400 ${className}`}>
        {t('common.loading')}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {qr && (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600"
            title={t('qr.view')}
          >
            <QrCode className="h-4 w-4" />
          </button>
        )}
        {canManage && (
          <button
            type="button"
            disabled={working}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600"
            title={t('qr.upload')}
          >
            <Upload className="h-4 w-4" />
          </button>
        )}
        {uploadInput}
        {showPreview && qr && (
          <QrPreviewModal
            title={entityLabel}
            imageUrl={imageUrl}
            scanUrl={qr.scanUrl}
            onClose={() => setShowPreview(false)}
            onDownload={handleDownload}
            onPrint={() => printQrImage(imageUrl, entityLabel)}
            canManage={canManage}
            onUploadClick={() => fileInputRef.current?.click()}
            working={working}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`card flex h-full flex-col space-y-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-900">{t('qr.title')}</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">{entityLabel}</p>
        </div>
        {qr?.source === 'upload' && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            {t('qr.sourceUpload')}
          </span>
        )}
      </div>

      {qr ? (
        <>
          <div className="flex flex-1 flex-col justify-center space-y-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="mx-auto block rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary-200"
            >
              <Image
                src={imageUrl}
                alt={`QR code for ${entityLabel}`}
                width={180}
                height={180}
                className="h-44 w-44 object-contain"
                unoptimized
              />
            </button>
            <p className="break-all text-center text-xs text-gray-500">{qr.scanUrl}</p>
          </div>
          <div className="mt-auto flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setShowPreview(true)} className="btn-secondary text-xs">
              {t('qr.view')}
            </button>
            <button type="button" onClick={handleDownload} className="btn-secondary inline-flex items-center gap-1 text-xs">
              <Download className="h-3.5 w-3.5" />
              {t('qr.download')}
            </button>
            <button
              type="button"
              onClick={() => printQrImage(imageUrl, entityLabel)}
              className="btn-secondary inline-flex items-center gap-1 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              {t('qr.print')}
            </button>
            {canManage && (
              <button
                type="button"
                disabled={working}
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center gap-1 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                {t('qr.upload')}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center space-y-3 py-4 text-center">
          <p className="text-sm text-gray-500">{t('qr.emptyUpload')}</p>
          {canManage && (
            <button
              type="button"
              disabled={working}
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary inline-flex items-center gap-1 text-sm"
            >
              <Upload className="h-4 w-4" />
              {t('qr.upload')}
            </button>
          )}
        </div>
      )}

      {uploadInput}

      {showPreview && qr && (
        <QrPreviewModal
          title={entityLabel}
          imageUrl={imageUrl}
          scanUrl={qr.scanUrl}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          onPrint={() => printQrImage(imageUrl, entityLabel)}
          canManage={canManage}
          onUploadClick={() => fileInputRef.current?.click()}
          working={working}
        />
      )}
    </div>
  );
}

function QrPreviewModal({
  title,
  imageUrl,
  scanUrl,
  onClose,
  onDownload,
  onPrint,
  canManage,
  onUploadClick,
  working,
}: {
  title: string;
  imageUrl: string;
  scanUrl: string;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
  canManage: boolean;
  onUploadClick: () => void;
  working: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="pr-8 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="mt-4 flex justify-center">
          <Image src={imageUrl} alt={title} width={280} height={280} className="h-64 w-64 object-contain" unoptimized />
        </div>
        <p className="mt-3 break-all text-center text-xs text-gray-500">{scanUrl}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onDownload} className="btn-secondary text-xs">
            {t('qr.download')}
          </button>
          <button type="button" onClick={onPrint} className="btn-secondary text-xs">
            {t('qr.print')}
          </button>
          {canManage && (
            <button type="button" disabled={working} onClick={onUploadClick} className="btn-primary text-xs">
              {t('qr.upload')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
