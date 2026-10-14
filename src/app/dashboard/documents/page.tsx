'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, SlidersHorizontal } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { getApiErrorMessage } from '@/lib/api';
import DocumentManager from '@/components/documents/DocumentManager';
import { useManagedLayoutList } from '@/hooks/useManagedLayoutList';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { fetchProperties } from '@/lib/propertyApi';
import { Property } from '@/lib/types';

// API relations may be ObjectId strings or populated objects. Normalize both so
// every file is grouped and filtered under the correct layout.
function normalizeRelationId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as { _id?: unknown; id?: unknown };
    if (typeof record._id === 'string') return record._id;
    if (typeof record.id === 'string') return record.id;
  }
  return '';
}

export default function DashboardDocumentsPage() {
  const { t } = useLocale();
  const { token } = useAuth();
  const { data: layouts = [], error, isLoading } = useManagedLayoutList();
  const { data: landResponse } = useSWR(token ? ['documents-lands', token] : null, () => fetchProperties({ propertyType: 'land', limit: 500 }, token));
  const { data: farmResponse } = useSWR(token ? ['documents-farms', token] : null, () => fetchProperties({ propertyType: 'farm', limit: 500 }, token));
  const [layoutFilter, setLayoutFilter] = useState('');

  const attachedDocuments = useMemo(() => {
    const layoutDocs = layouts.flatMap((layout) => {
      const docs = [...(layout.documents || []), ...(layout.attachments || [])].map((doc) => ({ ...doc, layoutName: layout.name, layoutId: layout._id, visible: doc.visible !== false, fileType: (doc.mimeType || (String(doc.name || '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'link')).toLowerCase().includes('pdf') ? 'PDF' : 'Document' }));
      const images = [...(layout.images || []), ...(layout.imageUrl ? [layout.imageUrl] : [])].filter(Boolean).map((url, index) => ({ name: `Layout image ${index + 1}`, url, layoutName: layout.name, layoutId: layout._id, visible: !(layout.hiddenImages || []).includes(url), fileType: 'Image' }));
      return [...docs, ...images];
    });
    const layoutNameById = new Map(layouts.map((layout) => [normalizeRelationId(layout._id), layout.name]));
    const propertyDocs = ([...(landResponse?.properties || []), ...(farmResponse?.properties || [])] as (Property & { documents?: any[]; attachments?: any[]; images?: string[]; imageUrl?: string; hiddenImages?: string[]; layoutId?: unknown; linkedLayout?: unknown })[]).flatMap((property) => {
      const linkedLayoutId = normalizeRelationId(property.linkedLayoutId) || normalizeRelationId(property.layoutId) || normalizeRelationId(property.linkedLayout);
      // Do not incorrectly label a farm/land as a layout when it is not linked.
      const linkedLayoutName = layoutNameById.get(linkedLayoutId) || (linkedLayoutId ? 'Linked layout unavailable' : 'Not linked');
      const docs = [...(property.documents || []), ...(property.attachments || [])].map((doc) => ({ ...doc, name: doc.name || 'Document', url: doc.url || doc.fileUrl || '', layoutName: linkedLayoutName, layoutId: linkedLayoutId, visible: doc.visible !== false, fileType: (doc.mimeType || (String(doc.name || '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'link')).toLowerCase().includes('pdf') ? 'PDF' : 'Document' }));
      const images = [...(property.images || []), ...(property.imageUrl ? [property.imageUrl] : [])].filter(Boolean).map((url, index) => ({ name: `${property.propertyType === 'farm' ? 'Farm' : 'Land'} image ${index + 1}`, url, layoutName: linkedLayoutName, layoutId: linkedLayoutId, visible: !(property.hiddenImages || []).includes(url), fileType: 'Image' }));
      return [...docs, ...images];
    });
    return [...layoutDocs, ...propertyDocs]
      .filter((doc) => !layoutFilter || doc.layoutId === layoutFilter)
      .sort((a, b) => a.layoutName.localeCompare(b.layoutName) || a.name.localeCompare(b.name));
  }, [layouts, landResponse, farmResponse, layoutFilter]);
  const sortedLayouts = useMemo(() => [...layouts].sort((a, b) => a.name.localeCompare(b.name)), [layouts]);
  const fetchError = error ? getApiErrorMessage(error, t('dashboard.documents.loadFailed')) : null;

  return (
    <div className="dashboard-page space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div><h2 className="page-header-title">{t('dashboard.documents.title')}</h2><p className="page-header-subtitle">{t('dashboard.documents.subtitle')}</p></div>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] transition-shadow duration-300 hover:shadow-[0_18px_48px_-24px_rgba(15,23,42,0.4)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3"><motion.div whileHover={{ rotate: -4, scale: 1.04 }} transition={{ type: 'spring', stiffness: 300 }} className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 p-2.5 text-blue-700 shadow-sm"><FileText className="h-5 w-5" /></motion.div><div><h3 className="font-semibold text-slate-900">Filter documents by layout name</h3><p className="mt-0.5 text-sm text-slate-500">Select a layout to view its saved documents and images.</p></div></div>
          <div className="w-full sm:max-w-sm">
            <label htmlFor="documents-layout-filter" className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5" /> Layout Name</label>
            <select id="documents-layout-filter" className="form-input w-full rounded-xl border-slate-200 bg-white py-3 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={layoutFilter} onChange={(e) => setLayoutFilter(e.target.value)} aria-label="Filter documents by layout name"><option value="">All layouts</option>{sortedLayouts.map((layout) => <option key={layout._id} value={layout._id}>{layout.name}</option>)}</select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5"><p className="text-sm text-slate-600"><strong className="text-slate-900">{attachedDocuments.length}</strong> files and documents</p>{layoutFilter && <button type="button" onClick={() => setLayoutFilter('')} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50">Clear filter</button>}</div>
        {attachedDocuments.length ? <div className="max-w-full overflow-x-auto overscroll-x-contain"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Document</th><th className="px-4 py-3">Layout name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Visibility</th><th className="px-4 py-3">Open</th></tr></thead><tbody className="divide-y divide-slate-100">{attachedDocuments.map((doc, i) => <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.15) }} key={`${doc.layoutId}-${doc.url}-${i}`} className="transition-colors hover:bg-blue-50/40"><td className="max-w-[260px] break-words px-4 py-3 font-medium text-slate-900">{doc.name}</td><td className="max-w-[220px] break-words px-4 py-3 text-slate-600">{doc.layoutName}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{doc.fileType}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${doc.visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{doc.visible ? 'Visible' : 'Hidden'}</span></td><td className="px-4 py-3"><a className="font-medium text-blue-700 underline underline-offset-2" href={doc.url} target="_blank" rel="noreferrer">Open</a></td></motion.tr>)}</tbody></table></div> : <p className="px-4 pb-5 text-sm text-slate-500">No documents match this layout filter.</p>}
      </motion.section>

      {isLoading ? <div className="card"><p className="text-sm text-gray-400">{t('common.loading')}</p></div> : fetchError ? <div className="card"><p className="text-sm text-red-600">{fetchError}</p></div> : <DocumentManager layouts={layouts} layoutFilter={layoutFilter || null} />}
    </div>
  );
}
