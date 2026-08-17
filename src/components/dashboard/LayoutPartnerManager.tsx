'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { LayoutPartner, LayoutPartnersResponse } from '@/lib/types';
import { notify } from '@/lib/notify';
import { formatRoleLabel } from '@/lib/roles';

interface AddPartnerResponse {
  _id: string;
  accountCreated?: boolean;
  accountPromoted?: boolean;
  loginUrl?: string;
}

interface LayoutPartnerManagerProps {
  layoutId: string;
  layoutName: string;
  isOwner: boolean;
  variant?: 'embedded' | 'page';
}

export default function LayoutPartnerManager({
  layoutId,
  layoutName,
  isOwner,
  variant = 'embedded',
}: LayoutPartnerManagerProps) {
  const { token } = useAuth();
  const [partners, setPartners] = useState<LayoutPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchPartners = useCallback(() => {
    if (!token || !layoutId) return;
    setLoading(true);
    api
      .get<LayoutPartnersResponse>(`/layouts/${layoutId}/partners`, token)
      .then((data) => setPartners(data.partners))
      .catch(() => notify.error('Failed to load partners'))
      .finally(() => setLoading(false));
  }, [token, layoutId]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
  };

  const addPartner = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !email.trim()) return;
    setAdding(true);
    try {
      const payload: { email: string; name?: string; password?: string } = {
        email: email.trim(),
      };
      if (name.trim()) payload.name = name.trim();
      if (password) payload.password = password;

      const result = await api.post<AddPartnerResponse>(
        `/layouts/${layoutId}/partners`,
        payload,
        token
      );

      if (result.accountCreated) {
        notify.success(
          'Partner account created. Share the email and password so they can sign in at /login.'
        );
      } else if (result.accountPromoted) {
        notify.success('Partner added. They can sign in with their existing credentials.');
      } else {
        notify.success('Partner added. They can sign in with their existing credentials.');
      }

      resetForm();
      fetchPartners();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to add partner');
    } finally {
      setAdding(false);
    }
  };

  const removePartner = async (partnerId: string) => {
    if (!token) return;
    setRemovingId(partnerId);
    try {
      await api.delete(`/layouts/${layoutId}/partners/${partnerId}`, token);
      notify.success('Partner removed');
      fetchPartners();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to remove partner');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div
      className={
        variant === 'page'
          ? ''
          : 'mt-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className={`font-semibold text-gray-900 ${variant === 'page' ? 'text-base' : 'text-sm'}`}>
            Layout Partners
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Partners can sign in at{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              /login
            </Link>{' '}
            and manage plots in &ldquo;{layoutName}&rdquo;
          </p>
        </div>
        {!isOwner && (
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
            Partner access
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-gray-400">Loading partners...</p>
      ) : partners.length === 0 ? (
        <p className="mt-3 text-xs text-gray-400">No partners assigned yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {partners.map((partner) => (
            <li
              key={partner._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{partner.user.name}</p>
                <p className="truncate text-xs text-gray-500">{partner.user.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-gray-400">{formatRoleLabel(partner.user.role)}</span>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removePartner(partner._id)}
                    disabled={removingId === partner._id}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    {removingId === partner._id ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <form onSubmit={addPartner} className="mt-4 space-y-3">
          <p className="text-xs text-gray-500">
            For a new partner, enter their name and a temporary password. They will use these
            credentials to sign in. Existing users only need their email.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Partner name (required for new accounts)"
              className="input-field text-sm"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Partner email address"
              className="input-field text-sm"
              required
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Temporary password (required for new accounts)"
              className="input-field flex-1 text-sm"
              minLength={6}
              autoComplete="new-password"
            />
            <button type="submit" disabled={adding} className="btn-primary shrink-0 text-sm">
              {adding ? 'Adding...' : 'Add Partner'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
