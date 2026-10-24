'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';

type PartnerRequestItem = {
  _id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  requestedBy?: { name?: string; phone?: string; email?: string } | string;
  reviewedBy?: { name?: string } | string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

type FilterStatus = 'pending' | 'approved' | 'rejected';

export default function PartnerRequestsPage() {
  const { token, user } = useAuth();
  const [status, setStatus] = useState<FilterStatus>('pending');
  const [requests, setRequests] = useState<PartnerRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    if (!token || user?.role !== 'super_admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get<PartnerRequestItem[]>(`/partner-requests?status=${status}`, token)
      .then(setRequests)
      .catch((err: unknown) => notify.error((err as { message?: string })?.message || 'Failed to load partner requests.'))
      .finally(() => setLoading(false));
  }, [token, user?.role, status]);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== 'super_admin') {
    return <div className="dashboard-page"><div className="card"><h2 className="font-semibold">Super Admin access required</h2></div></div>;
  }

  const review = async (requestId: string, action: 'approve' | 'reject') => {
    if (!token) return;
    const confirmMessage = action === 'approve'
      ? 'Verify this partner and activate their account?'
      : 'Reject this partner verification request?';
    if (!window.confirm(confirmMessage)) return;

    setWorkingId(requestId);
    try {
      await api.patch(`/partner-requests/${requestId}/review`, {
        action,
        reviewNote: notes[requestId] || '',
      }, token);
      notify.success(action === 'approve' ? 'Partner verified and account activated.' : 'Partner request rejected.');
      load();
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message || 'Could not review partner request.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="dashboard-page min-w-0">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">Partner Verification</h2>
          <p className="page-header-subtitle">Review partner accounts submitted by Users. Only approved partners can sign in.</p>
        </div>
        <button type="button" onClick={load} className="btn-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected'] as FilterStatus[]).map((item) => (
          <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${status === item ? 'bg-primary-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-sm text-gray-500">Loading partner requests…</div>
      ) : requests.length === 0 ? (
        <div className="card text-sm text-gray-500">No {status} partner requests found.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const requester = typeof request.requestedBy === 'object' ? request.requestedBy?.name : '';
            return (
              <article key={request._id} className="card min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{request.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">Mobile: {request.phone}</p>
                    {requester && <p className="mt-1 text-xs text-gray-500">Requested by: {requester}</p>}
                    <p className="mt-1 text-xs text-gray-400">Submitted: {new Date(request.createdAt).toLocaleString()}</p>
                    {request.reviewNote && <p className="mt-2 text-sm text-gray-600">Review note: {request.reviewNote}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${request.status === 'pending' ? 'bg-amber-50 text-amber-700' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{request.status}</span>
                </div>
                {status === 'pending' && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <label htmlFor={`review-note-${request._id}`} className="mb-1 block text-sm font-medium text-gray-700">Review note (optional)</label>
                    <textarea id={`review-note-${request._id}`} rows={2} maxLength={500} value={notes[request._id] || ''} onChange={(e) => setNotes((current) => ({ ...current, [request._id]: e.target.value }))} className="input-field" placeholder="Add a note for the decision" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={workingId === request._id} onClick={() => review(request._id, 'approve')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" /> {workingId === request._id ? 'Processing…' : 'Verify & Approve'}</button>
                      <button type="button" disabled={workingId === request._id} onClick={() => review(request._id, 'reject')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><X className="h-4 w-4" /> Reject</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
