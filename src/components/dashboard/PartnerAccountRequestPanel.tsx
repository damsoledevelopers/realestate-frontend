'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { INDIAN_PHONE_DIGITS, isValidIndianPhone, sanitizeIndianPhoneInput } from '@/lib/phone';

type PartnerRequestItem = {
  _id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string | null;
};

const statusClass: Record<PartnerRequestItem['status'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function PartnerAccountRequestPanel() {
  const { token, user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<PartnerRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = useCallback(() => {
    if (!token || user?.role !== 'user') {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get<PartnerRequestItem[]>('/partner-requests/mine', token)
      .then(setRequests)
      .catch((err: unknown) => notify.error((err as { message?: string })?.message || 'Could not load partner requests.'))
      .finally(() => setLoading(false));
  }, [token, user?.role]);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  if (user?.role !== 'user') return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!isValidIndianPhone(phone)) {
      notify.error('Enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      notify.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/partner-requests', { name: name.trim(), phone, password }, token);
      notify.success('Partner request sent to Super Admin for verification.');
      setName('');
      setPhone('');
      setPassword('');
      fetchMine();
    } catch (err: unknown) {
      notify.error((err as { message?: string })?.message || 'Could not submit partner request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Partner Account</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter the partner&apos;s name, mobile number and password. The account remains pending until Super Admin verifies it.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="partner-account-name" className="mb-1 block text-sm font-medium text-gray-700">Partner name</label>
          <input id="partner-account-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" className="input-field" placeholder="Enter full name" />
        </div>
        <div>
          <label htmlFor="partner-account-phone" className="mb-1 block text-sm font-medium text-gray-700">Mobile number</label>
          <input id="partner-account-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={INDIAN_PHONE_DIGITS} value={phone} onChange={(e) => setPhone(sanitizeIndianPhoneInput(e.target.value))} required className="input-field" placeholder="10-digit mobile number" />
        </div>
        <div>
          <label htmlFor="partner-account-password" className="mb-1 block text-sm font-medium text-gray-700">Create password</label>
          <input id="partner-account-password" type="password" autoComplete="new-password" minLength={6} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="Minimum 6 characters" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Sending request…' : 'Send for Verification'}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-800">Your partner requests</h4>
        {loading ? (
          <p className="mt-2 text-sm text-gray-400">Loading requests…</p>
        ) : requests.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">You haven&apos;t submitted any partner requests yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {requests.map((request) => (
              <div key={request._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{request.name}</p>
                  <p className="text-xs text-gray-500">{request.phone} · {new Date(request.createdAt).toLocaleDateString()}</p>
                  {request.reviewNote && <p className="mt-1 text-xs text-gray-500">Note: {request.reviewNote}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[request.status]}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
