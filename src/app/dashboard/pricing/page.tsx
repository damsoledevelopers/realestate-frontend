'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchPricingEntities } from '@/lib/propertyPricing';
import { formatPropertyType } from '@/lib/properties';
import type { PricingEntityType } from '@/lib/types';
import PropertyPriceCell from '@/components/pricing/PropertyPriceCell';
import { IndianRupee, Search } from 'lucide-react';

const ENTITY_TYPE_OPTIONS: Array<{ value: '' | PricingEntityType; labelKey: string }> = [
  { value: '', labelKey: 'pricing.filterAll' },
  { value: 'layout', labelKey: 'property.type.layout' },
  { value: 'plot', labelKey: 'property.type.plot' },
  { value: 'farm', labelKey: 'property.type.farm' },
  { value: 'land', labelKey: 'property.type.land' },
  { value: 'row_house', labelKey: 'property.type.row_house' },
  { value: 'bungalow', labelKey: 'property.type.bungalow' },
];

function PropertyPricingPageContent() {
  const { token } = useAuth();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [entityType, setEntityType] = useState<'' | PricingEntityType>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const param = searchParams.get('entityType');
    if (
      param &&
      ENTITY_TYPE_OPTIONS.some((option) => option.value === param)
    ) {
      setEntityType(param as PricingEntityType);
      setPage(1);
    }
  }, [searchParams]);

  const queryKey = useMemo(
    () => ['property-pricing', page, debouncedSearch, entityType, token],
    [page, debouncedSearch, entityType, token]
  );

  const { data, error, isLoading, mutate } = useSWR(
    token ? queryKey : null,
    () =>
      fetchPricingEntities(token!, {
        page,
        limit: 25,
        search: debouncedSearch || undefined,
        entityType: entityType || undefined,
      }),
    { revalidateOnFocus: false }
  );

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <h2 className="page-header-title">{t('pricing.pageTitle')}</h2>
            <p className="page-header-subtitle">{t('pricing.pageSubtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            className="input-field pl-9"
            placeholder={t('pricing.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input-field sm:max-w-[200px]"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value as '' | PricingEntityType);
            setPage(1);
          }}
        >
          {ENTITY_TYPE_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="card mt-6">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-400">{t('common.loading')}</p>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-red-500">{t('pricing.loadFailed')}</p>
            <button type="button" onClick={() => mutate()} className="btn-primary mt-4">
              {t('common.retry')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">{t('pricing.emptyList')}</p>
        ) : (
          <div className="table-wrap">
            <table className="table-data">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('pricing.colProperty')}</th>
                  <th className="px-4 py-3">{t('pricing.colType')}</th>
                  <th className="px-4 py-3">{t('pricing.colLayout')}</th>
                  <th className="px-4 py-3">{t('property.price')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={`${item.entityType}-${item.entityId}`}>
                    <td className="px-4 py-3 font-medium">{item.entityName}</td>
                    <td className="px-4 py-3">{formatPropertyType(item.entityType)}</td>
                    <td className="px-4 py-3 text-gray-600">{item.layoutName || '—'}</td>
                    <td className="px-4 py-3">
                      <PropertyPriceCell
                        entityType={item.entityType}
                        entityId={item.entityId}
                        entityLabel={item.entityName}
                        price={item.price}
                        canManage
                        onUpdated={() => mutate()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-500">
            <span>
              {t('pricing.pageInfo', {
                page: String(pagination.page),
                pages: String(pagination.pages),
                total: String(pagination.total),
              })}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-xs disabled:opacity-50"
              >
                {t('common.previous')}
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary text-xs disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyPricingPage() {
  const { t } = useLocale();

  return (
    <Suspense
      fallback={
        <div className="dashboard-page">
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        </div>
      }
    >
      <PropertyPricingPageContent />
    </Suspense>
  );
}
