import { Layout } from '@/lib/types';
import { LayoutStatusFilter } from '@/hooks/useLayouts';

export type LayoutSortOption = 'newest' | 'updated' | 'price' | 'available' | 'plots';
export type PriceRangeFilter = 'all' | 'under-5l' | '5l-10l' | '10l-25l' | 'above-25l';

export interface LayoutFilterParams {
  search: string;
  statusFilter?: LayoutStatusFilter;
  sortBy: LayoutSortOption;
  priceRange?: PriceRangeFilter;
  location?: string;
}

export const PRICE_RANGE_OPTIONS: { value: PriceRangeFilter; label: string }[] = [
  { value: 'all', label: 'Any price' },
  { value: 'under-5l', label: 'Under ₹5 Lakh' },
  { value: '5l-10l', label: '₹5 – 10 Lakh' },
  { value: '10l-25l', label: '₹10 – 25 Lakh' },
  { value: 'above-25l', label: 'Above ₹25 Lakh' },
];

export const SORT_OPTIONS: { value: LayoutSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'price', label: 'Price: low to high' },
  { value: 'available', label: 'Most available' },
  { value: 'plots', label: 'Most plots' },
];

function matchesPriceRange(price: number | null | undefined, range: PriceRangeFilter): boolean {
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
    if (trimmed) locations.add(trimmed);
  }
  return Array.from(locations).sort((a, b) => a.localeCompare(b));
}

export function filterAndSortLayouts(
  layouts: Layout[],
  {
    search,
    statusFilter = 'active',
    sortBy,
    priceRange = 'all',
    location = '',
  }: LayoutFilterParams
): Layout[] {
  const query = search.trim().toLowerCase();
  const locationQuery = location.trim().toLowerCase();

  let result = layouts.filter((layout) => {
    if (statusFilter === 'active' && layout.status !== 'active') return false;
    if (!matchesPriceRange(layout.startingPrice, priceRange)) return false;
    if (locationQuery && !layout.location.toLowerCase().includes(locationQuery)) return false;
    if (!query) return true;
    const nameMr = layout.nameMr?.toLowerCase() || '';
    return (
      layout.name.toLowerCase().includes(query) ||
      nameMr.includes(query) ||
      layout.location.toLowerCase().includes(query)
    );
  });

  result = [...result].sort((a, b) => {
    if (sortBy === 'price') {
      const priceA = a.startingPrice ?? Number.MAX_SAFE_INTEGER;
      const priceB = b.startingPrice ?? Number.MAX_SAFE_INTEGER;
      return priceA - priceB;
    }
    if (sortBy === 'available') {
      const availA = a.plotStats?.available ?? a.availablePlots ?? 0;
      const availB = b.plotStats?.available ?? b.availablePlots ?? 0;
      return availB - availA;
    }
    if (sortBy === 'plots') {
      const totalA = a.plotStats?.total ?? a.totalPlots ?? 0;
      const totalB = b.plotStats?.total ?? b.totalPlots ?? 0;
      return totalB - totalA;
    }
    if (sortBy === 'updated') {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    }
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return result;
}

export function hasActiveLayoutFilters({
  search,
  statusFilter = 'active',
  sortBy,
  priceRange = 'all',
  location = '',
}: LayoutFilterParams): boolean {
  return (
    search.trim().length > 0 ||
    location.trim().length > 0 ||
    priceRange !== 'all' ||
    statusFilter !== 'active' ||
    sortBy !== 'newest'
  );
}

export function buildLayoutsSearchParams({
  search,
  sortBy,
  priceRange = 'all',
  location = '',
}: Pick<LayoutFilterParams, 'search' | 'sortBy' | 'priceRange' | 'location'>): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (location.trim()) params.set('location', location.trim());
  if (priceRange !== 'all') params.set('price', priceRange);
  if (sortBy !== 'newest') params.set('sort', sortBy);
  const query = params.toString();
  return query ? `/layouts?${query}` : '/layouts';
}
