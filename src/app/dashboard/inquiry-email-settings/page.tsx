'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import { useLocale } from '@/context/LocaleContext';

export default function InquiryEmailSettingsPage() {
  const router = useRouter();
  const { token, isSuperAdmin, user } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (!isSuperAdmin && user?.role !== 'super_admin') {
      router.replace('/dashboard');
      return;
    }
    setLoading(true);
    api.get<{ email: string }>('/site-settings/inquiry-email', token)
      .then((result) => setEmail(result.email || ''))
      .catch((error) => notify.error(getApiErrorMessage(error, t('inquiryEmail.loadFailed'))))
      .finally(() => setLoading(false));
  }, [token, isSuperAdmin, user?.role, router]);

  const save = async () => {
    if (!token || !email.trim()) return;
    setSaving(true);
    try {
      const result = await api.put<{ email: string; message: string }>('/site-settings/inquiry-email', { email: email.trim() }, token);
      setEmail(result.email);
      notify.success(result.message || t('inquiryEmail.saveSuccess', { email: result.email }));
    } catch (error) {
      notify.error(getApiErrorMessage(error, t('inquiryEmail.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin && user?.role !== 'super_admin') return null;

  return (
    <main className="dashboard-page space-y-6">
      <header className="page-header">
        <div>
          <h1 className="page-header-title">{t('inquiryEmail.title')}</h1>
          <p className="page-header-subtitle">{t('inquiryEmail.subtitle')}</p>
        </div>
      </header>
      <section className="card max-w-3xl space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('inquiryEmail.cardTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('inquiryEmail.description')}</p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700" htmlFor="inquiry-recipient-email">{t('inquiryEmail.recipientLabel')}</label>
          <input id="inquiry-recipient-email" className="form-input w-full" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('inquiryEmail.placeholder')} disabled={loading || saving} />
        </div>
        <button type="button" onClick={save} disabled={loading || saving || !email.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? t('common.loading') : saving ? t('inquiryEmail.saving') : t('inquiryEmail.save')}
        </button>
      </section>
    </main>
  );
}
