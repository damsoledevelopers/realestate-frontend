'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/lib/notify';

type AssetType = 'layout' | 'farm' | 'plot' | 'land';
type AssetOption = { id: string; assetType: AssetType; label: string };
type AssetResponse = { assets: AssetOption[] };

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'super_admin' | 'user' | 'partner' | 'customer' | 'admin';
  isActive: boolean;
  assignments?: { assetType: AssetType; assetId: string }[];
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
  const { token } = useAuth();
  const [form, setForm] = useState<UserFormValues>(EMPTY_FORM);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [assetSearch, setAssetSearch] = useState('');
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | AssetType>('all');

  useEffect(() => {
    if (!open) return;
    setSelectedAssets(new Set());
    setAssetSearch('');
    if (mode === 'create' && token) {
      setAssetsLoading(true);
      api.get<AssetResponse>('/users/assignable-assets', token)
        .then((data) => setAssets(data.assets || []))
        .catch((error: { message?: string }) => notify.error(error.message || 'Could not load assets for assignment'))
        .finally(() => setAssetsLoading(false));
    }
    if (mode === 'edit' && initialUser) {
      setForm({
        name: initialUser.name,
        email: initialUser.email,
        password: '',
        phone: initialUser.phone || '',
        role: ['super_admin', 'customer', 'admin', 'partner'].includes(initialUser.role)
          ? (initialUser.role as UserFormValues['role'])
          : 'user',
        isActive: initialUser.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, mode, initialUser, token]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const assignments = Array.from(selectedAssets).map((key) => {
      const split = key.indexOf(':');
      return { assetType: key.slice(0, split) as AssetType, assetId: key.slice(split + 1) };
    });
    await onSubmit({ ...form, assignments });
  };

  const toggleAsset = (key: string) => setSelectedAssets((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const visibleAssets = assets.filter((asset) =>
    (assetTypeFilter === 'all' || asset.assetType === assetTypeFilter) &&
    asset.label.toLocaleLowerCase().includes(assetSearch.trim().toLocaleLowerCase())
  );

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                  <option value="partner">Partner (managed in Users)</option>
                  <option value="admin">Admin</option>
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

          {mode === 'create' && (
            <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Assign layouts, farms, plots and lands</h4>
                <p className="mt-1 text-xs text-gray-500">Select the existing database assets this user should be able to access. You can assign more assets later from the user details panel.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input className="input-field w-full" value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} placeholder="Search assets by name, plot, survey or location…" />
                <select className="input-field w-full" value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value as 'all' | AssetType)}>
                  <option value="all">All asset types</option><option value="layout">Layouts</option><option value="farm">Farms</option><option value="plot">Individual plots</option><option value="land">Lands</option>
                </select>
              </div>
              {assetsLoading ? <p className="text-sm text-gray-500">Loading existing assets…</p> : visibleAssets.length === 0 ? <p className="rounded-lg bg-white p-3 text-sm text-gray-500">No matching assets found in the database.</p> : (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                  {visibleAssets.map((asset) => { const key = `${asset.assetType}:${asset.id}`; return <label key={key} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-emerald-50"><input type="checkbox" className="mt-1" checked={selectedAssets.has(key)} onChange={() => toggleAsset(key)} /><span><span className="font-medium">{asset.label}</span><span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs capitalize text-gray-600">{asset.assetType === 'plot' ? 'Individual plot' : asset.assetType}</span></span></label>; })}
                </div>
              )}
              <p className="text-xs text-gray-600">{selectedAssets.size} asset(s) selected</p>
            </section>
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
