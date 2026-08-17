'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { api } from '@/lib/api';
import { fetchLayoutAdminDetail } from '@/lib/layouts';
import { LayoutAdminDetail } from '@/lib/types';
import { notify } from '@/lib/notify';
import LayoutFormModal from '@/components/dashboard/LayoutFormModal';
import LayoutPartnerManager from '@/components/dashboard/LayoutPartnerManager';
import CompanyDocumentsPanel from '@/components/documents/CompanyDocumentsPanel';
import LayoutPropertiesPanel from '@/components/dashboard/LayoutPropertiesPanel';
import PropertyContactAssignPanel from '@/components/dashboard/PropertyContactAssignPanel';
import LayoutCustomersPanel from '@/components/dashboard/LayoutCustomersPanel';
import LayoutOverviewStatGrid from '@/components/dashboard/LayoutOverviewStatGrid';
import { getGoogleMapsExternalUrl } from '@/lib/googleMaps';
import PropertyQrPanel from '@/components/qr/PropertyQrPanel';
import SitePhotosPanel from '@/components/sitePhotos/SitePhotosPanel';
import ExternalLinksPanel from '@/components/externalLinks/ExternalLinksPanel';
import ShareLocationButton from '@/components/property/ShareLocationButton';
import PropertyPriceCell from '@/components/pricing/PropertyPriceCell';
import { formatPropertyPrice } from '@/lib/properties';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';
import { useLayoutRealtime } from '@/hooks/useLayoutRealtime';

type DetailTab = 'overview' | 'properties' | 'documents' | 'qr' | 'sitePhotos' | 'externalLinks' | 'partners' | 'customers' | 'contact';

export default function DashboardLayoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const confirm = useConfirm();
  const [tab, setTab] = useState<DetailTab>('overview');
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: layout, error, isLoading, mutate } = useSWR<LayoutAdminDetail>(
    token && id ? ['layout-admin-detail', id, token] : null,
    () => fetchLayoutAdminDetail(id, token!),
    { revalidateOnFocus: false }
  );

  const refreshOnRealtime = useCallback(() => {
    mutate();
  }, [mutate]);

  useLayoutRealtime({
    layoutId: id,
    enabled: Boolean(token && id),
    onPlotStatus: refreshOnRealtime,
  });

  if (isLoading) {
    return <div className="dashboard-page"><p className="text-sm text-gray-400">Loading layout...</p></div>;
  }

  if (error || !layout) {
    return (
      <div className="dashboard-page text-center">
        <p className="text-red-500">Layout not found or access denied.</p>
        <Link href="/dashboard/layouts" className="btn-primary mt-4 inline-flex">Back to layouts</Link>
      </div>
    );
  }

  const stats = layout.plotStats;
  const mapsUrl = getGoogleMapsExternalUrl(
    layout.latitude ?? layout.coordinates?.lat,
    layout.longitude ?? layout.coordinates?.lng
  );

  const displayName = getLayoutDisplayName(layout, locale);
  const displayLocation = getLocalizedLocation(layout.location, locale, layout.locationMr);

  const handleDelete = async () => {
    if (!token) return;
    const confirmed = await confirm({
      title: 'Delete layout',
      message: `Delete "${layout.name}" and all its plots?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/layouts/${layout._id}`, token);
      notify.success('Layout deleted');
      router.push('/dashboard/layouts');
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to delete layout');
    }
  };

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'properties', label: 'Properties' },
    ...(layout.canManageDocuments
      ? [{ key: 'documents' as const, label: t('companyDocuments.tab') }]
      : []),
    ...(layout.canManagePlots
      ? [{ key: 'qr' as const, label: t('qr.tab') }]
      : []),
    ...(layout.canManageSitePhotos
      ? [{ key: 'sitePhotos' as const, label: t('sitePhotos.tab') }]
      : []),
    ...(layout.canManageExternalLinks
      ? [{ key: 'externalLinks' as const, label: t('externalLinks.tab') }]
      : []),
    { key: 'partners', label: 'Partners' },
    { key: 'customers', label: 'Customers' },
    { key: 'contact', label: 'Contact' },
  ];

  return (
    <div className="dashboard-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/layouts" className="text-sm font-medium text-primary-600 hover:underline">
            ← Back to layouts
          </Link>
          <h2 className="page-header-title mt-2">{displayName}</h2>
          <p className="page-header-subtitle">{displayLocation}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {layout.isOwner && (
            <>
              <button type="button" onClick={() => setShowEditForm(true)} className="btn-secondary text-sm">
                Edit
              </button>
              <button type="button" onClick={handleDelete} className="btn-danger text-sm">
                Delete
              </button>
            </>
          )}
          <Link href={`/layouts/${layout._id}`} className="btn-secondary text-sm" target="_blank">
            Public view
          </Link>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
              Google Maps
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === item.key
                ? 'border-b-2 border-primary-600 text-primary-700'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <LayoutOverviewStatGrid stats={stats} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className="card flex h-full flex-col space-y-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Owner:</span> {layout.ownerName}</p>
              <p>
                <span className="font-medium text-gray-900">{t('property.price')}:</span>{' '}
                {layout.canManagePricing ? (
                  <PropertyPriceCell
                    entityType="layout"
                    entityId={layout._id}
                    entityLabel={displayName}
                    price={layout.price ?? layout.startingPrice ?? null}
                    canManage={layout.canManagePricing}
                    onUpdated={() => mutate()}
                    compact
                  />
                ) : (
                  formatPropertyPrice(layout.startingPrice ?? layout.price ?? null, t('common.onRequest'))
                )}
              </p>
              <p><span className="font-medium text-gray-900">Partners:</span> {layout.partnerCount ?? 0}</p>
              <p><span className="font-medium text-gray-900">{t('companyDocuments.overviewLabel')}:</span> {layout.documentsSummary?.fileCount ?? 0} {t('companyDocuments.overviewFiles')}</p>
              <p><span className="font-medium text-gray-900">Last updated:</span> {layout.updatedAt ? new Date(layout.updatedAt).toLocaleString() : '—'}</p>
              <p className="flex-1 text-gray-500">{layout.description || 'No description provided.'}</p>
              <div className="mt-auto pt-2">
                <ShareLocationButton
                  latitude={layout.latitude ?? layout.coordinates?.lat ?? 0}
                  longitude={layout.longitude ?? layout.coordinates?.lng ?? 0}
                  title={displayName}
                />
              </div>
            </div>
            {layout.canManagePlots && (
              <PropertyQrPanel
                entityType="layout"
                entityId={layout._id}
                entityLabel={displayName}
                canManage={layout.canManagePlots}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'qr' && layout.canManagePlots && (
        <div className="space-y-6">
          <PropertyQrPanel
            entityType="layout"
            entityId={layout._id}
            entityLabel={displayName}
            canManage={layout.canManagePlots}
          />
        </div>
      )}

      {tab === 'sitePhotos' && layout.canManageSitePhotos && (
        <SitePhotosPanel
          entityType="layout"
          entityId={layout._id}
          entityLabel={displayName}
          canManage={layout.canManageSitePhotos}
        />
      )}

      {tab === 'externalLinks' && layout.canManageExternalLinks && (
        <ExternalLinksPanel
          entityType="layout"
          entityId={layout._id}
          entityLabel={displayName}
          canManage={layout.canManageExternalLinks}
        />
      )}

      {tab === 'properties' && (
        <LayoutPropertiesPanel layout={layout} onUpdated={() => mutate()} />
      )}

      {tab === 'documents' && layout.canManageDocuments && (
        <CompanyDocumentsPanel
          layoutId={layout._id}
          layoutName={displayName}
          canManage={layout.canManageDocuments}
        />
      )}

      {tab === 'partners' && (
        <LayoutPartnerManager
          layoutId={layout._id}
          layoutName={displayName}
          isOwner={layout.isOwner ?? false}
          variant="embedded"
        />
      )}

      {tab === 'customers' && (
        <LayoutCustomersPanel
          customers={layout.customers}
          layoutId={layout._id}
          layoutName={displayName}
          latitude={layout.latitude ?? layout.coordinates?.lat}
          longitude={layout.longitude ?? layout.coordinates?.lng}
          canManagePayments={layout.canManagePayments}
          canManageEstimates={layout.canManageEstimates}
        />
      )}

      {tab === 'contact' && (
        <PropertyContactAssignPanel layout={layout} onUpdated={() => mutate()} />
      )}

      {token && (
        <LayoutFormModal
          open={showEditForm}
          editingLayoutId={layout._id}
          initialLayout={layout}
          token={token}
          onClose={() => setShowEditForm(false)}
          onSaved={() => {
            setShowEditForm(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}
