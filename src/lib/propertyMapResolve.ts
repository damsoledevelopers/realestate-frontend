import { hasValidCoordinates } from '@/lib/googleMaps';
import { Layout, MapPropertiesResponse, MapProperty, Plot } from '@/lib/types';

const normalizeToken = (value: string) => value.replace(/\s+/g, '').toUpperCase();

export function derivePlotCoordinatesFromSitePlan(
  layoutCoords: { lat: number; lng: number },
  plot: Pick<Plot, 'coordinates'>
): { lat: number; lng: number } {
  const x = typeof plot.coordinates?.x === 'number' ? plot.coordinates.x : 50;
  const y = typeof plot.coordinates?.y === 'number' ? plot.coordinates.y : 50;
  // Keep synthetic plot offsets tight around layout center.
  // 0.00001 ~= 1.1m latitude; this keeps max drift around ~55m.
  const scale = 0.00001;

  return {
    lat: layoutCoords.lat + (50 - y) * scale,
    lng: layoutCoords.lng + (x - 50) * scale,
  };
}

function matchPlotProperty(
  plot: Pick<Plot, '_id' | 'plotNumber'>,
  properties: MapProperty[],
  layoutId?: string
): MapProperty | null {
  const plotNumber = plot.plotNumber?.trim();
  if (!plotNumber) return null;

  const normalized = normalizeToken(plotNumber);
  const scoped = layoutId
    ? properties.filter((property) => property.linkedLayoutId === layoutId)
    : properties;

  const pool = scoped.length > 0 ? scoped : properties;

  return (
    pool.find((property) => {
      if (property.propertyType !== 'plot') return false;
      if (property.linkedPlotId && property.linkedPlotId === plot._id) return true;
      const number = normalizeToken(property.propertyNumber);
      const name = normalizeToken(property.name);
      return (
        number === normalized ||
        name.includes(normalized) ||
        number.includes(normalized)
      );
    }) || null
  );
}

function matchLayoutProperty(layout: Layout, properties: MapProperty[]): MapProperty | null {
  return (
    properties.find((property) => {
      if (property.propertyType !== 'layout') return false;
      if (property.linkedLayoutId && property.linkedLayoutId === layout._id) return true;
      return property.name.trim().toLowerCase() === layout.name.trim().toLowerCase();
    }) || null
  );
}

export function enrichLayoutWithMapData(
  layout: Layout,
  mapData: MapPropertiesResponse
): { layout: Layout; plots: Plot[] } {
  const properties = mapData.properties;
  const plots = layout.plots || [];

  let mapCoordinates = layout.mapCoordinates ?? null;

  if (!hasValidCoordinates(mapCoordinates?.lat, mapCoordinates?.lng)) {
    if (hasValidCoordinates(layout.coordinates?.lat, layout.coordinates?.lng)) {
      mapCoordinates = {
        lat: layout.coordinates!.lat as number,
        lng: layout.coordinates!.lng as number,
      };
    } else {
      const layoutProperty = matchLayoutProperty(layout, properties);
      if (layoutProperty) {
        mapCoordinates = { lat: layoutProperty.latitude, lng: layoutProperty.longitude };
      }
    }
  }

  const enrichedPlots = plots.map((plot) => {
    if (hasValidCoordinates(plot.mapCoordinates?.lat, plot.mapCoordinates?.lng)) {
      return plot;
    }

    const plotProperty = matchPlotProperty(plot, properties, layout._id);
    if (plotProperty) {
      return {
        ...plot,
        mapCoordinates: { lat: plotProperty.latitude, lng: plotProperty.longitude },
      };
    }

    if (mapCoordinates) {
      return {
        ...plot,
        mapCoordinates: derivePlotCoordinatesFromSitePlan(mapCoordinates, plot),
      };
    }

    return plot;
  });

  return {
    layout: { ...layout, mapCoordinates },
    plots: enrichedPlots,
  };
}
