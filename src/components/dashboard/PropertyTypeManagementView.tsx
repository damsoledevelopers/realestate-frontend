'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { deleteProperty, fetchProperties } from '@/lib/propertyApi';
import { formatPropertyArea, formatPropertyPrice } from '@/lib/properties';
import { getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Property, PropertyType } from '@/lib/types';
import StatusBadge from '@/components/property/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import PropertyFormModal from '@/components/dashboard/PropertyFormModal';
import { useConfirm } from '@/context/ConfirmContext';

interface PropertyTypeManagementViewProps {
  propertyType: Extract<PropertyType, 'farm' | 'land'>;
  titleKey: string;
  subtitleKey: string;
  addKey: string;
  emptyKey: string;
}

export default function PropertyTypeManagementView({
  propertyType,
  titleKey,
  subtitleKey,
  addKey,
  emptyKey,
}: PropertyTypeManagementViewProps) {
  const { token, user, isSuperAdmin } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    token ? ['properties', propertyType, token, page, debouncedSearch] : null,
    () =>
      fetchProperties(
        {
          propertyType,
          search: debouncedSearch || undefined,
          page,
          limit: 12,
        },
        token
      ),
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const properties = data?.properties ?? [];
  const pagination = data?.pagination;

  const canManage = (property: Property) => {
    if (isSuperAdmin) return true;
    const createdBy =
      typeof property.createdBy === 'string'
        ? property.createdBy
        : (property.createdBy as { _id?: string } | undefined)?._id;
    return Boolean(user?._id && createdBy && createdBy === user._id);
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (property: Property) => {
    setEditing(property);
    setShowForm(true);
  };

  const handleDelete = async (property: Property) => {
    if (!token) return;
    const ok = await confirm({
      title: t('propertyForm.deleteTitle'),
      message: t('propertyForm.deleteMessage', { name: property.name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteProperty(property._id, token);
      notify.success(t('propertyForm.deleted'));
      mutate();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('propertyForm.deleteFailed')));
    }
  };

  const rows = useMemo(() => properties, [properties]);

  return (
    <div className="dashboard-page space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t(titleKey)}</h2>
          <p className="page-header-subtitle">{t(subtitleKey)}</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary w-full sm:w-auto">
          <Plus className="mr-1 inline h-4 w-4" />
          {t(addKey)}
        </button>
      </div>

      <div className="card">
        <input
          className="input-field"
          placeholder={t('propertyForm.searchPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <div className="card py-12 text-center">
          <p className="text-red-500">{t('propertyForm.loadFailed')}</p>
          <button type="button" onClick={() => mutate()} className="btn-primary mt-4">
            {t('common.retry')}
          </button>
        </div>
      ) : isLoading ? (
        <div className="card animate-pulse space-y-3 py-8">
          <div className="h-4 w-1/3 rounded bg-gray-100" />
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-2/3 rounded bg-gray-100" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card py-12 text-center text-sm text-gray-500">{t(emptyKey)}</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">{t('propertyForm.name')}</th>
                  <th className="px-3 py-3">{t('propertyForm.number')}</th>
                  <th className="px-3 py-3">{t('propertyForm.area')}</th>
                  <th className="px-3 py-3">{t('propertyForm.price')}</th>
                  <th className="px-3 py-3">{t('propertyForm.status')}</th>
                  <th className="px-3 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((property) => (
                  <tr key={property._id}>
                    <td className="px-3 py-3 font-medium text-gray-900">{property.name}</td>
                    <td className="px-3 py-3 text-gray-600">{property.propertyNumber}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {property.area ? formatPropertyArea(property.area) : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {formatPropertyPrice(property.price, t('common.onRequest'))}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={property.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {canManage(property) && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(property)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                              title={t('common.edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(property)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.pages > 1 && (
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          )}
        </>
      )}

      {token && (
        <PropertyFormModal
          open={showForm}
          propertyType={propertyType}
          editingProperty={editing}
          token={token}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => mutate()}
        />
      )}
    </div>
  );
}
