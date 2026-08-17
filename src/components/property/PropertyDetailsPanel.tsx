'use client';

import { ReactNode } from 'react';
import PropertyGisDetails, {
  formatPropertyTypeLocalized,
} from '@/components/property/PropertyGisDetails';
import PropertyContact from '@/components/property/PropertyContact';
import StatusBadge from '@/components/property/StatusBadge';
import ConstructionStatusBadge from '@/components/plots/ConstructionStatusBadge';
import ViewOnGoogleMapsButton from '@/components/property/ViewOnGoogleMapsButton';
import ShareLocationButton from '@/components/property/ShareLocationButton';
import ExternalLinksPublicSection from '@/components/externalLinks/ExternalLinksPublicSection';
import { mapPropertyToGisDetails } from '@/lib/propertyDetails';
import { resolveContactTarget } from '@/lib/propertyContacts';
import { useLocale } from '@/context/LocaleContext';
import { MapProperty } from '@/lib/types';

interface PropertyDetailsPanelProps {
  property: MapProperty;
  onClose: () => void;
  footer?: ReactNode;
}

export default function PropertyDetailsPanel({ property, onClose, footer }: PropertyDetailsPanelProps) {
  const { t } = useLocale();
  const details = mapPropertyToGisDetails(property);
  const contactTarget = resolveContactTarget(property);

  return (
    <div className="modal-overlay z-[60]" onClick={onClose}>
      <div
        className="modal-panel-md max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-details-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              {formatPropertyTypeLocalized(property.propertyType, t)}
            </p>
            <h2 id="property-details-title" className="mt-1 text-lg font-bold text-gray-900">
              {property.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close property details"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={property.status} size="md" />
          <ConstructionStatusBadge status={property.constructionStatus} size="md" showPattern />
        </div>

        <div className="mt-5">
          <PropertyGisDetails property={details} />
        </div>

        <div className="mt-6">
          <PropertyContact
            entityType={contactTarget.entityType}
            entityId={contactTarget.entityId}
            propertyName={property.name}
            compact
          />
        </div>

        <div className="mt-6">
          <ExternalLinksPublicSection
            entityType={contactTarget.entityType}
            entityId={contactTarget.entityId}
            className="!border-0 !bg-transparent !p-0 !shadow-none"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <ViewOnGoogleMapsButton latitude={property.latitude} longitude={property.longitude} />
          <ShareLocationButton
            latitude={property.latitude}
            longitude={property.longitude}
            title={property.name}
          />
          {footer}
        </div>
      </div>
    </div>
  );
}
