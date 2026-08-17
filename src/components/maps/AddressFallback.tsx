import Link from 'next/link';
import {
  getDirectionsUrl,
  getMapEmbedUrl,
  getMapSearchUrl,
  isUsableMapAddress,
} from '@/lib/googleMaps';

interface AddressFallbackProps {
  address: string;
  layoutName?: string;
  inquiryHref?: string;
}

export default function AddressFallback({
  address,
  layoutName,
  inquiryHref = '#layout-inquiry',
}: AddressFallbackProps) {
  const displayName = layoutName || 'This property';
  const canEmbed = isUsableMapAddress(address);
  const embedUrl = canEmbed ? getMapEmbedUrl(undefined, undefined, address) : null;
  const mapsUrl = getMapSearchUrl(undefined, undefined, address, layoutName);
  const directionsUrl = getDirectionsUrl(undefined, undefined, address);
  const hasAddress = Boolean(address?.trim());

  return (
    <div className="space-y-4">
      {embedUrl ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
          <iframe
            title={`Map of ${layoutName || address}`}
            src={embedUrl}
            width="100%"
            height="360"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <LocationPreviewCard layoutName={displayName} location={address} />
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <PinIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Location</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {hasAddress ? address : 'Location details on request'}
            </p>
            {hasAddress && !canEmbed && (
              <p className="mt-1 text-sm text-gray-500">
                Prime plotted development in a growing neighbourhood.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {mapsUrl && canEmbed && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <MapIcon />
              Open in Google Maps
            </a>
          )}
          {canEmbed && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary-100 hover:bg-primary-50"
            >
              Get Directions
            </a>
          )}
          <Link
            href={inquiryHref}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-100"
          >
            Request Site Visit
          </Link>
        </div>
      </div>
    </div>
  );
}

function LocationPreviewCard({
  layoutName,
  location,
}: {
  layoutName: string;
  location: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-6 text-white shadow-premium">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative flex min-h-[280px] flex-col items-center justify-center text-center sm:min-h-[320px]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <PinIcon className="h-8 w-8 text-accent" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-200">
          Project Location
        </p>
        <h3 className="mt-2 text-xl font-bold sm:text-2xl">{layoutName}</h3>
        {location?.trim() ? (
          <p className="mt-2 max-w-sm text-sm text-white/75">{location}</p>
        ) : (
          <p className="mt-2 max-w-sm text-sm text-white/75">
            Schedule a site visit to explore the exact location and surroundings.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            Prime Area
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            Easy Connectivity
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            Growing Zone
          </span>
        </div>
      </div>
    </div>
  );
}

function PinIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

function MapIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  );
}
