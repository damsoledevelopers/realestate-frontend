'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { api } from '@/lib/api';
import { Booking, User, UserDetailResponse, UserListResponse } from '@/lib/types';
import { notify } from '@/lib/notify';
import { USER_STATUS } from '@/constants/css';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/bookings/StatusBadge';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName } from '@/lib/localizedText';
import UserFormModal, { UserFormValues } from '@/components/dashboard/UserFormModal';
import UserLayoutsPanel from '@/components/dashboard/UserLayoutsPanel';

const SUPER_ADMIN_ELEVATION_CONFIRM = 'CREATE_SUPER_ADMIN';

function UserAvatar({ name }: { name?: string | null }) {
  const safe = name?.trim();
  const initials = safe
    ? safe
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
      {initials || '?'}
    </div>
  );
}

export default function UsersManagementView() {
  const { locale, t } = useLocale();
  const { token, user: currentUser } = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [selectedUser, setSelectedUser] = useState<UserDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formSaving, setFormSaving] = useState(false);

  const fetchUsers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);

    api
      .get<UserListResponse>(`/users?${params.toString()}`, token)
      .then((data) => {
        setUsers(data.users);
        setPagination(data.pagination);
      })
      .catch(() => notify.error(t('dashboard.users.loadFailed')))
      .finally(() => setLoading(false));
  }, [token, page, search, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

const SUPER_ADMIN_ELEVATION_CONFIRM = 'CREATE_SUPER_ADMIN';

  const updateRole = async (user: User, role: 'super_admin' | 'user' | 'customer') => {
    if (!token || user.role === role) return;
    const isElevation = role === 'super_admin' && user.role !== 'super_admin';
    if (
      !(await confirm({
        title: isElevation ? t('dashboard.users.elevateTitle') : 'Change role',
        message: isElevation
          ? t('dashboard.users.elevateMessage', { name: user.name })
          : `Change ${user.name}'s role to "${role}"?`,
        confirmLabel: isElevation ? t('dashboard.users.elevateConfirm') : 'Change role',
        variant: isElevation ? 'danger' : 'default',
      }))
    ) {
      return;
    }

    setActionLoading(user._id);
    try {
      const updated = await api.put<User>(
        `/users/${user._id}/role`,
        {
          role,
          ...(isElevation ? { confirmSuperAdminElevation: SUPER_ADMIN_ELEVATION_CONFIRM } : {}),
        },
        token
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, ...updated, role: updated.role } : u))
      );
      notify.success('Role updated');
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (user: User) => {
    if (!token) return;
    const nextActive = !user.isActive;
    const action = nextActive ? 'activate' : 'deactivate';
    if (
      !(await confirm({
        title: nextActive ? 'Activate user' : 'Deactivate user',
        message: `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`,
        confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
        variant: nextActive ? 'default' : 'danger',
      }))
    ) {
      return;
    }

    setActionLoading(user._id);
    try {
      const updated = await api.put<User>(
        `/users/${user._id}/status`,
        { isActive: nextActive },
        token
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id
            ? { ...u, isActive: updated.isActive, status: updated.isActive ? 'active' : 'inactive' }
            : u
        )
      );
      notify.success(`User ${nextActive ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const openUserDetail = async (userId: string) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const detail = await api.get<UserDetailResponse>(`/users/${userId}`, token);
      setSelectedUser(detail);
    } catch {
      notify.error('Failed to load user details');
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (!token) return;
    const confirmed = await confirm({
      title: 'Delete user',
      message: `Delete ${user.name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    setActionLoading(user._id);
    try {
      await api.delete(`/users/${user._id}`, token);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setSelectedUser(null);
      notify.success('User deleted');
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const isSelf = (userId: string) => currentUser?._id === userId;

  const openCreateForm = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  const openEditForm = () => {
    if (!selectedUser) return;
    setFormMode('edit');
    setFormOpen(true);
  };

  const submitUserForm = async (values: UserFormValues) => {
    if (!token) return;
    setFormSaving(true);
    try {
      if (formMode === 'create') {
        if (values.role === 'super_admin') {
          const confirmed = await confirm({
            title: t('dashboard.users.elevateTitle'),
            message: t('dashboard.users.elevateCreateMessage', { name: values.name }),
            confirmLabel: t('dashboard.users.elevateConfirm'),
            variant: 'danger',
          });
          if (!confirmed) {
            setFormSaving(false);
            return;
          }
        }

        const created = await api.post<User>(
          '/users',
          {
            name: values.name,
            email: values.email,
            password: values.password,
            phone: values.phone,
            role: values.role,
            isActive: values.isActive,
            ...(values.role === 'super_admin'
              ? { confirmSuperAdminElevation: SUPER_ADMIN_ELEVATION_CONFIRM }
              : {}),
          },
          token
        );
        setUsers((prev) => [created, ...prev]);
        notify.success(t('dashboard.users.createSuccess'));
        setFormOpen(false);
        fetchUsers();
      } else if (selectedUser) {
        const payload: Record<string, string> = {
          name: values.name,
          email: values.email,
          phone: values.phone,
        };
        if (values.password) payload.password = values.password;

        const updated = await api.put<User>(`/users/${selectedUser.user._id}`, payload, token);
        setUsers((prev) =>
          prev.map((u) => (u._id === selectedUser.user._id ? { ...u, ...updated } : u))
        );
        setSelectedUser((prev) =>
          prev ? { ...prev, user: { ...prev.user, ...updated } } : prev
        );
        notify.success(t('dashboard.users.updateSuccess'));
        setFormOpen(false);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || t('dashboard.users.saveFailed'));
    } finally {
      setFormSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.users.adminTitle')}</h2>
          <p className="page-header-subtitle">{t('dashboard.users.adminSubtitle')}</p>
        </div>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('dashboard.users.searchPlaceholder')}
          className="input-field w-full sm:max-w-xs"
        />
        <button type="button" onClick={openCreateForm} className="btn-primary w-full sm:w-auto">
          {t('dashboard.users.createUser')}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.users.emptyList')}</p>
        ) : (
          <>
            <div className="table-wrap">
            <table className="table-data">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('dashboard.users.colUser')}</th>
                  <th className="px-4 py-3">{t('dashboard.users.colRole')}</th>
                  <th className="px-4 py-3">{t('dashboard.users.colStatus')}</th>
                  <th className="px-4 py-3">{t('dashboard.users.colBookings')}</th>
                  <th className="px-4 py-3">{t('dashboard.users.colJoined')}</th>
                  <th className="px-4 py-3">{t('customers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user._id} className="bg-white">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openUserDetail(user._id)}
                        className="flex items-center gap-3 text-left hover:opacity-80"
                      >
                        <UserAvatar name={user.name} />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={isSelf(user._id) || actionLoading === user._id}
                        onChange={(e) =>
                          updateRole(user, e.target.value as 'super_admin' | 'user' | 'customer')
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs capitalize"
                      >
                        <option value="customer">{t('dashboard.users.role.customer')}</option>
                        <option value="user">{t('dashboard.users.role.user')}</option>
                        <option value="super_admin">{t('dashboard.users.role.superAdmin')}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.isActive ? USER_STATUS.active : USER_STATUS.inactive
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.totalBookings ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.joinedAt || user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={user.isActive}
                            disabled={isSelf(user._id) || actionLoading === user._id}
                            onChange={() => toggleStatus(user)}
                          />
                          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                        </label>
                        {!isSelf(user._id) && (
                          <button
                            type="button"
                            onClick={() => deleteUser(user)}
                            disabled={actionLoading === user._id}
                            className="text-xs text-red-600 hover:underline"
                          >
                            {t('common.delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          </>
        )}
      </div>

      {(selectedUser || detailLoading) && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-2xl">
            {detailLoading || !selectedUser ? (
              <p className="text-sm text-gray-400">{t('common.loading')}</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={selectedUser.user.name} />
                    <div>
                      <h3 className="text-lg font-semibold">{selectedUser.user.name}</h3>
                      <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openEditForm}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">{t('dashboard.users.colRole')}</dt>
                    <dd className="capitalize">{selectedUser.user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('dashboard.users.colStatus')}</dt>
                    <dd>{selectedUser.user.isActive ? 'Active' : 'Inactive'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('dashboard.users.colBookings')}</dt>
                    <dd>{selectedUser.user.totalBookings ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t('dashboard.users.colJoined')}</dt>
                    <dd>
                      {new Date(
                        selectedUser.user.joinedAt || selectedUser.user.createdAt
                      ).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <h4 className="font-semibold">{t('dashboard.users.layoutAccess')}</h4>
                  <div className="mt-3">
                    <UserLayoutsPanel userId={selectedUser.user._id} />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold">{t('customers.bookingHistory')}</h4>
                  {selectedUser.bookings.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-400">{t('customers.noBookings')}</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {selectedUser.bookings.map((booking: Booking) => (
                        <div
                          key={booking._id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              Plot {booking.plot?.plotNumber} —{' '}
                              {booking.layout ? getLayoutDisplayName(booking.layout, locale) : '—'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={booking.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <UserFormModal
        open={formOpen}
        mode={formMode}
        initialUser={formMode === 'edit' ? selectedUser?.user : null}
        saving={formSaving}
        onClose={() => setFormOpen(false)}
        onSubmit={submitUserForm}
      />
    </div>
  );
}
