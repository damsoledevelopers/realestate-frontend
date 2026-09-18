'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { LayoutAdminDetail, Plot } from '@/lib/types';
import StatusBadge from '@/components/property/StatusBadge';
import ConstructionStatusField from '@/components/plots/ConstructionStatusField';
import type { ConstructionStatus } from '@/lib/constructionStatusConfig';
import {
  createPlot,
  updatePlotConstructionStatus,
  updatePlotSaleStatus,
} from '@/lib/plots';
import { notify } from '@/lib/notify';
import { formatPropertyType } from '@/lib/properties';
import PropertyQrPanel from '@/components/qr/PropertyQrPanel';
import SitePhotosPanel from '@/components/sitePhotos/SitePhotosPanel';
import ExternalLinksPanel from '@/components/externalLinks/ExternalLinksPanel';
import type { QrEntityType } from '@/lib/qrCodes';
import type { SitePhotoEntityType } from '@/lib/sitePhotos';
import type { ExternalLinkEntityType } from '@/lib/externalLinks';
import PropertyPriceCell from '@/components/pricing/PropertyPriceCell';
import PlotCertificatesPanel from '@/components/documents/PlotCertificatesPanel';
import { useLocale } from '@/context/LocaleContext';

interface LayoutPropertiesPanelProps {
  layout: LayoutAdminDetail;
  onUpdated: () => void;
}

const emptyPlot = {
  plotNumber: '',
  size: '',
  price: '',
  lat: '',
  lng: '',
  facing: 'North' as const,
  constructionStatus: 'empty_plot' as ConstructionStatus,
  description: '',
  sellerName: '',
  sellerPhone: '',
  coordinates: { x: 10, y: 10 },
};

function getLayoutDefaultCoords(layout: LayoutAdminDetail) {
  const lat = layout.latitude ?? layout.coordinates?.lat;
  const lng = layout.longitude ?? layout.coordinates?.lng;
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return { lat: '', lng: '' };
  }
  return { lat: String(lat), lng: String(lng) };
}

export default function LayoutPropertiesPanel({ layout, onUpdated }: LayoutPropertiesPanelProps) {
  const { token } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const [showPlotForm, setShowPlotForm] = useState(false);
  const [plotForm, setPlotForm] = useState(emptyPlot);
  const [plotQrFile, setPlotQrFile] = useState<File | null>(null);
  const [updatingConstructionPlotId, setUpdatingConstructionPlotId] = useState<string | null>(null);
  const [sitePhotoTarget, setSitePhotoTarget] = useState<{
    entityType: SitePhotoEntityType;
    entityId: string;
    label: string;
  } | null>(null);
  const [externalLinkTarget, setExternalLinkTarget] = useState<{
    entityType: ExternalLinkEntityType;
    entityId: string;
    label: string;
  } | null>(null);
  const [certificateTarget, setCertificateTarget] = useState<{
    plotId: string;
    label: string;
  } | null>(null);
  const canManage = layout.canManagePlots !== false;
  const canManagePhotos = layout.canManageSitePhotos !== false;
  const canManageExternalLinks = layout.canManageExternalLinks !== false && canManage;
  const canManagePricing = layout.canManagePricing !== false && canManage;

  const savePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canManage) return;
    try {
      const payload: Record<string, unknown> = {
        ...plotForm,
        layoutId: layout._id,
        price: plotForm.price.trim() === '' ? null : Number(plotForm.price),
      };

      if (plotForm.lat.trim() && plotForm.lng.trim()) {
        payload.latitude = Number(plotForm.lat);
        payload.longitude = Number(plotForm.lng);
      }

      delete payload.lat;
      delete payload.lng;

      await createPlot(payload as Record<string, unknown> & { layoutId: string }, token, plotQrFile);
      notify.success('Plot added');
      setShowPlotForm(false);
      setPlotForm(emptyPlot);
      setPlotQrFile(null);
      onUpdated();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to add plot');
    }
  };

  const updatePlotStatus = async (plot: Plot, status: string) => {
    if (!token || !canManage) return;
    const needsConfirm = status === 'sold' || plot.status === 'sold';
    if (needsConfirm) {
      const confirmed = await confirm({
        title: 'Update plot status',
        message: 'Confirm sale status change?',
        confirmLabel: 'Confirm',
      });
      if (!confirmed) return;
    }
    try {
      await updatePlotSaleStatus(plot._id, status, token, { confirmSold: needsConfirm || undefined });
      notify.success('Plot status updated');
      onUpdated();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to update status');
    }
  };

  const updateConstruction = async (plotId: string, constructionStatus: ConstructionStatus) => {
    if (!token || !canManage) return;
    setUpdatingConstructionPlotId(plotId);
    try {
      await updatePlotConstructionStatus(plotId, constructionStatus, token);
      notify.success('Construction status updated');
      onUpdated();
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to update construction status');
    } finally {
      setUpdatingConstructionPlotId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Plots & linked properties</h3>
          {layout.importedPlots?.length ? (
            <p className="mt-1 text-xs text-gray-500">
              {layout.importedPlots.length} plot boundaries found in the layout file (map only). They are not
              listed for sale until you click Add Plot and register each one. Sale counts use registered plots
              only.
            </p>
          ) : null}
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              const defaults = getLayoutDefaultCoords(layout);
              setPlotForm({ ...emptyPlot, ...defaults });
              setShowPlotForm(true);
            }}
            className="btn-primary text-sm"
          >
            Add Plot
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table-data">
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">Plot #</th>
                <th className="px-3 py-3">Size</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Sale Status</th>
                <th className="px-3 py-3">Construction</th>
                {canManage && <th className="px-3 py-3">QR</th>}
                {canManage && <th className="px-3 py-3">{t('plotCertificates.tab')}</th>}
                {canManageExternalLinks && <th className="px-3 py-3">{t('externalLinks.tab')}</th>}
                {canManagePhotos && <th className="px-3 py-3">{t('sitePhotos.tab')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(layout.plots || []).map((plot) => (
                <tr key={plot._id}>
                  <td className="px-3 py-3 font-medium">{plot.plotNumber}</td>
                  <td className="px-3 py-3">{plot.size}</td>
                  <td className="px-3 py-3">
                    <PropertyPriceCell
                      entityType="plot"
                      entityId={plot._id}
                      entityLabel={`Plot ${plot.plotNumber}`}
                      price={plot.price}
                      canManage={canManagePricing}
                      onUpdated={onUpdated}
                      compact
                    />
                  </td>
                  <td className="px-3 py-3">
                    {canManage ? (
                      <select
                        value={plot.status}
                        onChange={(e) => updatePlotStatus(plot, e.target.value)}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="sold">Sold</option>
                        <option value="reserved">Reserved</option>
                      </select>
                    ) : (
                      <StatusBadge status={plot.status} />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <ConstructionStatusField
                      value={plot.constructionStatus}
                      onChange={(value) => updateConstruction(plot._id, value)}
                      canEdit={canManage}
                      loading={updatingConstructionPlotId === plot._id}
                    />
                  </td>
                  {canManage && (
                    <td className="px-3 py-3">
                      <PropertyQrPanel
                        entityType="plot"
                        entityId={plot._id}
                        entityLabel={`Plot ${plot.plotNumber}`}
                        canManage={canManage}
                        compact
                      />
                    </td>
                  )}
                  {canManage && (
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setCertificateTarget({
                            plotId: plot._id,
                            label: `Plot ${plot.plotNumber}`,
                          })
                        }
                        className="text-xs font-medium text-primary-600 hover:underline"
                      >
                        {t('plotCertificates.manage')}
                      </button>
                    </td>
                  )}
                  {canManageExternalLinks && (
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExternalLinkTarget({
                            entityType: 'plot',
                            entityId: plot._id,
                            label: `Plot ${plot.plotNumber}`,
                          })
                        }
                        className="text-xs font-medium text-primary-600 hover:underline"
                      >
                        {t('externalLinks.manage')}
                      </button>
                    </td>
                  )}
                  {canManagePhotos && (
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSitePhotoTarget({
                            entityType: 'plot',
                            entityId: plot._id,
                            label: `Plot ${plot.plotNumber}`,
                          })
                        }
                        className="text-xs font-medium text-primary-600 hover:underline"
                      >
                        {t('sitePhotos.manage')}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!layout.plots?.length && <p className="py-8 text-center text-sm text-gray-400">No plots yet</p>}
      </div>

      {layout.linkedProperties?.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-900">Linked properties</h4>
          <div className="mt-4 table-wrap">
            <table className="table-data">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Number</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Status</th>
                  {canManage && <th className="px-3 py-3">QR</th>}
                  {canManageExternalLinks && <th className="px-3 py-3">{t('externalLinks.tab')}</th>}
                  {canManagePhotos && <th className="px-3 py-3">{t('sitePhotos.tab')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {layout.linkedProperties.map((property) => (
                  <tr key={property._id}>
                    <td className="px-3 py-3 font-medium">{property.name}</td>
                    <td className="px-3 py-3">{formatPropertyType(property.propertyType)}</td>
                    <td className="px-3 py-3">{property.propertyNumber}</td>
                    <td className="px-3 py-3">
                      <PropertyPriceCell
                        entityType={property.propertyType}
                        entityId={property._id}
                        entityLabel={property.name}
                        price={property.price}
                        canManage={canManagePricing}
                        onUpdated={onUpdated}
                        compact
                      />
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={property.status} /></td>
                    {canManage && (
                      <td className="px-3 py-3">
                        <PropertyQrPanel
                          entityType={property.propertyType as QrEntityType}
                          entityId={property._id}
                          entityLabel={property.name}
                          canManage={canManage}
                          compact
                        />
                      </td>
                    )}
                    {canManageExternalLinks && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExternalLinkTarget({
                              entityType: property.propertyType as ExternalLinkEntityType,
                              entityId: property._id,
                              label: property.name,
                            })
                          }
                          className="text-xs font-medium text-primary-600 hover:underline"
                        >
                          {t('externalLinks.manage')}
                        </button>
                      </td>
                    )}
                    {canManagePhotos && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSitePhotoTarget({
                              entityType: property.propertyType as SitePhotoEntityType,
                              entityId: property._id,
                              label: property.name,
                            })
                          }
                          className="text-xs font-medium text-primary-600 hover:underline"
                        >
                          {t('sitePhotos.manage')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPlotForm && (
        <div className="modal-overlay">
          <form onSubmit={savePlot} className="modal-panel-md">
            <h2 className="text-lg font-semibold">Add Plot for Sale</h2>
            <div className="mt-4 space-y-3">
              <input className="input-field" placeholder="Plot number (must match imported plot #)" value={plotForm.plotNumber} onChange={(e) => setPlotForm({ ...plotForm, plotNumber: e.target.value })} required />
              <input className="input-field" placeholder="Land owner name (internal note)" value={plotForm.sellerName} onChange={(e) => setPlotForm({ ...plotForm, sellerName: e.target.value })} />
              <input className="input-field" placeholder="Land owner phone (internal note)" value={plotForm.sellerPhone} onChange={(e) => setPlotForm({ ...plotForm, sellerPhone: e.target.value })} />
              <input className="input-field" placeholder="Size" value={plotForm.size} onChange={(e) => setPlotForm({ ...plotForm, size: e.target.value })} required />
              <input className="input-field" type="number" placeholder="Price (optional)" value={plotForm.price} onChange={(e) => setPlotForm({ ...plotForm, price: e.target.value })} />
              <div className="form-grid">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{t('layoutForm.latitude')}</label>
                  <input
                    className="input-field"
                    type="number"
                    step="any"
                    placeholder={t('plotForm.latPlaceholder')}
                    value={plotForm.lat}
                    onChange={(e) => setPlotForm({ ...plotForm, lat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{t('layoutForm.longitude')}</label>
                  <input
                    className="input-field"
                    type="number"
                    step="any"
                    placeholder={t('plotForm.lngPlaceholder')}
                    value={plotForm.lng}
                    onChange={(e) => setPlotForm({ ...plotForm, lng: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">{t('plotForm.coordsHint')}</p>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('plotForm.qrImage')}</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="input-field"
                  onChange={(e) => setPlotQrFile(e.target.files?.[0] || null)}
                />
                <p className="mt-1 text-xs text-gray-500">{t('plotForm.qrImageHint')}</p>
              </div>
            </div>
            <div className="btn-stack mt-4">
              <button type="button" onClick={() => setShowPlotForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Add Plot</button>
            </div>
          </form>
        </div>
      )}

      {externalLinkTarget && (
        <ExternalLinksPanel
          entityType={externalLinkTarget.entityType}
          entityId={externalLinkTarget.entityId}
          entityLabel={externalLinkTarget.label}
          canManage={canManageExternalLinks}
          compact
          onClose={() => setExternalLinkTarget(null)}
        />
      )}

      {sitePhotoTarget && (
        <SitePhotosPanel
          entityType={sitePhotoTarget.entityType}
          entityId={sitePhotoTarget.entityId}
          entityLabel={sitePhotoTarget.label}
          canManage={canManagePhotos}
          compact
          onClose={() => setSitePhotoTarget(null)}
        />
      )}

      {certificateTarget && (
        <PlotCertificatesPanel
          layoutId={layout._id}
          plotId={certificateTarget.plotId}
          plotLabel={certificateTarget.label}
          canManage={canManage}
          onClose={() => setCertificateTarget(null)}
        />
      )}
    </div>
  );
}
