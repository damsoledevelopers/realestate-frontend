'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutAdminDetail,
  PropertyContactHistoryEntry,
  User,
} from '@/lib/types';
import {
  assignPropertyContact,
  fetchAssignableUsers,
  fetchContactHistory,
  removePropertyContact,
  updatePropertyContact,
} from '@/lib/propertyContacts';
import { notify } from '@/lib/notify';
import PropertyContact from '@/components/property/PropertyContact';

interface PropertyContactAssignPanelProps {
  layout: LayoutAdminDetail;
  onUpdated: () => void;
}

export default function PropertyContactAssignPanel({
  layout,
  onUpdated,
}: PropertyContactAssignPanelProps) {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [history, setHistory] = useState<PropertyContactHistoryEntry[]>(layout.contactHistory || []);
  const [loading, setLoading] = useState(false);

  const canManage = layout.canManageContact ?? layout.isOwner ?? user?.role === 'super_admin';

  const localCandidates = useMemo(() => {
    const map = new Map<string, User>();
    if (layout.ownerId) {
      map.set(layout.ownerId, {
        _id: layout.ownerId,
        name: layout.ownerName || 'Owner',
        email: layout.ownerEmail || '',
        phone: layout.ownerPhone || '',
        role: 'user',
        isActive: true,
        createdAt: '',
      });
    }
    for (const partner of layout.partners || []) {
      if (partner.user?._id) {
        map.set(partner.user._id, {
          _id: partner.user._id,
          name: partner.user.name,
          email: partner.user.email,
          role: partner.user.role,
          isActive: true,
          createdAt: '',
        });
      }
    }
    return Array.from(map.values());
  }, [layout]);

  useEffect(() => {
    if (!token || user?.role !== 'super_admin') return;
    fetchAssignableUsers(token)
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers(localCandidates));
  }, [token, user?.role, localCandidates]);

  useEffect(() => {
    setSelectedUserId(layout.contactAssignment?.assignedUserId || '');
  }, [layout.contactAssignment?.assignedUserId]);

  useEffect(() => {
    if (!token || !layout._id) return;
    fetchContactHistory('layout', layout._id, token)
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory(layout.contactHistory || []));
  }, [layout._id, layout.contactHistory, token]);

  const assignableUsers = user?.role === 'super_admin' && users.length ? users : localCandidates;

  const handleAssign = async () => {
    if (!token || !selectedUserId) return;
    setLoading(true);
    try {
      if (layout.contactAssignment?.assignedUserId) {
        await updatePropertyContact('layout', layout._id, { assignedUserId: selectedUserId }, token);
        notify.success('Contact assignment updated');
      } else {
        await assignPropertyContact(
          { entityType: 'layout', entityId: layout._id, assignedUserId: selectedUserId },
          token
        );
        notify.success('Contact user assigned');
      }
      onUpdated();
    } catch (err: unknown) {
      notify.error((err as { message?: string }).message || 'Failed to assign contact');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await removePropertyContact('layout', layout._id, token);
      notify.success('Contact assignment removed');
      setSelectedUserId('');
      onUpdated();
    } catch (err: unknown) {
      notify.error((err as { message?: string }).message || 'Failed to remove assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PropertyContact
        entityType="layout"
        entityId={layout._id}
        propertyName={layout.name}
        showExtendedActions
      />

      {canManage ? (
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Assign contact user</h3>
            <p className="mt-1 text-sm text-gray-500">
              Public property pages always display the layout owner&apos;s contact details. Use this
              section to record an assigned representative for internal tracking when needed.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="input-field flex-1"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select user</option>
              {assignableUsers.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} {item.email ? `(${item.email})` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedUserId || loading}
              className="btn-primary shrink-0"
            >
              {layout.contactAssignment ? 'Update assignment' : 'Assign user'}
            </button>
            {layout.contactAssignment ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="btn-danger shrink-0"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="card">
          <h3 className="font-semibold text-gray-900">Assignment history</h3>
          <ul className="mt-4 space-y-3">
            {history.map((entry) => (
              <li key={entry._id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium capitalize text-gray-800">{entry.action}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-gray-600">
                  {entry.assignedUserId && typeof entry.assignedUserId === 'object'
                    ? entry.assignedUserId.name
                    : entry.previousUserId && typeof entry.previousUserId === 'object'
                      ? entry.previousUserId.name
                      : '—'}
                </p>
                {entry.performedBy ? (
                  <p className="text-xs text-gray-400">By {entry.performedBy.name}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
