'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  calculateEstimatePreview,
  createEstimate,
  DISCOUNT_TYPE_LABELS,
  ESTIMATE_STATUS_LABELS,
  type CreateEstimatePayload,
} from '@/lib/estimates';
import type { EstimateDiscountType, EstimateStatus, LayoutCustomer } from '@/lib/types';
import { formatCurrency } from '@/lib/formatLocale';

interface EstimateFormModalProps {
  layoutId: string;
  layoutName: string;
  customer?: LayoutCustomer | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyLineItem = { description: '', quantity: '1', unitPrice: '' };

export default function EstimateFormModal({
  layoutId,
  layoutName,
  customer,
  onClose,
  onSaved,
}: EstimateFormModalProps) {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: customer?.customerName || '',
    customerEmail: customer?.customerEmail || '',
    customerPhone: customer?.customerPhone || '',
    customerAddress: '',
    discountType: 'none' as EstimateDiscountType,
    discountValue: '0',
    taxRate: '0',
    validUntil: '',
    status: 'draft' as EstimateStatus,
    notes: '',
    terms: '',
    lineItems: [
      customer
        ? {
            description: `Plot ${customer.plotNumber} - ${layoutName}`,
            quantity: '1',
            unitPrice: customer.plotPrice != null ? String(customer.plotPrice) : '',
          }
        : emptyLineItem,
    ],
  });

  const preview = useMemo(
    () =>
      calculateEstimatePreview(
        form.lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          amount: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        })),
        form.discountType,
        Number(form.discountValue) || 0,
        Number(form.taxRate) || 0
      ),
    [form]
  );

  const updateLineItem = (index: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!form.customerName.trim()) {
      notify.error(t('estimates.customerRequired'));
      return;
    }
    if (!preview.lineItems.some((item) => item.description.trim() && item.amount > 0)) {
      notify.error(t('estimates.lineItemsRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload: CreateEstimatePayload = {
        layoutId,
        bookingId: customer?.bookingId,
        plotId: customer?.plotId,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        customerAddress: form.customerAddress.trim(),
        lineItems: preview.lineItems,
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        taxRate: Number(form.taxRate) || 0,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        status: form.status,
        notes: form.notes,
        terms: form.terms,
      };
      await createEstimate(payload, token);
      notify.success(t('estimates.createSuccess'));
      onSaved();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('estimates.createFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel max-w-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t('estimates.createTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500">{layoutName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.customerName')}</label>
              <input className="input-field" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.customerPhone')}</label>
              <input className="input-field" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.customerEmail')}</label>
              <input type="email" className="input-field" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.validUntil')}</label>
              <input type="date" className="input-field" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('estimates.customerAddress')}</label>
            <input className="input-field" value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">{t('estimates.lineItems')}</h3>
              <button
                type="button"
                className="text-xs font-medium text-primary-600 hover:underline"
                onClick={() => setForm({ ...form, lineItems: [...form.lineItems, { ...emptyLineItem }] })}
              >
                {t('estimates.addLineItem')}
              </button>
            </div>
            {form.lineItems.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-gray-200 p-3 sm:grid-cols-[2fr,1fr,1fr,auto]">
                <input className="input-field" placeholder={t('estimates.item')} value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} />
                <input type="number" min="0.01" step="0.01" className="input-field" placeholder={t('estimates.qty')} value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', e.target.value)} />
                <input type="number" min="0" step="0.01" className="input-field" placeholder={t('estimates.rate')} value={item.unitPrice} onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)} />
                {form.lineItems.length > 1 && (
                  <button type="button" className="text-xs text-red-600" onClick={() => setForm({ ...form, lineItems: form.lineItems.filter((_, i) => i !== index) })}>
                    {t('common.delete')}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.discountType')}</label>
              <select className="input-field" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as EstimateDiscountType })}>
                {Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.discountValue')}</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.taxRate')}</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('estimates.status')}</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EstimateStatus })}>
                {Object.entries(ESTIMATE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 text-sm">
            <p className="flex justify-between"><span>{t('estimates.subtotal')}</span><span>{formatCurrency(preview.subtotal, locale)}</span></p>
            {preview.discountAmount > 0 && <p className="flex justify-between"><span>{t('estimates.discount')}</span><span>-{formatCurrency(preview.discountAmount, locale)}</span></p>}
            {preview.taxAmount > 0 && <p className="flex justify-between"><span>{t('estimates.tax')}</span><span>{formatCurrency(preview.taxAmount, locale)}</span></p>}
            <p className="mt-2 flex justify-between text-base font-semibold"><span>{t('estimates.total')}</span><span>{formatCurrency(preview.total, locale)}</span></p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">{t('estimates.notes')}</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('estimates.terms')}</label>
            <textarea className="input-field" rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
          </div>
        </div>

        <div className="btn-stack mt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? t('layoutForm.saving') : t('estimates.create')}</button>
        </div>
      </form>
    </div>
  );
}
