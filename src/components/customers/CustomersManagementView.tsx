'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  BUYER_CATEGORY_LABELS,
  CUSTOMER_STATUS_LABELS,
  fetchCustomers,
  KYC_STATUS_LABELS,
} from '@/lib/customers';
import type { BuyerCategory, CustomerKycStatus, CustomerRecord, CustomerStatus } from '@/lib/types';
import Pagination from '@/components/ui/Pagination';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import CustomerDetailPanel from '@/components/customers/CustomerDetailPanel';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useManagedLayoutList } from '@/hooks/useManagedLayoutList';

export default function CustomersManagementView() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { t } = useLocale();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [layoutId, setLayoutId] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('active');
  const [buyerCategory, setBuyerCategory] = useState<BuyerCategory | ''>('');
  const [kycStatus, setKycStatus] = useState<CustomerKycStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  const { data: layouts = [] } = useManagedLayoutList();

  const loadCustomers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchCustomers(token, {
      page,
      limit: 20,
      search: debouncedSearch,
      layoutId: layoutId || undefined,
      status: status || undefined,
      buyerCategory: buyerCategory || undefined,
      kycStatus: kycStatus || undefined,
    })
      .then((data) => {
        setCustomers(data.customers);
        setPagination(data.pagination);
      })
      .catch((err: unknown) => notify.error(getApiErrorMessage(err, t('customers.loadFailed'))))
      .finally(() => setLoading(false));
  }, [token, page, debouncedSearch, layoutId, status, buyerCategory, kycStatus, t]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.users.buyersTitle')}</h2>
          <p className="page-header-subtitle">{t('dashboard.users.buyersSubtitle')}</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="btn-primary">
          {t('customers.addCustomer')}
        </button>
      </div>

      <div className="card mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">{t('customers.search')}</label>
          <input
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customers.searchPlaceholder')}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{t('customers.layout')}</label>
          <select className="input-field" value={layoutId} onChange={(e) => { setLayoutId(e.target.value); setPage(1); }}>
            <option value="">{t('customers.allLayouts')}</option>
            {layouts.map((layout) => (
              <option key={layout._id} value={layout._id}>{layout.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{t('customers.buyerCategory')}</label>
          <select className="input-field" value={buyerCategory} onChange={(e) => { setBuyerCategory(e.target.value as BuyerCategory | ''); setPage(1); }}>
            <option value="">{t('customers.allCategories')}</option>
            {Object.entries(BUYER_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{t('customers.status')}</label>
          <select className="input-field" value={status} onChange={(e) => { setStatus(e.target.value as CustomerStatus | ''); setPage(1); }}>
            <option value="">{t('customers.allStatuses')}</option>
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">{t('common.loading')}</p>
        ) : customers.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">{t('customers.emptyList')}</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-data">
                <thead className="border-b text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">{t('customers.name')}</th>
                    <th className="px-3 py-3">{t('customers.buyerCategory')}</th>
                    <th className="px-3 py-3">{t('customers.contact')}</th>
                    <th className="px-3 py-3">{t('customers.layout')}</th>
                    <th className="px-3 py-3">{t('customers.kycStatus')}</th>
                    <th className="px-3 py-3">{t('customers.status')}</th>
                    <th className="px-3 py-3">{t('customers.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="px-3 py-3 font-medium">{customer.name}</td>
                      <td className="px-3 py-3 text-sm">{BUYER_CATEGORY_LABELS[customer.buyerCategory]}</td>
                      <td className="px-3 py-3 text-sm">
                        <p>{customer.phone}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">{customer.layout?.name || '—'}</td>
                      <td className="px-3 py-3 text-sm">{KYC_STATUS_LABELS[customer.kycStatus]}</td>
                      <td className="px-3 py-3 text-sm">{CUSTOMER_STATUS_LABELS[customer.status]}</td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => setActiveCustomerId(customer._id)} className="text-sm font-medium text-primary-600 hover:underline">
                          {t('customers.view')}
                        </button>
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

      {showCreate && (
        <CustomerFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            loadCustomers();
          }}
        />
      )}

      {activeCustomerId && (
        <CustomerDetailPanel
          customerId={activeCustomerId}
          onClose={() => setActiveCustomerId(null)}
          onUpdated={loadCustomers}
        />
      )}
    </div>
  );
}
