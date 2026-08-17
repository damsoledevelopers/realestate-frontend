'use client';

import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import LayoutPartnerManager from '@/components/dashboard/LayoutPartnerManager';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';
import { useManagedLayoutList } from '@/hooks/useManagedLayoutList';

export default function DashboardPartnersPage() {
  const { locale, t } = useLocale();
  const { data: layouts = [], error, isLoading } = useManagedLayoutList();
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const fetchError = error ? getApiErrorMessage(error, t('dashboard.partners.loadFailed')) : null;
  const loading = isLoading;

  useEffect(() => {
    if (!layouts.length) return;
    setSelectedLayoutId((current) => {
      if (current && layouts.some((layout) => layout._id === current)) return current;
      const firstOwned = layouts.find((layout) => layout.isOwner);
      return firstOwned?._id ?? layouts[0]?._id ?? null;
    });
  }, [layouts]);

  const ownedLayouts = useMemo(() => layouts.filter((layout) => layout.isOwner), [layouts]);
  const selectedLayout = layouts.find((layout) => layout._id === selectedLayoutId) ?? null;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.partners.title')}</h2>
          <p className="page-header-subtitle">{t('dashboard.partners.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p className="text-sm text-gray-400">{t('dashboard.partners.loadingLayouts')}</p>
        </div>
      ) : fetchError ? (
        <div className="card py-8 text-center">
          <p className="text-sm text-red-600">{fetchError}</p>
        </div>
      ) : layouts.length === 0 ? (
        <div className="card">
          <p className="text-sm text-gray-500">{t('dashboard.partners.noLayouts')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('dashboard.partners.createLayoutHint')}</p>
        </div>
      ) : ownedLayouts.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="card">
            <h3 className="font-semibold">{t('dashboard.partners.yourLayouts')}</h3>
            <div className="mt-4 space-y-2">
              {layouts.map((layout) => (
                <button
                  key={layout._id}
                  type="button"
                  onClick={() => setSelectedLayoutId(layout._id)}
                  className={`list-row w-full text-left ${
                    selectedLayoutId === layout._id ? 'border-primary-500 bg-primary-50' : ''
                  }`}
                >
                  <p className="font-medium">{getLayoutDisplayName(layout, locale)}</p>
                  <p className="text-xs text-gray-500">
                    {getLocalizedLocation(layout.location, locale, layout.locationMr)}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                    {t('dashboard.partners.partnerBadge')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            {selectedLayout ? (
              <LayoutPartnerManager
                layoutId={selectedLayout._id}
                layoutName={selectedLayout ? getLayoutDisplayName(selectedLayout, locale) : ''}
                isOwner={false}
                variant="page"
              />
            ) : (
              <p className="text-sm text-gray-400">{t('dashboard.partners.selectToView')}</p>
            )}
            <p className="mt-4 text-xs text-gray-400">{t('dashboard.partners.ownerOnlyHint')}</p>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="card">
            <h3 className="font-semibold">{t('dashboard.partners.yourLayouts')}</h3>
            <p className="mt-1 text-xs text-gray-500">{t('dashboard.partners.manageHint')}</p>
            <div className="mt-4 space-y-2">
              {ownedLayouts.map((layout) => (
                <button
                  key={layout._id}
                  type="button"
                  onClick={() => setSelectedLayoutId(layout._id)}
                  className={`list-row w-full text-left ${
                    selectedLayoutId === layout._id ? 'border-primary-500 bg-primary-50' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{getLayoutDisplayName(layout, locale)}</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      {t('dashboard.partners.ownerBadge')}
                    </span>
                    {(layout.partnerCount ?? 0) > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {t('dashboard.partners.partnerCount', {
                          count: String(layout.partnerCount),
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{layout.location}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            {selectedLayout ? (
              <LayoutPartnerManager
                layoutId={selectedLayout._id}
                layoutName={selectedLayout ? getLayoutDisplayName(selectedLayout, locale) : ''}
                isOwner={Boolean(selectedLayout.isOwner)}
                variant="page"
              />
            ) : (
              <p className="text-sm text-gray-400">{t('dashboard.partners.selectToManage')}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
