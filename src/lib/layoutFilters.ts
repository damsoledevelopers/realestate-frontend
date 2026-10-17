
import { Layout } from '@/lib/types';
import { LayoutStatusFilter } from '@/hooks/useLayouts';

export type LayoutSortOption =
  | 'newest'
  | 'updated'
  | 'price'
  | 'available'
  | 'plots';

export type PriceRangeFilter =
  | 'all'
  | 'under-5l'
  | '5l-10l'
  | '10l-25l'
  | 'above-25l';

export interface LayoutFilterParams {
  search: string;
  statusFilter?: LayoutStatusFilter;
  sortBy: LayoutSortOption;
  priceRange?: PriceRangeFilter;
  location?: string;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  surveyNumber?: string;
}

export const PRICE_RANGE_OPTIONS: {
  value: PriceRangeFilter;
  label: string;
}[] = [
  { value: 'all', label: 'Any price' },
  { value: 'under-5l', label: 'Under ₹5 Lakh' },
  { value: '5l-10l', label: '₹5 – 10 Lakh' },
  { value: '10l-25l', label: '₹10 – 25 Lakh' },
  { value: 'above-25l', label: 'Above ₹25 Lakh' },
];

export const SORT_OPTIONS: {
  value: LayoutSortOption;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'price', label: 'Price: low to high' },
  { value: 'available', label: 'Most available' },
  { value: 'plots', label: 'Most plots' },
];

/** Only Maharashtra is supported for location filtering. */
export const INDIA_STATES = ['Maharashtra'];

export interface LayoutLocationParts {
  state: string;
  district: string;
  taluka: string;
  village: string;
}

const normalize = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const includesCI = (a: string, b: string): boolean =>
  a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

export function getLayoutLocationParts(
  layout: Layout,
): LayoutLocationParts {
  const record = layout as Layout & Record<string, unknown>;
  const location = normalize(layout.location);

  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const state =
    normalize(record.state) ||
    parts.find((part) =>
      INDIA_STATES.some((item) => includesCI(item, part)),
    ) ||
    '';

  const stateIndex = state
    ? parts.findIndex((part) => includesCI(part, state))
    : -1;

  const district =
    normalize(record.district) ||
    (stateIndex > 0 ? parts[stateIndex - 1] : '');

  const districtIndex = district
    ? parts.findIndex((part) => includesCI(part, district))
    : -1;

  const village =
    normalize(record.village) ||
    (districtIndex > 0
      ? parts[districtIndex - 1].replace(
          /^(village|gaon|gat no\.?|survey no\.?)\s*/i,
          '',
        )
      : '');

  return {
    state,
    district,
    taluka: normalize(record.taluka),
    village,
  };
}

export function getDependentLocationOptions(
  layouts: Layout[],
  level: keyof LayoutLocationParts,
  filters: Partial<LayoutLocationParts> = {},
): string[] {
  const values = new Set<string>();

  for (const layout of layouts) {
    const parts = getLayoutLocationParts(layout);

    if (
      filters.state &&
      !includesCI(parts.state, filters.state)
    ) {
      continue;
    }

    if (
      filters.district &&
      !includesCI(parts.district, filters.district)
    ) {
      continue;
    }

    if (
      filters.taluka &&
      !includesCI(parts.taluka, filters.taluka)
    ) {
      continue;
    }

    const value = parts[level];

    if (value) {
      values.add(value);
    }
  }

  return Array.from(values).sort((a, b) =>
    a.localeCompare(b),
  );
}

function matchesPriceRange(
  price: number | null | undefined,
  range: PriceRangeFilter,
): boolean {
  if (range === 'all') return true;
  if (price == null) return false;

  switch (range) {
    case 'under-5l':
      return price < 500_000;

    case '5l-10l':
      return price >= 500_000 && price <= 1_000_000;

    case '10l-25l':
      return price > 1_000_000 && price <= 2_500_000;

    case 'above-25l':
      return price > 2_500_000;

    default:
      return true;
  }
}

export function getUniqueLocations(layouts: Layout[]): string[] {
  const locations = new Set<string>();

  for (const layout of layouts) {
    const trimmed = layout.location?.trim();

    if (trimmed) {
      locations.add(trimmed);
    }
  }

  return Array.from(locations).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function filterAndSortLayouts(
  layouts: Layout[],
  {
    search,
    statusFilter = 'active',
    sortBy,
    priceRange = 'all',
    location = '',
    state = '',
    district = '',
    taluka = '',
    village = '',
    surveyNumber = '',
  }: LayoutFilterParams,
): Layout[] {
  const query = search.trim().toLowerCase();
  const locationQuery = location.trim().toLowerCase();
  const surveyQuery = surveyNumber.trim().toLowerCase();

  let result = layouts.filter((layout) => {
    if (statusFilter === 'active' && layout.status !== 'active') {
      return false;
    }

    if (
      !matchesPriceRange(
        layout.startingPrice ?? layout.price,
        priceRange,
      )
    ) {
      return false;
    }

    if (
      locationQuery &&
      !(layout.location || '').toLowerCase().includes(locationQuery)
    ) {
      return false;
    }

    const parts = getLayoutLocationParts(layout);
    const layoutRecord = layout as Layout & Record<string, unknown>;
    const rawLocation = normalize(layout.location);

    const matchLocationPart = (
      selected: string,
      structured: unknown,
      inferred: string,
    ): boolean => {
      if (!selected) return true;

      const known = normalize(structured) || inferred;

      if (known) {
        return includesCI(known, selected);
      }

      return rawLocation
        .toLocaleLowerCase()
        .includes(selected.toLocaleLowerCase());
    };

    const supportedDistrict = [
      'Dhule',
      'Jalgaon',
      'Nandurbar',
    ].some((item) =>
      includesCI(
        item,
        normalize(layoutRecord.district) || parts.district,
      ),
    );

    if (
      state &&
      !matchLocationPart(state, layoutRecord.state, parts.state) &&
      !(includesCI(state, 'Maharashtra') && supportedDistrict)
    ) {
      return false;
    }

    if (
      district &&
      !matchLocationPart(
        district,
        layoutRecord.district,
        parts.district,
      )
    ) {
      return false;
    }

    if (
      taluka &&
      !matchLocationPart(
        taluka,
        layoutRecord.taluka,
        parts.taluka,
      )
    ) {
      return false;
    }

    if (
      village &&
      !matchLocationPart(
        village,
        layoutRecord.village,
        parts.village,
      )
    ) {
      return false;
    }

    const plots = Array.isArray(layout.plots) ? layout.plots : [];

    if (surveyQuery) {
      const layoutSurvey = [
        normalize(layoutRecord.surveyNumber),
        normalize(layoutRecord.gatNumber),
        ...(Array.isArray(layout.surveyNumbers)
          ? layout.surveyNumbers.map(normalize)
          : []),
      ]
        .join(' ')
        .toLowerCase();

      const layoutGat = normalize(
        layoutRecord.gatNumber,
      ).toLowerCase();

      const plotMatch = plots.some((plot) => {
        const p = plot as unknown as Record<string, unknown>;

        return [
          p.surveyNumber,
          p.plotNumber,
          p.gatNumber,
          p.number,
        ].some((value) =>
          normalize(value).toLowerCase().includes(surveyQuery),
        );
      });

      if (
        !layoutSurvey.includes(surveyQuery) &&
        !layoutGat.includes(surveyQuery) &&
        !plotMatch
      ) {
        return false;
      }
    }

    if (!query) return true;

    const nameMr = layout.nameMr?.toLowerCase() || '';

    return (
      layout.name.toLowerCase().includes(query) ||
      nameMr.includes(query) ||
      (layout.location || '').toLowerCase().includes(query) ||
      parts.state.toLowerCase().includes(query) ||
      parts.district.toLowerCase().includes(query) ||
      parts.taluka.toLowerCase().includes(query) ||
      parts.village.toLowerCase().includes(query) ||
      normalize(layoutRecord.surveyNumber)
        .toLowerCase()
        .includes(query) ||
      (Array.isArray(layout.surveyNumbers) &&
        layout.surveyNumbers.some((value) =>
          normalize(value).toLowerCase().includes(query),
        )) ||
      plots.some((plot) => {
        const p = plot as unknown as Record<string, unknown>;

        return [
          p.surveyNumber,
          p.plotNumber,
          p.gatNumber,
        ].some((value) =>
          normalize(value).toLowerCase().includes(query),
        );
      })
    );
  });

  result = result.sort((a, b) => {
    if (sortBy === 'price') {
      return (
        (a.startingPrice ?? a.price ?? Number.MAX_SAFE_INTEGER) -
        (b.startingPrice ?? b.price ?? Number.MAX_SAFE_INTEGER)
      );
    }

    if (sortBy === 'available') {
      return (
        (b.plotStats?.available ?? b.availablePlots ?? 0) -
        (a.plotStats?.available ?? a.availablePlots ?? 0)
      );
    }

    if (sortBy === 'plots') {
      return (
        (b.plotStats?.total ?? b.totalPlots ?? 0) -
        (a.plotStats?.total ?? a.totalPlots ?? 0)
      );
    }

    if (sortBy === 'updated') {
      return (
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    }

    return (
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
    );
  });

  return result;
}

export function hasActiveLayoutFilters(
  params: LayoutFilterParams,
): boolean {
  return Boolean(
    params.search.trim() ||
      params.location?.trim() ||
      params.state?.trim() ||
      params.district?.trim() ||
      params.taluka?.trim() ||
      params.village?.trim() ||
      params.surveyNumber?.trim() ||
      (params.priceRange ?? 'all') !== 'all' ||
      (params.statusFilter ?? 'active') !== 'active' ||
      params.sortBy !== 'newest',
  );
}

export function buildLayoutsSearchParams({
  search,
  sortBy,
  priceRange = 'all',
  location = '',
  state = '',
  district = '',
  taluka = '',
  village = '',
  surveyNumber = '',
}: Pick<
  LayoutFilterParams,
  | 'search'
  | 'sortBy'
  | 'priceRange'
  | 'location'
  | 'state'
  | 'district'
  | 'taluka'
  | 'village'
  | 'surveyNumber'
>): string {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (location.trim()) {
    params.set('location', location.trim());
  }

  if (state.trim()) {
    params.set('state', state.trim());
  }

  if (district.trim()) {
    params.set('district', district.trim());
  }

  if (taluka.trim()) {
    params.set('taluka', taluka.trim());
  }

  if (village.trim()) {
    params.set('village', village.trim());
  }

  if (surveyNumber.trim()) {
    params.set('surveyNumber', surveyNumber.trim());
  }

  if (priceRange !== 'all') {
    params.set('price', priceRange);
  }

  if (sortBy !== 'newest') {
    params.set('sort', sortBy);
  }

  const query = params.toString();

  return query ? `/layouts?${query}` : '/layouts';
}
