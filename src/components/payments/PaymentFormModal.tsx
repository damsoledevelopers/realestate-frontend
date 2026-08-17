'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { createPayment, PAYMENT_MODE_LABELS, type CreatePaymentPayload } from '@/lib/payments';
import type { PaymentMode } from '@/lib/types';
import { formatCurrency } from '@/lib/formatLocale';

interface PaymentFormModalProps {
  bookingId: string;
  customerName: string;
  plotNumber: string;
  balanceDue: number;
  onClose: () => void;
  onSaved: () => void;
}

const PAYMENT_MODES = Object.keys(PAYMENT_MODE_LABELS) as PaymentMode[];

export default function PaymentFormModal({
  bookingId,
  customerName,
  plotNumber,
  balanceDue,
  onClose,
  onSaved,
}: PaymentFormModalProps) {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: balanceDue > 0 ? String(balanceDue) : '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'upi' as PaymentMode,
    referenceNumber: '',
    remarks: '',
    status: 'success' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify.error(t('payments.invalidAmount'));
      return;
    }
    if (form.status === 'success' && amount > balanceDue) {
      notify.error(t('payments.exceedsBalance'));
      return;
    }

    setSaving(true);
    try {
      const payload: CreatePaymentPayload = {
        bookingId,
        amount,
        paymentDate: new Date(form.paymentDate).toISOString(),
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber,
        remarks: form.remarks,
        status: form.status,
      };
      await createPayment(payload, token);
      notify.success(t('payments.recordSuccess'));
      onSaved();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('payments.recordFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel-md">
        <h2 className="text-lg font-semibold">{t('payments.recordTitle')}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {customerName} · Plot {plotNumber} · {t('payments.balanceDue')}: {formatCurrency(balanceDue, locale)}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">{t('payments.amount')}</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input-field"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('payments.date')}</label>
            <input
              type="date"
              className="input-field"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('payments.mode')}</label>
            <select
              className="input-field"
              value={form.paymentMode}
              onChange={(e) => setForm({ ...form, paymentMode: e.target.value as PaymentMode })}
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {PAYMENT_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('payments.reference')}</label>
            <input
              className="input-field"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              placeholder={t('payments.referencePlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('payments.remarks')}</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </div>

        <div className="btn-stack mt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? t('common.saving') : t('payments.record')}
          </button>
        </div>
      </form>
    </div>
  );
}
