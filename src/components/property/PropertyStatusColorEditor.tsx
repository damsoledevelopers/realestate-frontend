'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';
import { PropertyStatusRecord, StatusColorTokens } from '@/lib/propertyStatusConfig';
import { notify } from '@/lib/notify';

export default function PropertyStatusColorEditor() {
  const { token, isSuperAdmin } = useAuth();
  const { t } = useLocale();
  const { saleStatuses, updateStatuses } = usePropertyStatusConfig();
  const [draft, setDraft] = useState<PropertyStatusRecord[]>(saleStatuses);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(saleStatuses);
  }, [saleStatuses]);

  if (!isSuperAdmin) return null;

  const handleLabelChange = (key: string, label: string) => {
    setDraft((current) =>
      current.map((status) => (status.key === key ? { ...status, label } : status))
    );
  };

  const handleColorChange = (
    key: string,
    field: keyof StatusColorTokens,
    value: string
  ) => {
    setDraft((current) =>
      current.map((status) =>
        status.key === key
          ? { ...status, colors: { ...status.colors, [field]: value } }
          : status
      )
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      await updateStatuses(draft, token);
      notify.success(t('dashboard.settings.saveSuccess'));
    } catch {
      notify.error(t('dashboard.settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t('dashboard.settings.editorTitle')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{t('dashboard.settings.editorHint')}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {draft.map((status) => (
          <div
            key={status.key}
            className="rounded-xl border border-gray-200 bg-gray-50/80 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium"
                style={{
                  backgroundColor: status.colors.badgeBg,
                  color: status.colors.badgeText,
                }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: status.colors.indicator }}
                  aria-hidden="true"
                />
                <span className="truncate">{status.label || status.key}</span>
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {status.key}
              </span>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('dashboard.settings.label')}
              </label>
              <input
                type="text"
                value={status.label}
                onChange={(e) => handleLabelChange(status.key, e.target.value)}
                className="input-field"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['indicator', 'dashboard.settings.indicator'],
                  ['badgeBg', 'dashboard.settings.badgeBg'],
                  ['badgeText', 'dashboard.settings.badgeText'],
                ] as const
              ).map(([field, labelKey]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t(labelKey)}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={status.colors[field]}
                      onChange={(e) => handleColorChange(status.key, field, e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border border-gray-200 bg-white"
                    />
                    <input
                      type="text"
                      value={status.colors[field]}
                      onChange={(e) => handleColorChange(status.key, field, e.target.value)}
                      className="input-field font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? t('dashboard.settings.saving') : t('dashboard.settings.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
