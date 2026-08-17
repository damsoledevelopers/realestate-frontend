'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  BUYER_CATEGORY_LABELS,
  createCustomer,
  KYC_STATUS_LABELS,
  updateCustomer,
  type CreateCustomerPayload,
} from '@/lib/customers';
import type { BuyerCategory, CustomerKycStatus, CustomerRecord } from '@/lib/types';
import { useManagedLayoutList } from '@/hooks/useManagedLayoutList';

interface CustomerFormModalProps {
  customer?: CustomerRecord | null;
  defaultLayoutId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerFormModal({
  customer,
  defaultLayoutId,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const { data: layouts = [] } = useManagedLayoutList();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    buyerCategory: (customer?.buyerCategory || 'plot_buyer') as BuyerCategory,
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    alternatePhone: customer?.alternatePhone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || '',
    kycStatus: (customer?.kycStatus || 'pending') as CustomerKycStatus,
    pan: customer?.pan || '',
    aadhaarLast4: customer?.aadhaarLast4 || '',
    gstNumber: customer?.gstNumber || '',
    kycNotes: customer?.kycNotes || '',
    notes: customer?.notes || '',
    primaryLayoutId: customer?.primaryLayoutId || defaultLayoutId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      const payload: CreateCustomerPayload = { ...form };
      if (customer) {
        await updateCustomer(customer._id, payload, token);
        notify.success(t('customers.updateSuccess'));
      } else {
        await createCustomer(payload, token);
        notify.success(t('customers.createSuccess'));
      }
      onSaved();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, customer ? t('customers.updateFailed') : t('customers.createFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel max-w-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {customer ? t('customers.editTitle') : t('customers.createTitle')}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.buyerCategory')}</label>
              <select className="input-field" value={form.buyerCategory} onChange={(e) => setForm({ ...form, buyerCategory: e.target.value as BuyerCategory })}>
                {Object.entries(BUYER_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.layout')}</label>
              <select className="input-field" value={form.primaryLayoutId} onChange={(e) => setForm({ ...form, primaryLayoutId: e.target.value })} required>
                <option value="">{t('customers.selectLayout')}</option>
                {layouts.map((layout) => (
                  <option key={layout._id} value={layout._id}>{layout.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.name')}</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.phone')}</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.email')}</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.alternatePhone')}</label>
              <input className="input-field" value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">{t('customers.address')}</label>
            <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="form-grid">
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.city')}</label>
              <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.state')}</label>
              <input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('customers.pincode')}</label>
              <input className="input-field" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h3 className="mb-2 text-sm font-semibold">{t('customers.kycSection')}</h3>
            <div className="form-grid">
              <div>
                <label className="mb-1 block text-xs font-medium">{t('customers.kycStatus')}</label>
                <select className="input-field" value={form.kycStatus} onChange={(e) => setForm({ ...form, kycStatus: e.target.value as CustomerKycStatus })}>
                  {Object.entries(KYC_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('customers.pan')}</label>
                <input className="input-field" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('customers.aadhaar')}</label>
                <input className="input-field" maxLength={4} value={form.aadhaarLast4} onChange={(e) => setForm({ ...form, aadhaarLast4: e.target.value })} placeholder="Last 4 digits" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">{t('customers.notes')}</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="btn-stack mt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
