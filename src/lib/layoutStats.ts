import { Layout, Plot } from '@/lib/types';

/** Counts come only from Admin-registered Plot records — never from KML importedPlots. */
export function getPlotCounts(layout: Layout, plots: Plot[]) {
  if (layout.plotStats) {
    return {
      total: layout.plotStats.total ?? plots.length,
      available: layout.plotStats.available ?? 0,
      booked: layout.plotStats.booked ?? 0,
      sold: layout.plotStats.sold ?? 0,
      reserved: layout.plotStats.reserved ?? 0,
    };
  }

  return {
    total: plots.length,
    available: plots.filter((p) => p.status === 'available').length,
    booked: plots.filter((p) => p.status === 'booked').length,
    sold: plots.filter((p) => p.status === 'sold').length,
    reserved: plots.filter((p) => p.status === 'reserved').length,
  };
}

export function getPlotSizeRange(plots: Plot[]): string {
  if (!plots.length) return 'Contact for details';

  const sizes = plots
    .map((p) => {
      const match = p.size.match(/[\d,.]+/);
      return match ? parseFloat(match[0].replace(/,/g, '')) : null;
    })
    .filter((n): n is number => n !== null);

  if (!sizes.length) {
    const unique = Array.from(new Set(plots.map((p) => p.size)));
    return unique.length === 1 ? unique[0] : `${unique[0]} – ${unique[unique.length - 1]}`;
  }

  const min = Math.min(...sizes);
  const max = Math.max(...sizes);
  const unit = plots[0].size.replace(/[\d,.\s]+/g, '').trim() || 'sq.ft';

  if (min === max) return `${min.toLocaleString()} ${unit}`;
  return `${min.toLocaleString()} – ${max.toLocaleString()} ${unit}`;
}

export function formatPrice(price: number | null | undefined, onRequest = 'On request'): string {
  if (price == null) return onRequest;
  return `₹${price.toLocaleString('en-IN')}`;
}
