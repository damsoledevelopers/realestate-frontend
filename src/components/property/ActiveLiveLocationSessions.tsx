'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';

type Session = {
  id: string; token: string; adminId: string; inquiryId: string | null;
  assetType: string; assetId: string; recipientName: string; layoutName: string;
  plotNumber: string; durationHours: number; expiresAt: string; active: boolean;
};

export default function ActiveLiveLocationSessions({ token }: { token: string | null }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try { setSessions(await api.get<Session[]>('/inquiries/live-location-sessions/active', token)); }
    catch (err) { setError(getApiErrorMessage(err, 'Could not load active sharing sessions.')); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const stop = async (session: Session) => {
    if (!token || !window.confirm(`Stop live location sharing for ${session.layoutName || session.assetType}?`)) return;
    setBusy(session.token);
    try { await api.post(`/inquiries/live-location/${session.token}/stop`, {}, token); notify.success('Live location sharing stopped.'); await load(); }
    catch (err) { notify.error(getApiErrorMessage(err, 'Could not stop sharing.')); }
    finally { setBusy(null); }
  };
  return <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold text-gray-900">Active Live Location Sharing</h3><p className="text-sm text-gray-600">Super Admin can stop any active session before expiry.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="btn-secondary text-sm">{loading ? 'Refreshing…' : 'Refresh sessions'}</button></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {!loading && !error && sessions.length === 0 && <p className="mt-3 text-sm text-gray-600">No active live-location sessions.</p>}
    {sessions.length > 0 && <div className="mt-3 space-y-2">{sessions.map((s) => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-100 bg-white p-3"><div className="min-w-0"><p className="font-medium text-gray-900">{s.layoutName || `${s.assetType} ${s.assetId}`}</p><p className="text-xs text-gray-600">{s.assetType} · {s.durationHours} hour(s) · Expires {new Date(s.expiresAt).toLocaleString()}</p></div><button type="button" disabled={busy === s.token} onClick={() => void stop(s)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy === s.token ? 'Stopping…' : 'Stop sharing'}</button></div>)}</div>}
  </section>;
}
