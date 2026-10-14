'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpDown, Building2, Pencil, Plus, Search, Trash2, Trees, Wheat } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { fetchProperties, deleteProperty } from '@/lib/propertyApi';
import { formatPropertyArea, formatPropertyPrice } from '@/lib/properties';
import { getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Property, PropertyType } from '@/lib/types';
import StatusBadge from '@/components/property/StatusBadge';
import PropertyFormModal from '@/components/dashboard/PropertyFormModal';
import { useConfirm } from '@/context/ConfirmContext';
import { useManagedLayoutList } from '@/hooks/useManagedLayoutList';

interface PropertyTypeManagementViewProps {
  propertyType: Extract<PropertyType, 'farm' | 'land'>;
  titleKey: string;
  subtitleKey: string;
  addKey: string;
  emptyKey: string;
}

const PAGE_SIZE = 12;

// API responses can contain either a raw ObjectId string or a populated layout object.
function getLinkedLayoutId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as { _id?: unknown; id?: unknown };
    if (typeof record._id === 'string') return record._id;
    if (typeof record.id === 'string') return record.id;
  }
  return '';
}

export default function PropertyTypeManagementView({ propertyType, titleKey, subtitleKey, addKey, emptyKey }: PropertyTypeManagementViewProps) {
  const { token, user, isSuperAdmin } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const [layoutFilter, setLayoutFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const { data: layouts = [] } = useManagedLayoutList();

  // Load all records once so layout-name filtering and pagination work across every page.
  const { data, error, isLoading, mutate } = useSWR(
    token ? ['properties-by-layout', propertyType, token] : null,
    () => fetchProperties({ propertyType, page: 1, limit: 500 }, token),
    { revalidateOnFocus: false }
  );

  const properties = data?.properties ?? [];
  // The layout endpoint may include other GIS property types; this dropdown must list layouts only.
  const layoutOptions = useMemo(
    () => layouts.filter((layout) => !layout.propertyType || layout.propertyType === 'layout').sort((a, b) => a.name.localeCompare(b.name)),
    [layouts]
  );
  const filtered = useMemo(() => {
    const result = properties.filter((property) => {
      if (!layoutFilter) return true;
      return getLinkedLayoutId(property.linkedLayoutId) === layoutFilter;
    });
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [properties, layoutFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const canManage = (property: Property) => {
    if (isSuperAdmin) return true;
    const createdBy = typeof property.createdBy === 'string' ? property.createdBy : property.createdBy?._id;
    return Boolean(user?._id && createdBy && createdBy === user._id);
  };
  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (property: Property) => { setEditing(property); setShowForm(true); };
  const handleDelete = async (property: Property) => {
    if (!token) return;
    const ok = await confirm({ title: t('propertyForm.deleteTitle'), message: t('propertyForm.deleteMessage', { name: property.name }), confirmLabel: t('common.delete'), variant: 'danger' });
    if (!ok) return;
    try { await deleteProperty(property._id, token); notify.success(t('propertyForm.deleted')); await mutate(); }
    catch (err: unknown) { notify.error(getApiErrorMessage(err, t('propertyForm.deleteFailed'))); }
  };
  const isFarm = propertyType === 'farm';
  const Icon = isFarm ? Wheat : Trees;

  return (
    <div className="dashboard-page space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="page-header flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Icon className="h-4 w-4" /> {isFarm ? 'Farm management' : 'Land management'}
          </div>
          <h2 className="page-header-title">{t(titleKey)}</h2>
          <p className="page-header-subtitle">{t(subtitleKey)}</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex w-full items-center justify-center gap-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-auto">
          <Plus className="h-4 w-4" /> {t(addKey)}
        </button>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.05 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800"><Building2 className="h-5 w-5" /></div>
            <div><h3 className="font-semibold text-slate-900">Filter by layout name</h3><p className="mt-0.5 text-sm text-slate-500">Choose a layout to see {isFarm ? 'farms' : 'lands'} linked to it. Properties marked Not linked must be linked using Add/Edit before they appear under a specific layout.</p></div>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select className="form-input w-full appearance-none pl-10 pr-10 transition focus:ring-2 focus:ring-emerald-100" value={layoutFilter} onChange={(e) => { setLayoutFilter(e.target.value); setPage(1); }} aria-label="Filter by layout name">
              <option value="">All layouts</option>
              {layoutOptions.map((layout) => <option key={layout._id} value={layout._id}>{layout.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">{filtered.length}</span> {isFarm ? 'farms' : 'lands'} found</p>
          {layoutFilter && <button type="button" onClick={() => { setLayoutFilter(''); setPage(1); }} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800">Clear filter</button>}
        </div>
      </motion.section>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">{t('propertyForm.loadFailed')} <button type="button" onClick={() => mutate()} className="ml-2 font-semibold underline">{t('common.retry')}</button></div> : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2"><div className="h-24 animate-pulse rounded-2xl bg-slate-100"/><div className="h-24 animate-pulse rounded-2xl bg-slate-100"/></div>
      ) : rows.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon className="h-6 w-6" /></div>
          <p className="font-semibold text-slate-800">{t(emptyKey)}</p><p className="mt-1 text-sm text-slate-500">Try another layout filter or add a new {isFarm ? 'farm' : 'land'}.</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2"><Plus className="h-4 w-4" />{t(addKey)}</button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={`${propertyType}-${layoutFilter}-${page}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3.5">{t('propertyForm.name')}</th><th className="px-4 py-3.5">{t('propertyForm.number')}</th><th className="px-4 py-3.5">Linked layout</th><th className="px-4 py-3.5">{t('propertyForm.area')}</th><th className="px-4 py-3.5">{t('propertyForm.price')}</th><th className="px-4 py-3.5">{t('propertyForm.status')}</th><th className="px-4 py-3.5 text-right">{t('common.actions')}</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{rows.map((property, index) => {
                const linkedId = getLinkedLayoutId(property.linkedLayoutId);
                const linkedLayout = layoutOptions.find((layout) => layout._id === linkedId);
                return <motion.tr key={property._id} initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.18) }} className="transition-colors hover:bg-emerald-50/40">
                  <td className="px-4 py-4"><div className="font-semibold text-slate-900">{property.name}</div><div className="mt-0.5 text-xs text-slate-500">{property.village || property.address || 'Location not provided'}</div></td>
                  <td className="px-4 py-4 text-slate-600">{property.propertyNumber || '—'}</td><td className="px-4 py-4">{linkedLayout ? <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"><Building2 className="h-3.5 w-3.5 shrink-0"/>{linkedLayout.name}</span> : <span className="text-slate-400">Not linked</span>}</td>
                  <td className="px-4 py-4 text-slate-600">{property.area ? formatPropertyArea(property.area) : '—'}</td><td className="px-4 py-4 text-slate-600">{formatPropertyPrice(property.price, t('common.onRequest'))}</td><td className="px-4 py-4"><StatusBadge status={property.status} /></td>
                  <td className="px-4 py-4"><div className="flex justify-end gap-1">{canManage(property) && <><button type="button" onClick={() => openEdit(property)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800" title={t('common.edit')}><Pencil className="h-4 w-4"/></button><button type="button" onClick={() => handleDelete(property)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600" title={t('common.delete')}><Trash2 className="h-4 w-4"/></button></>}</div></td>
                </motion.tr>;
              })}</tbody>
            </table></div>
            {pageCount > 1 && <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Page {page} of {pageCount}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
          </motion.div>
        </AnimatePresence>
      )}

      {token && <PropertyFormModal open={showForm} propertyType={propertyType} editingProperty={editing} token={token} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => mutate()} />}
    </div>
  );
}
