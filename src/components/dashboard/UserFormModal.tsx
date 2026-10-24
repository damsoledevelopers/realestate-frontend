'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/lib/notify';

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'super_admin' | 'dashboard_admin' | 'user' | 'partner' | 'customer' | 'admin';
  isActive: boolean;
  assignments: { assetType: 'layout' | 'plot' | 'farm' | 'land'; assetId: string }[];
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
  assignments: [],
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
  const [assets, setAssets] = useState<{id:string;assetType:'layout'|'plot'|'farm'|'land';label:string}[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetType, setAssetType] = useState('all');
  const [assetsLoading, setAssetsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialUser) {
      setForm({
        name: initialUser.name,
        email: initialUser.email,
        password: '',
        phone: initialUser.phone || '',
        role: ['super_admin', 'dashboard_admin', 'customer', 'admin', 'partner'].includes(initialUser.role)
          ? (initialUser.role as UserFormValues['role'])
          : 'user',
        isActive: initialUser.isActive,
        assignments: [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    if (!token) return;
    setAssetsLoading(true);
    Promise.all([
      api.get<{assets: {id:string;assetType:'layout'|'plot'|'farm'|'land';label:string}[]}>(`/users/assignment-assets`, token),
      mode === 'edit' && initialUser ? api.get<{assignments:{assetType:'layout'|'plot'|'farm'|'land';assetId:string}[]}>(`/users/${initialUser._id}/assignments`, token) : Promise.resolve({assignments: [] as {assetType:'layout'|'plot'|'farm'|'land';assetId:string}[]}),
    ]).then(([assetData, assignmentData]) => {
      setAssets(assetData.assets || []);
      setForm(prev => ({...prev, assignments: assignmentData.assignments || []}));
    }).catch((err) => notify.error((err as {message?:string}).message || 'Could not load assignable assets')).finally(() => setAssetsLoading(false));
  }, [open, mode, initialUser, token]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel w-full max-w-xl max-h-[90vh] overflow-y-auto">
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
                  <option value="admin">Admin (Enquiries only)</option>
                  <option value="dashboard_admin">Admin (Dashboard access)</option>
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

          <section className="rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
            <div><h4 className="font-semibold text-gray-900">Assign Assets</h4><p className="text-xs text-gray-500 mt-1">Choose current assets to grant this user access. Future assets are not automatically assigned.</p></div>
            {assetsLoading ? <p className="text-sm text-gray-500">Loading assets…</p> : <>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2">
                <input value={assetSearch} onChange={e=>setAssetSearch(e.target.value)} placeholder="Search assets by name or ID" className="input-field w-full" />
                <select value={assetType} onChange={e=>setAssetType(e.target.value)} className="input-field w-full"><option value="all">All asset types</option><option value="layout">Layouts</option><option value="plot">Plots</option><option value="farm">Farms</option><option value="land">Lands</option></select>
              </div>
              <div className="flex flex-wrap gap-2 text-sm"><button type="button" className="btn-secondary" onClick={()=>setForm(prev=>({...prev,assignments:assets.map(a=>({assetType:a.assetType,assetId:a.id}))}))}>All current assets</button><button type="button" className="btn-secondary" onClick={()=>setForm(prev=>({...prev,assignments:prev.assignments.filter(a=>!assets.some(x=>x.id===a.assetId&&x.assetType===a.assetType))}))}>Deselect visible</button><button type="button" className="btn-secondary" onClick={()=>setForm(prev=>({...prev,assignments:[]}))}>Clear selection</button></div>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-100 divide-y">{assets.filter(a=>(assetType==='all'||a.assetType===assetType)&&`${a.label} ${a.id}`.toLowerCase().includes(assetSearch.toLowerCase())).map(a=>{const checked=form.assignments.some(x=>x.assetType===a.assetType&&x.assetId===a.id);return <label key={`${a.assetType}:${a.id}`} className="flex items-start gap-2 p-2.5 text-sm hover:bg-gray-50 cursor-pointer"><input type="checkbox" className="mt-1" checked={checked} onChange={()=>setForm(prev=>({...prev,assignments:checked?prev.assignments.filter(x=>!(x.assetType===a.assetType&&x.assetId===a.id)):[...prev.assignments,{assetType:a.assetType,assetId:a.id}]}))}/><span className="min-w-0"><span className="block font-medium text-gray-800">{a.label}</span><span className="block text-xs text-gray-500 break-all">{a.assetType} · {a.id}</span></span></label>})}{assets.length===0&&<p className="p-3 text-sm text-gray-500">No assignable assets found.</p>}</div>
              <p className="text-xs text-gray-500">{form.assignments.length} asset(s) selected</p>
            </>}
          </section>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
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
