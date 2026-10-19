
import { getApiBaseUrl } from '@/lib/apiBase';

export const PUBLIC_LOCATION_STATE = 'Maharashtra';

/** Initial public-search rollout. Options are returned only when present in eligible database layouts. */
export const PUBLIC_LOCATION_DISTRICTS: readonly string[] = [
  'Dhule',
  'Jalgaon',
  'Nandurbar',
];

// Administrative directory used to populate choices even before a layout exists
// in that location. Layout search results themselves always come from MongoDB.
const INDIA_LOCATION_QUERY_URL =
  'https://livingatlas.esri.in/server/rest/services/IAB2024/Village_Demographics_2024/MapServer/0/query';

type DirectoryField = 'district' | 'subdistrict' | 'name';

function escapeSqlValue(value: string): string {
  return value.replace(/'/g, "''");
}

async function fetchAdministrativeOptions(
  level: 'district' | 'taluka' | 'village',
  filters: Array<{
    field: 'state' | 'district' | 'taluka';
    value: string;
  }>,
  signal?: AbortSignal
): Promise<string[]> {
  const field: DirectoryField =
    level === 'taluka'
      ? 'subdistrict'
      : level === 'village'
        ? 'name'
        : 'district';

  const where = filters
    .map(
      ({ field, value }) =>
        `${field === 'taluka' ? 'subdistrict' : field} = '${escapeSqlValue(value)}'`
    )
    .join(' AND ');

  const values = new Set<string>();
  let offset = 0;
  const pageSize = 2000;

  while (true) {
    const params = new URLSearchParams({
      where,
      outFields: field,
      returnDistinctValues: 'true',
      returnGeometry: 'false',
      orderByFields: field,
      resultRecordCount: String(pageSize),
      resultOffset: String(offset),
      f: 'json',
    });

    const response = await fetch(
      `${INDIA_LOCATION_QUERY_URL}?${params.toString()}`,
      { signal }
    );

    if (!response.ok) {
      throw new Error(
        `Administrative location request failed (${response.status})`
      );
    }

    const payload = (await response.json()) as {
      error?: { message?: string };
      features?: Array<{
        attributes?: Record<string, unknown>;
      }>;
    };

    if (payload.error) {
      throw new Error(
        payload.error.message || 'Administrative location request failed'
      );
    }

    const rows = payload.features || [];

    rows.forEach((row) => {
      const value = row.attributes?.[field];

      if (typeof value === 'string' && value.trim()) {
        values.add(value.trim());
      }
    });

    if (rows.length < pageSize || offset > 100000) {
      break;
    }

    offset += rows.length;
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

type LocationLevel =
  | 'district'
  | 'subdistrict'
  | 'name'
  | 'taluka'
  | 'village';

type FilterField = 'state' | 'district' | 'subdistrict' | 'taluka';

/**
 * Fetch public location options from the existing backend and MongoDB-backed layout records.
 * No external/dummy directory is used, so search filters stay in sync with saved public layouts.
 */
export async function fetchPublicLocationOptions(
  level: LocationLevel,
  filters: Array<{
    field: FilterField;
    value: string;
  }> = [],
  signal?: AbortSignal
): Promise<string[]> {
  const normalizedLevel =
    level === 'subdistrict' || level === 'taluka'
      ? 'taluka'
      : level === 'name' || level === 'village'
        ? 'village'
        : 'district';

  const district =
    filters.find((item) => item.field === 'district')?.value.trim() || '';

  const taluka =
    filters
      .find(
        (item) =>
          item.field === 'taluka' || item.field === 'subdistrict'
      )
      ?.value.trim() || '';

  // These three districts are intentionally enabled even if no public layout has
  // been saved there yet. Taluka/village options come from the administrative
  // directory, with database-backed options preferred whenever available.
  const params = new URLSearchParams({
    level: normalizedLevel,
  });

  if (district) {
    params.set('district', district);
  }

  if (taluka) {
    params.set('taluka', taluka);
  }

  let saved: string[] = [];

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/layouts/public/location-options?${params.toString()}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const payload = (await response.json()) as {
        data?: unknown;
        success?: boolean;
        message?: string;
      };

      const values = Array.isArray(payload.data) ? payload.data : [];

      const validValues = values
        .filter(
          (value): value is string =>
            typeof value === 'string' && value.trim().length > 0
        )
        .map((value) => value.trim());

      saved = Array.from(new Set<string>(validValues));
    }
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    // Continue to the administrative directory when the layout API is temporarily unavailable.
  }

  // Districts are sourced from existing public-eligible database records,
  // plus the three initial rollout districts.
  if (normalizedLevel === 'district') {
    return Array.from(
      new Set<string>([...PUBLIC_LOCATION_DISTRICTS, ...saved])
    ).sort((a, b) => a.localeCompare(b));
  }

  // Taluka and village options prefer existing database values and use the
  // administrative directory as a fallback for locations without a layout yet.
  const directoryFilters: Array<{
    field: 'state' | 'district' | 'taluka';
    value: string;
  }> = [
    {
      field: 'state',
      value: PUBLIC_LOCATION_STATE,
    },
  ];

  if (district) {
    directoryFilters.push({
      field: 'district',
      value: district,
    });
  }

  if (normalizedLevel === 'village' && taluka) {
    directoryFilters.push({
      field: 'taluka',
      value: taluka,
    });
  }

  const directory = await fetchAdministrativeOptions(
    normalizedLevel,
    directoryFilters,
    signal
  );

  return Array.from(new Set<string>([...saved, ...directory])).sort(
    (a, b) => a.localeCompare(b)
  );
}
