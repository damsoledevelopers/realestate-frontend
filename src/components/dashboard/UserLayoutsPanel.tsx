'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { api } from '@/lib/api';
import { TransferOwnershipResponse, User, UserLayoutsResponse } from '@/lib/types';
import { notify } from '@/lib/notify';
import { useLocale } from '@/context/LocaleContext';

interface UserLayoutsPanelProps {
  userId: string;
  onRefresh?: () => void;
}

export default function UserLayoutsPanel({ userId, onRefresh }: UserLayoutsPanelProps) {
  const { token } = useAuth();
  const confirm = useConfirm();
  const { t } = useLocale();
  const [data, setData] = useState<UserLayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferLayoutId, setTransferLayoutId] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [removingPartnerId, setRemovingPartnerId] = useState<string | null>(null);

  const fetchLayouts = useCallback(() => {
    if (!token || !userId) return;
    setLoading(true);
    api
      .get<UserLayoutsResponse>(`/users/${userId}/layouts`, token)
      .then(setData)
      .catch(() => notify.error(t('dashboard.users.layoutsLoadFailed')))
      .finally(() => setLoading(false));
  }, [token, userId, t]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  useEffect(() => {
    if (!token || !data?.owned.length) return;
    setLoadingCandidates(true);
    api
      .get<{ users: User[] }>('/users/transfer-candidates', token)
      .then((res) => setUsers(res.users))
      .catch(() => {})
      .finally(() => setLoadingCandidates(false));
  }, [token, data?.owned.length]);

  const transferOwnership = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !transferLayoutId || !newOwnerId) return;

    const layout = data?.owned.find((l) => l.id === transferLayoutId);
    const newOwner = users.find((u) => u._id === newOwnerId);
    if (!layout || !newOwner) return;

    if (
      !(await confirm({
        title: t('dashboard.users.transferTitle'),
        message: t('dashboard.users.transferConfirm', {
          layout: layout.name,
          owner: newOwner.name,
        }),
        confirmLabel: t('dashboard.users.transferAction'),
      }))
    ) {
      return;
    }

    setTransferring(true);
    try {
      await api.patch<TransferOwnershipResponse>(
        `/admin/layouts/${transferLayoutId}/owner`,
        { ownerId: newOwnerId },
        token
      );
      notify.success(t('dashboard.users.transferSuccess'));
      setTransferLayoutId('');
      setNewOwnerId('');
      fetchLayouts();
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || t('dashboard.users.transferFailed'));
    } finally {
      setTransferring(false);
    }
  };

  const removePartner = async (layoutId: string, partnerId: string, layoutName: string) => {
    if (!token) return;
    if (
      !(await confirm({
        title: t('dashboard.users.removePartnerTitle'),
        message: t('dashboard.users.removePartnerConfirm', { layout: layoutName }),
        confirmLabel: t('common.delete'),
        variant: 'danger',
      }))
    ) {
      return;
    }

    setRemovingPartnerId(partnerId);
    try {
      await api.delete(`/layouts/${layoutId}/partners/${partnerId}`, token);
      notify.success(t('dashboard.users.removePartnerSuccess'));
      fetchLayouts();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || t('dashboard.users.removePartnerFailed'));
    } finally {
      setRemovingPartnerId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400">{t('common.loading')}</p>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold">{t('dashboard.users.ownedLayouts')}</h4>
        {data.owned.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">{t('dashboard.users.noOwnedLayouts')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.owned.map((layout) => (
              <li
                key={layout.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <div>
                  <Link
                    href={`/dashboard/layouts/${layout.id}`}
                    className="font-medium text-primary-700 hover:underline"
                  >
                    {layout.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {layout.location} · {layout.plotCount} plots
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  {t('dashboard.users.ownerBadge')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="font-semibold">{t('dashboard.users.partnerLayouts')}</h4>
        {data.partner.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">{t('dashboard.users.noPartnerLayouts')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.partner.map((layout) => (
              <li
                key={layout.partnerId || layout.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <div>
                  <Link
                    href={`/dashboard/layouts/${layout.id}`}
                    className="font-medium text-primary-700 hover:underline"
                  >
                    {layout.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {layout.location} · {layout.plotCount} plots
                  </p>
                </div>
                {layout.partnerId && (
                  <button
                    type="button"
                    onClick={() => removePartner(layout.id, layout.partnerId!, layout.name)}
                    disabled={removingPartnerId === layout.partnerId}
                    className="text-xs text-red-600 hover:underline"
                  >
                    {t('dashboard.users.removePartner')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.owned.length > 0 && (
        <form onSubmit={transferOwnership} className="rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold">{t('dashboard.users.transferOwnership')}</h4>
          <p className="mt-1 text-sm text-gray-500">{t('dashboard.users.transferHint')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={transferLayoutId}
              onChange={(e) => setTransferLayoutId(e.target.value)}
              className="input-field w-full"
              required
            >
              <option value="">{t('dashboard.users.selectLayout')}</option>
              {data.owned.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="input-field w-full"
              required
              disabled={loadingCandidates}
            >
              <option value="">
                {loadingCandidates ? t('common.loading') : t('dashboard.users.selectNewOwner')}
              </option>
              {users
                .filter((u) => u._id !== userId)
                .map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
            </select>
          </div>
          <button type="submit" className="btn-primary mt-4" disabled={transferring}>
            {transferring ? t('common.saving') : t('dashboard.users.transferAction')}
          </button>
        </form>
      )}
    </div>
  );
}
