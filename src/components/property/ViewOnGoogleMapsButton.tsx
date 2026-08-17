'use client';

import { getGoogleMapsExternalUrl, hasValidCoordinates } from '@/lib/googleMaps';
import { useLocale } from '@/context/LocaleContext';

interface ViewOnGoogleMapsButtonProps {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  className?: string;
  fullWidth?: boolean;
}

function buildGoogleMapsUrl(latitude?: number | null, longitude?: number | null): string | null {
  return getGoogleMapsExternalUrl(latitude, longitude);
}

export default function ViewOnGoogleMapsButton({
  latitude,
  longitude,
  label,
  className = '',
  fullWidth = true,
}: ViewOnGoogleMapsButtonProps) {
  const { t } = useLocale();
  const buttonLabel = label || t('property.viewOnMaps');
  const mapsUrl = buildGoogleMapsUrl(latitude, longitude);
  const hasCoords = hasValidCoordinates(latitude, longitude);

  if (!hasCoords || !mapsUrl) {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <button
          type="button"
          disabled
          className={`btn-secondary cursor-not-allowed opacity-60 ${fullWidth ? 'w-full' : ''} ${className}`}
          title={t('property.gpsUnavailable')}
        >
          {buttonLabel}
        </button>
        <p className="mt-2 text-center text-xs text-amber-700">{t('property.gpsHint')}</p>
      </div>
    );
  }

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-primary inline-flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <MapPinIcon />
      {buttonLabel}
    </a>
  );
}

function MapPinIcon() {
  return (
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
  );
}
