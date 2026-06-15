'use client';

import { Plot } from '@/lib/types';
import { PLOT_STATUS } from '@/constants/css';
import { getMapSearchUrl } from '@/lib/googleMaps';

interface PlotPopupProps {
  plot: Plot;
  onClose: () => void;
  onBookNow?: (plot: Plot) => void;
  onViewMap?: (plot: Plot) => void;
  layoutName?: string;
  layoutLocation?: string;
  layoutCoordinates?: { lat?: number; lng?: number };
}

export default function PlotPopup({
  plot,
  onClose,
  onBookNow,
  onViewMap,
  layoutName,
  layoutLocation,
  layoutCoordinates,
}: PlotPopupProps) {
  const mapsUrl = getMapSearchUrl(
    layoutCoordinates?.lat,
    layoutCoordinates?.lng,
    layoutLocation,
    layoutName ? `Plot ${plot.plotNumber} - ${layoutName}` : `Plot ${plot.plotNumber}`
  );

  const handleViewMap = () => {
    onClose();
    onViewMap?.(plot);
    if (mapsUrl) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Plot {plot.plotNumber}</h3>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PLOT_STATUS[plot.status].badge}`}
            >
              {plot.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Size</dt>
            <dd className="font-medium">{plot.size}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Price</dt>
            <dd className="font-medium">₹{plot.price.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Facing</dt>
            <dd className="font-medium">{plot.facing || '—'}</dd>
          </div>
        </dl>

        {plot.description && (
          <p className="mt-3 text-sm text-gray-600">{plot.description}</p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {onViewMap && (
            <button
              type="button"
              onClick={handleViewMap}
              className="btn-secondary flex w-full items-center justify-center gap-2"
              title={mapsUrl ? 'Open location in Google Maps' : 'Scroll to location section'}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              View on Map
            </button>
          )}
          {!mapsUrl && onViewMap && (
            <p className="text-center text-xs text-amber-600">
              Map coordinates not set for this layout. Ask admin to add latitude & longitude.
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Close
            </button>
            {plot.status === 'available' && onBookNow && (
              <button
                type="button"
                onClick={() => onBookNow(plot)}
                className="btn-primary flex-1"
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
