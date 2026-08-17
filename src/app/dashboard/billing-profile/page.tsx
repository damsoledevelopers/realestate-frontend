'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { fetchMyBillingProfile, saveMyBillingProfile } from '@/lib/billingProfiles';
import type { BillingProfile } from '@/lib/types';
import { resolveMediaUrl } from '@/lib/media';

const emptyProfile = {
  companyName: '',
  gstNumber: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  bankAccountName: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankBranch: '',
};

export default function BillingProfilePage() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [form, setForm] = useState(emptyProfile);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProfile = () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    fetchMyBillingProfile(token)
      .then((profile: BillingProfile) => {
        setForm({
          companyName: profile.companyName || '',
          gstNumber: profile.gstNumber || '',
          contactPerson: profile.contactPerson || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          pincode: profile.pincode || '',
          bankAccountName: profile.bankAccountName || '',
          bankName: profile.bankName || '',
          bankAccountNumber: profile.bankAccountNumber || '',
          bankIfsc: profile.bankIfsc || '',
          bankBranch: profile.bankBranch || '',
        });
        setLogoPreview(profile.logoUrl || '');
      })
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err, t('billing.loadFailed'));
        setLoadError(message);
        notify.error(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (logoFile) formData.append('logo', logoFile);
      await saveMyBillingProfile(formData, token);
      notify.success(t('billing.saveSuccess'));
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('billing.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="dashboard-page"><p className="text-sm text-gray-400">{t('common.loading')}</p></div>;
  }

  if (loadError) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <div>
            <h2 className="page-header-title">{t('billing.pageTitle')}</h2>
            <p className="page-header-subtitle">{t('billing.pageSubtitle')}</p>
          </div>
        </div>
        <div className="card py-12 text-center">
          <p className="text-sm text-red-500">{loadError}</p>
          <button type="button" onClick={loadProfile} className="btn-primary mt-4">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('billing.pageTitle')}</h2>
          <p className="page-header-subtitle">{t('billing.pageSubtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium">{t('billing.logo')}</label>
          {logoPreview && (
            <div className="mb-3">
              <Image
                src={resolveMediaUrl(logoPreview)}
                alt="Billing logo"
                width={120}
                height={64}
                className="h-16 w-auto rounded border object-contain"
                unoptimized
              />
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="input-field"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setLogoFile(file);
              if (file) setLogoPreview(URL.createObjectURL(file));
            }}
          />
        </div>

        <div className="form-grid">
          <div>
            <label className="mb-1 block text-xs font-medium">{t('billing.companyName')}</label>
            <input className="input-field" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('billing.gst')}</label>
            <input className="input-field" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label className="mb-1 block text-xs font-medium">{t('billing.contactPerson')}</label>
            <input className="input-field" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('billing.phone')}</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">{t('billing.email')}</label>
          <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">{t('billing.address')}</label>
          <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="form-grid">
          <div>
            <label className="mb-1 block text-xs font-medium">{t('billing.city')}</label>
            <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('billing.state')}</label>
            <input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('billing.pincode')}</label>
            <input className="input-field" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('billing.bankDetails')}</h3>
          <div className="space-y-3">
            <div className="form-grid">
              <div>
                <label className="mb-1 block text-xs font-medium">{t('billing.bankName')}</label>
                <input className="input-field" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('billing.accountName')}</label>
                <input className="input-field" value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label className="mb-1 block text-xs font-medium">{t('billing.accountNumber')}</label>
                <input className="input-field" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('billing.ifsc')}</label>
                <input className="input-field" value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t('billing.branch')}</label>
              <input className="input-field" value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
