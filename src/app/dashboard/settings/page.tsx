'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import PropertyStatusColorEditor from '@/components/property/PropertyStatusColorEditor';

export default function AdminSettingsPage() {
  const { t } = useLocale(); const { token, isSuperAdmin } = useAuth();
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!token || !isSuperAdmin) return; setLoading(true); api.get<{email:string}>('/site-settings/inquiry-email', token).then((r) => setEmail(r.email || '')).catch((e) => notify.error(getApiErrorMessage(e, 'Could not load inquiry email setting'))).finally(() => setLoading(false)); }, [token, isSuperAdmin]);
  const save = async () => { if (!token) return; setSaving(true); try { const result = await api.put<{email:string;message:string}>('/site-settings/inquiry-email', { email }, token); setEmail(result.email); notify.success(result.message || 'Inquiry email saved'); } catch (e) { notify.error(getApiErrorMessage(e, 'Could not save inquiry email')); } finally { setSaving(false); } };
  return <div className="dashboard-page space-y-6"><div className="page-header"><div><h2 className="page-header-title">{t('dashboard.settings.title')}</h2><p className="page-header-subtitle">{t('dashboard.settings.subtitle')}</p></div></div>{isSuperAdmin && <section className="card max-w-3xl space-y-4"><div><h3 className="text-lg font-semibold text-gray-900">Website inquiry recipient email</h3><p className="mt-1 text-sm text-gray-500">Website Contact / Inquiry form submissions are sent to this email. Only Super Admin can change this website setting; inquiry records themselves remain Admin-only.</p></div><label className="block text-sm font-medium text-gray-700" htmlFor="inquiry-recipient-email">Inquiry email address</label><input id="inquiry-recipient-email" className="form-input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" disabled={loading || saving} /><button type="button" onClick={save} disabled={loading || saving || !email.trim()} className="btn-primary disabled:opacity-50">{saving ? 'Saving…' : 'Save inquiry email'}</button></section>}<PropertyStatusColorEditor /></div>;
}
