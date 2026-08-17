'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  fetchPriceHistory,
  PRICE_UPDATE_REASON_LABELS,
  updatePropertyPrice,
} from '@/lib/propertyPricing';
import { formatPropertyPrice, formatPropertyType } from '@/lib/properties';
import type { PriceHistoryEntry, PriceUpdateReason, PricingEntityType } from '@/lib/types';
import { History, IndianRupee } from 'lucide-react';

interface PropertyPricingModalProps {
  entityType: PricingEntityType;
  entityId: string;
  entityLabel: string;
  currentPrice: number | null;
  canManage: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function PropertyPricingModal({
  entityType,
  entityId,
  entityLabel,
  currentPrice,
  canManage,
  onClose,
  onUpdated,
}: PropertyPricingModalProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const [price, setPrice] = useState(currentPrice != null ? String(currentPrice) : '');
  const [updateReason, setUpdateReason] = useState<PriceUpdateReason>('market_value');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoadingHistory(true);
    fetchPriceHistory(entityType, entityId, token)
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [entityType, entityId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canManage) return;

    const parsedPrice = price.trim() === '' ? null : Number(price);
    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      notify.error(t('pricing.invalidPrice'));
      return;
    }

    setSaving(true);
    try {
      await updatePropertyPrice(
        entityType,
        entityId,
        {
          price: parsedPrice,
          updateReason,
          notes: notes.trim(),
        },
        token
      );
      notify.success(t('pricing.updateSuccess'));
      onUpdated();
      onClose();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('pricing.updateFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              {formatPropertyType(entityType)}
            </p>
            <h2 className="text-lg font-semibold text-gray-900">{entityLabel}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('pricing.currentPrice')}:{' '}
              <span className="font-medium text-gray-900">
                {formatPropertyPrice(currentPrice, t('common.onRequest'))}
              </span>
            </p>
          </div>
        </div>

        {canManage ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('pricing.newPrice')}
              </label>
              <input
                type="number"
                min={0}
                step="any"
                className="input-field"
                placeholder={t('pricing.blankIfNotFinalized')}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">{t('pricing.blankHint')}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('pricing.updateReason')}
              </label>
              <select
                className="input-field"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value as PriceUpdateReason)}
              >
                {Object.entries(PRICE_UPDATE_REASON_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('pricing.notes')}
              </label>
              <textarea
                className="input-field min-h-[72px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('pricing.notesPlaceholder')}
              />
            </div>

            <div className="btn-stack">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? t('common.saving') : t('pricing.savePrice')}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-gray-500">{t('pricing.noPermission')}</p>
        )}

        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <History className="h-4 w-4 text-gray-500" />
            {t('pricing.historyTitle')}
          </div>

          {loadingHistory ? (
            <p className="mt-3 text-sm text-gray-400">{t('common.loading')}</p>
          ) : history.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">{t('pricing.noHistory')}</p>
          ) : (
            <div className="mt-3 max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-gray-500">
                  <tr>
                    <th className="py-2 pr-2">{t('pricing.colDate')}</th>
                    <th className="py-2 pr-2">{t('pricing.colPrevious')}</th>
                    <th className="py-2 pr-2">{t('pricing.colNew')}</th>
                    <th className="py-2 pr-2">{t('pricing.colReason')}</th>
                    <th className="py-2">{t('pricing.colUpdatedBy')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {history.map((entry) => (
                    <tr key={entry._id}>
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-2">{formatPropertyPrice(entry.previousPrice, t('common.onRequest'))}</td>
                      <td className="py-2 pr-2 font-medium">{formatPropertyPrice(entry.newPrice, t('common.onRequest'))}</td>
                      <td className="py-2 pr-2">
                        {PRICE_UPDATE_REASON_LABELS[entry.updateReason] || entry.updateReason}
                      </td>
                      <td className="py-2">{entry.updatedBy?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
