'use client';

import { getGoogleMapsExternalUrl } from '@/lib/googleMaps';
import { formatPrice } from '@/lib/layoutStats';
import { Plot } from '@/lib/types';
import StatusBadge from '@/components/property/StatusBadge';
import ConstructionStatusBadge from '@/components/plots/ConstructionStatusBadge';
import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';

interface PlotPopupProps {
  plot: Plot;
  layoutName?: string;
  onClose: () => void;
  onBookNow?: (plot: Plot) => void;
}

export default function PlotPopup({
  plot,
  layoutName,
  onClose,
  onBookNow,
}: PlotPopupProps) {
  const { isBookable } = usePropertyStatusConfig();
  const latitude = plot.latitude ?? plot.mapCoordinates?.lat;
  const longitude = plot.longitude ?? plot.mapCoordinates?.lng;
  const googleMapsUrl = getGoogleMapsExternalUrl(latitude, longitude);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Plot {plot.plotNumber}</h3>
            {layoutName && <p className="mt-0.5 text-sm text-gray-500">{layoutName}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 pt-3">
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={plot.status} size="md" />
            <ConstructionStatusBadge status={plot.constructionStatus} size="md" />
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">{formatPrice(plot.price)}</p>

          <dl className="mt-4 space-y-2.5 text-sm">
            <DetailRow label="Area" value={plot.area?.display || plot.size} />
            {plot.facing && <DetailRow label="Facing" value={plot.facing} />}
          </dl>

          {plot.description && (
            <p className="mt-3 line-clamp-2 text-sm text-gray-600">{plot.description}</p>
          )}

          {isBookable(plot.status) && onBookNow && (
            <button
              type="button"
              onClick={() => onBookNow(plot)}
              className="btn-primary mt-5 w-full"
            >
              Book Now
            </button>
          )}

          {googleMapsUrl && (
            <div className="mt-4 text-center text-sm">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
              >
                Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
