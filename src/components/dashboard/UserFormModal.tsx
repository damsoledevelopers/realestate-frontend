'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { User } from '@/lib/types';

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'super_admin' | 'user' | 'customer';
  isActive: boolean;
}

interface UserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialUser?: User | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

const EMPTY_FORM: UserFormValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'user',
  isActive: true,
};

export default function UserFormModal({
  open,
  mode,
  initialUser,
  saving = false,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<UserFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialUser) {
      setForm({
        name: initialUser.name,
        email: initialUser.email,
        password: '',
        phone: initialUser.phone || '',
        role:
          initialUser.role === 'super_admin' || initialUser.role === 'customer'
            ? initialUser.role
            : 'user',
        isActive: initialUser.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, mode, initialUser]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel sm:max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              {mode === 'create'
                ? t('dashboard.users.createTitle')
                : t('dashboard.users.editTitle')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'create'
                ? t('dashboard.users.createSubtitle')
                : t('dashboard.users.editSubtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('dashboard.users.fieldName')}
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('dashboard.users.fieldEmail')}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {mode === 'create'
                ? t('dashboard.users.fieldPassword')
                : t('dashboard.users.fieldPasswordOptional')}
            </label>
            <input
              type="password"
              required={mode === 'create'}
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="input-field w-full"
              placeholder={mode === 'edit' ? t('dashboard.users.passwordKeep') : ''}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('dashboard.users.fieldPhone')}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="input-field w-full"
            />
          </div>
          {mode === 'create' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('dashboard.users.colRole')}
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      role: e.target.value as UserFormValues['role'],
                    }))
                  }
                  className="input-field w-full"
                >
                  <option value="customer">{t('dashboard.users.role.customer')}</option>
                  <option value="user">{t('dashboard.users.role.user')}</option>
                  <option value="super_admin">{t('dashboard.users.role.superAdmin')}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                {t('dashboard.users.activeOnCreate')}
              </label>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? t('common.saving') : mode === 'create' ? t('dashboard.users.createUser') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
