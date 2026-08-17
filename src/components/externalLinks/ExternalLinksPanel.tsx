'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  createExternalLink,
  deleteExternalLink,
  EXTERNAL_LINK_CATEGORIES,
  fetchExternalLinks,
  getCategoryLabel,
  updateExternalLink,
} from '@/lib/externalLinks';
import type { ExternalLinkCategory, ExternalLinkEntityType, ExternalLinkRecord } from '@/lib/types';

interface ExternalLinksPanelProps {
  entityType: ExternalLinkEntityType;
  entityId: string;
  entityLabel: string;
  canManage?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

const emptyForm = {
  title: '',
  url: '',
  category: 'custom' as ExternalLinkCategory,
  description: '',
};

export default function ExternalLinksPanel({
  entityType,
  entityId,
  entityLabel,
  canManage = false,
  compact = false,
  onClose,
}: ExternalLinksPanelProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const [links, setLinks] = useState<ExternalLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<ExternalLinkRecord | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchExternalLinks(entityType, entityId);
      setLinks(data.links);
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('externalLinks.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingLink(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (link: ExternalLinkRecord) => {
    setEditingLink(link);
    setForm({
      title: link.title,
      url: link.url,
      category: link.category,
      description: link.description || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLink(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canManage) return;

    if (!form.title.trim() || !form.url.trim()) {
      notify.error(t('externalLinks.requiredFields'));
      return;
    }

    setSaving(true);
    try {
      if (editingLink) {
        await updateExternalLink(
          editingLink._id,
          {
            title: form.title.trim(),
            url: form.url.trim(),
            category: form.category,
            description: form.description.trim(),
          },
          token
        );
        notify.success(t('externalLinks.updateSuccess'));
      } else {
        await createExternalLink(
          entityType,
          entityId,
          {
            title: form.title.trim(),
            url: form.url.trim(),
            category: form.category,
            description: form.description.trim(),
          },
          token
        );
        notify.success(t('externalLinks.createSuccess'));
      }
      closeForm();
      await load();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('externalLinks.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (link: ExternalLinkRecord) => {
    if (!token || !canManage) return;
    const ok = await confirm({
      title: t('externalLinks.deleteTitle'),
      message: t('externalLinks.deleteMessage', { title: link.title }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteExternalLink(link._id, token);
      notify.success(t('externalLinks.deleteSuccess'));
      await load();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('externalLinks.deleteFailed')));
    }
  };

  const content = (
    <div className={compact ? '' : 'space-y-4'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!compact && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                {t('externalLinks.tab')}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">{entityLabel}</h3>
            </>
          )}
          {compact && (
            <h3 className="text-base font-semibold text-gray-900">
              {t('externalLinks.tab')} — {entityLabel}
            </h3>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canManage && (
            <button type="button" onClick={openCreate} className="btn-primary text-xs">
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              {t('externalLinks.add')}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">{t('common.loading')}</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-gray-400">{t('externalLinks.empty')}</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link._id}
              className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                    {link.categoryLabel || getCategoryLabel(link.category)}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {link.title}
                  </a>
                </div>
                {link.description?.trim() && (
                  <p className="mt-1 text-xs text-gray-500">{link.description}</p>
                )}
                <p className="mt-1 truncate text-xs text-gray-400">{link.url}</p>
              </div>
              {canManage && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(link)}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link)}
                    className="rounded border border-red-100 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={compact ? 'mt-4 rounded-lg border border-gray-200 bg-white p-4' : 'card mt-4'}>
          <h4 className="font-medium text-gray-900">
            {editingLink ? t('externalLinks.editTitle') : t('externalLinks.addTitle')}
          </h4>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('externalLinks.fieldTitle')}
              </label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('externalLinks.fieldUrl')}
              </label>
              <input
                className="input-field"
                type="url"
                placeholder="https://"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('externalLinks.fieldCategory')}
              </label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as ExternalLinkCategory })
                }
              >
                {EXTERNAL_LINK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('externalLinks.fieldDescription')}
              </label>
              <textarea
                className="input-field min-h-[72px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('externalLinks.descriptionPlaceholder')}
              />
            </div>
            <div className="btn-stack">
              <button type="button" onClick={closeForm} className="btn-secondary flex-1">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (compact && onClose) {
    return (
      <div className="modal-overlay z-[55]" onClick={onClose}>
        <div
          className="modal-panel-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return <div className="card">{content}</div>;
}
