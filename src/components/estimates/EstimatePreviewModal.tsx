'use client';

import { useState } from 'react';
import { Download, Printer, Share2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { updateEstimate, ESTIMATE_STATUS_LABELS } from '@/lib/estimates';
import {
  downloadEstimateDocument,
  previewEstimateHtml,
  printEstimateDocument,
  shareEstimateDocument,
} from '@/lib/downloadEstimate';
import type { EstimateRecord, EstimateStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/formatLocale';

interface EstimatePreviewModalProps {
  estimate: EstimateRecord;
  canManage?: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function EstimatePreviewModal({
  estimate,
  canManage = true,
  onClose,
  onUpdated,
}: EstimatePreviewModalProps) {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<EstimateStatus>(estimate.status);
  const [saving, setSaving] = useState(false);

  const handleStatusSave = async () => {
    if (!token || !canManage) return;
    setSaving(true);
    try {
      await updateEstimate(estimate._id, { status }, token);
      notify.success(t('estimates.updateSuccess'));
      onUpdated?.();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('estimates.updateFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{estimate.estimateNumber}</h2>
            <p className="text-sm text-gray-500">{estimate.customerName} · {formatCurrency(estimate.total, locale)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => printEstimateDocument(estimate)} className="btn-secondary inline-flex items-center gap-1 text-xs">
            <Printer className="h-3.5 w-3.5" />
            {t('estimates.print')}
          </button>
          <button type="button" onClick={() => downloadEstimateDocument(estimate)} className="btn-secondary inline-flex items-center gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            {t('estimates.download')}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await shareEstimateDocument(estimate);
                notify.success(t('estimates.shareSuccess'));
              } catch {
                notify.error(t('estimates.shareFailed'));
              }
            }}
            className="btn-secondary inline-flex items-center gap-1 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            {t('estimates.share')}
          </button>
        </div>

        {canManage && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <label className="mb-1 block text-xs font-medium">{t('estimates.status')}</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as EstimateStatus)}>
                {Object.entries(ESTIMATE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <button type="button" disabled={saving} onClick={handleStatusSave} className="btn-primary text-sm">
              {saving ? t('common.saving') : t('estimates.updateStatus')}
            </button>
          </div>
        )}

        <div
          className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4"
          dangerouslySetInnerHTML={{ __html: previewEstimateHtml(estimate) }}
        />
      </div>
    </div>
  );
}
