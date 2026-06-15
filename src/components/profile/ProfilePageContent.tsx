'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface ProfilePageContentProps {
  inDashboard?: boolean;
  inUserDashboard?: boolean;
}

export default function ProfilePageContent({
  inDashboard = false,
  inUserDashboard = false,
}: ProfilePageContentProps) {
  const { user, token, isAdmin, updateProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const canEdit = (inDashboard && isAdmin) || (inUserDashboard && !isAdmin);
  const inShell = inDashboard || inUserDashboard;

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    const requests: [
      Promise<ProfileUser>,
      Promise<{ pagination: { total: number } }> | Promise<null>,
    ] = [
      api.get<ProfileUser>('/auth/me', token),
      isAdmin ? Promise.resolve(null) : api.get<{ pagination: { total: number } }>('/bookings/my?page=1&limit=1', token),
    ];

    Promise.all(requests)
      .then(([me, bookings]) => {
        setProfile(me);
        setBookingCount(bookings?.pagination?.total ?? 0);
        setForm((prev) => ({
          ...prev,
          name: me.name,
          email: me.email,
        }));
      })
      .catch(() => {
        if (user) {
          setProfile({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          });
          setForm((prev) => ({
            ...prev,
            name: user.name,
            email: user.email,
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [token, user, isAdmin]);

  const displayUser = profile ?? user;

  const resetForm = () => {
    if (!displayUser) return;
    setForm({
      name: displayUser.name,
      email: displayUser.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      notify.error('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        currentPassword: form.newPassword ? form.currentPassword : undefined,
        newPassword: form.newPassword || undefined,
        confirmPassword: form.newPassword ? form.confirmPassword : undefined,
      });
      setProfile({
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      });
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      notify.success('Profile updated successfully');
      setEditing(false);
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !displayUser) {
    return (
      <div className={inShell ? 'max-w-3xl' : 'mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-40 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!displayUser) return null;

  const initial = displayUser.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className={inShell ? 'max-w-3xl' : 'mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'}>
      {!inShell && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-500">View your account details and quick links</p>
        </div>
      )}

      <div className={`card ${inShell ? '' : 'mt-8'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
              {initial}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{displayUser.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{displayUser.email}</p>
              <span className="mt-2 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold capitalize text-primary-700">
                {displayUser.role}
              </span>
            </div>
          </div>
          {canEdit && !editing && (
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary text-sm">
              Edit Profile
            </button>
          )}
        </div>

        {canEdit && editing ? (
          <form onSubmit={handleSave} className="mt-8 space-y-5 border-t border-gray-100 pt-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">Change password</p>
              <p className="mt-1 text-xs text-gray-500">Leave blank to keep your current password</p>
              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  className="input-field"
                  placeholder="Current password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                />
                <input
                  type="password"
                  className="input-field"
                  placeholder="New password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                />
                <input
                  type="password"
                  className="input-field"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <dl className={`grid gap-4 ${isAdmin ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-gray-900">{displayUser.role}</dd>
              </div>
              {!isAdmin && (
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Bookings</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{bookingCount}</dd>
                </div>
              )}
            </dl>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleCancel} disabled={saving} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-8 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{displayUser.name}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{displayUser.email}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</dt>
              <dd className="mt-1 text-sm font-medium capitalize text-gray-900">{displayUser.role}</dd>
            </div>
            {!isAdmin && (
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Bookings</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{bookingCount}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {!isAdmin && !inShell && (
        <div className="card mt-6">
          <h3 className="font-semibold text-gray-900">Quick Links</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/user-dashboard/bookings" className="btn-secondary text-sm">
              My Bookings
            </Link>
            <Link href="/layouts" className="btn-secondary text-sm">
              Browse Layouts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
