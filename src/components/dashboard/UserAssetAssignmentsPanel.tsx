'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/lib/notify';

type AssetType = 'layout' | 'farm' | 'plot' | 'land';
type AssetOption = { id: string; assetType: AssetType; label: string };
type Assignment = { id?: string; assetType: AssetType; assetId: string };
type Response = { assignments: Assignment[]; assets: AssetOption[] };

const TYPES: { value: AssetType; label: string }[] = [
  { value: 'layout', label: 'Layouts' },
  { value: 'farm', label: 'Farms' },
  { value: 'plot', label: 'Individual plots' },
  { value: 'land', label: 'Lands' },
];

export default function UserAssetAssignmentsPanel({ userId }: { userId: string }) {
  const { token } = useAuth();
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get<Response>(`/users/${userId}/assignments`, token);
      setAssets(data.assets || []);
      setSelected(new Set((data.assignments || []).map(a => `${a.assetType}:${a.assetId}`)));
    } catch (e) {
      notify.error((e as { message?: string }).message || 'Failed to load asset assignments');
    } finally { setLoading(false); }
  }, [token, userId]);

  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => TYPES.map(type => ({ ...type, assets: assets.filter(a => a.assetType === type.value) })), [assets]);
  const toggle = (key: string) => setSelected(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const assignments = Array.from(selected).map(key => {
        const split = key.indexOf(':');
        return { assetType: key.slice(0, split) as AssetType, assetId: key.slice(split + 1) };
      });
      await api.put(`/users/${userId}/assignments`, { assignments }, token);
      notify.success('Asset assignments saved');
      await load();
    } catch (e) { notify.error((e as { message?: string }).message || 'Failed to save assignments'); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading asset assignments…</p>;
  return <div className="space-y-4 rounded-xl border border-gray-200 p-4">
    <div><h4 className="font-semibold">Assigned assets</h4><p className="mt-1 text-xs text-gray-500">Select one or more assets. The same asset can be assigned to multiple users.</p></div>
    {grouped.map(group => <section key={group.value} className="space-y-2">
      <h5 className="text-sm font-semibold text-gray-700">{group.label} ({group.assets.length})</h5>
      {group.assets.length === 0 ? <p className="text-xs text-gray-400">No {group.label.toLowerCase()} available.</p> : <div className="grid max-h-40 gap-2 overflow-auto rounded-lg bg-gray-50 p-2 sm:grid-cols-2">
        {group.assets.map(asset => { const key = `${asset.assetType}:${asset.id}`; return <label key={key} className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm hover:bg-white"><input type="checkbox" className="mt-1" checked={selected.has(key)} onChange={() => toggle(key)} /><span>{asset.label}</span></label>; })}
      </div>}
    </section>)}
    <div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-500">{selected.size} asset(s) selected</span><button type="button" className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save assignments'}</button></div>
  </div>;
}
