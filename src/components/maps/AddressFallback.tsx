import { getDirectionsUrl, getMapEmbedUrl, getMapSearchUrl, isUsableMapAddress } from '@/lib/googleMaps';

interface AddressFallbackProps {
  address: string;
  layoutName?: string;
}

export default function AddressFallback({ address, layoutName }: AddressFallbackProps) {
  const canEmbed = isUsableMapAddress(address);
  const embedUrl = canEmbed ? getMapEmbedUrl(undefined, undefined, address) : null;
  const mapsUrl = getMapSearchUrl(undefined, undefined, address, layoutName);
  const directionsUrl = getDirectionsUrl(undefined, undefined, address);

  return (
    <div className="space-y-3">
      {embedUrl ? (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <iframe
            title={`Map of ${layoutName || address}`}
            src={embedUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center">
          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-600">Map preview unavailable</p>
          <p className="mt-1 text-xs text-gray-500">
            Add a real address and latitude/longitude in admin to show the location.
          </p>
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <p className="text-sm font-medium text-gray-700">{address || 'No address set'}</p>
        {!canEmbed && (
          <p className="mt-2 text-sm text-amber-700">
            This layout needs a proper address (e.g. &quot;Hinjewadi, Pune&quot;) and map coordinates.
          </p>
        )}
        {mapsUrl && canEmbed && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4 inline-flex text-sm"
          >
            Open in Google Maps
          </a>
        )}
        {canEmbed && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary ml-0 mt-3 inline-flex text-sm sm:ml-3 sm:mt-4"
          >
            Get Directions
          </a>
        )}
      </div>
    </div>
  );
}
