import { hasValidCoordinates } from '@/lib/googleMaps';
import { AppLocale } from '@/lib/locale';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';
import {
  formatPropertyArea,
  formatPropertyPrice,
  formatStatusLabel,
} from '@/lib/properties';
import { derivePlotCoordinatesFromSitePlan } from '@/lib/propertyMapResolve';
import {
  AreaUnit,
  Layout,
  MapProperty,
  Plot,
  Property,
  PropertyArea,
  PropertyStatus,
  PropertyType,
} from '@/lib/types';
import { PropertyGisDetailsData } from '@/components/property/PropertyGisDetails';
import { normalizeConstructionStatus } from '@/lib/constructionStatusConfig';

export interface PlotToMapPropertyContext {
  layoutId: string;
  layoutName?: string;
  layoutLocation?: string;
  layoutCoordinates?: { lat?: number; lng?: number };
}

export function resolvePropertyAddress(
  property: Pick<MapProperty, 'linkedLayoutId' | 'propertyType' | 'latitude' | 'longitude'>,
  layoutLocations: Map<string, string>
): string | null {
  if (property.linkedLayoutId) {
    const location = layoutLocations.get(property.linkedLayoutId)?.trim();
    if (location) return location;
  }

  if (
    typeof property.latitude === 'number' &&
    typeof property.longitude === 'number' &&
    !Number.isNaN(property.latitude) &&
    !Number.isNaN(property.longitude)
  ) {
    return `${property.latitude.toFixed(6)}, ${property.longitude.toFixed(6)}`;
  }

  return null;
}

export function enrichMapPropertiesWithAddress(
  properties: MapProperty[],
  layouts: Pick<Layout, '_id' | 'location'>[]
): MapProperty[] {
  const layoutLocations = new Map(layouts.map((layout) => [layout._id, layout.location]));

  return properties.map((property) => ({
    ...property,
    address: resolvePropertyAddress(property, layoutLocations),
  }));
}

/** Fill missing layout polygons/polylines from layout records (e.g. after KML import before re-sync). */
export function enrichMapPropertiesWithLayoutBoundaries(
  properties: MapProperty[],
  layouts: Layout[]
): MapProperty[] {
  const boundaryByLayoutId = new Map(
    layouts
      .filter((layout) => layout.boundaryPath && layout.boundaryPath.length >= 3)
      .map((layout) => [layout._id, layout.boundaryPath as NonNullable<Layout['boundaryPath']>])
  );
  const polylinesByLayoutId = new Map(
    layouts
      .filter((layout) => layout.mapLinesPath && layout.mapLinesPath.length > 0)
      .map((layout) => [layout._id, layout.mapLinesPath as NonNullable<Layout['mapLinesPath']>])
  );

  return properties.map((property) => {
    const layoutId = property.linkedLayoutId || (property.propertyType === 'layout' ? property.id : null);
    if (!layoutId) return property;

    let next = property;
    if (!(property.boundary && property.boundary.length >= 3)) {
      const boundary = boundaryByLayoutId.get(layoutId);
      if (boundary) next = { ...next, boundary };
    }
    if (!property.polylines?.length) {
      const polylines = polylinesByLayoutId.get(layoutId);
      if (polylines?.length) next = { ...next, polylines };
    }
    return next;
  });
}

/** Include dashboard layouts on the public map when they are not already synced as properties. */
export function mergeMapPropertiesWithLayouts(
  properties: MapProperty[],
  layouts: Layout[],
  locale: AppLocale = 'en'
): MapProperty[] {
  const coveredLayoutIds = new Set<string>();

  properties.forEach((property) => {
    if (property.linkedLayoutId) {
      coveredLayoutIds.add(property.linkedLayoutId);
    }
    if (property.propertyType === 'layout') {
      coveredLayoutIds.add(property.id);
    }
  });

  const fromLayouts = layouts
    .filter((layout) => layout.status === 'active' && !coveredLayoutIds.has(layout._id))
    .map((layout) => layoutToMapProperty(layout, locale))
    .filter((property): property is MapProperty => property !== null);

  return [...properties, ...fromLayouts];
}

function resolvePlotArea(plot: Plot): PropertyArea {
  if (plot.area?.value) {
    return plot.area as PropertyArea;
  }

  return {
    value: 0,
    unit: 'plots' as AreaUnit,
    display: plot.size || '—',
  };
}

function resolvePlotCoordinates(
  plot: Plot,
  context: PlotToMapPropertyContext
): { lat: number; lng: number } {
  let lat = plot.latitude ?? plot.mapCoordinates?.lat ?? null;
  let lng = plot.longitude ?? plot.mapCoordinates?.lng ?? null;

  if (
    !hasValidCoordinates(lat, lng) &&
    hasValidCoordinates(context.layoutCoordinates?.lat, context.layoutCoordinates?.lng)
  ) {
    const derived = derivePlotCoordinatesFromSitePlan(
      {
        lat: context.layoutCoordinates!.lat as number,
        lng: context.layoutCoordinates!.lng as number,
      },
      plot
    );
    lat = derived.lat;
    lng = derived.lng;
  }

  return {
    lat: lat ?? 0,
    lng: lng ?? 0,
  };
}

export function plotToMapProperty(plot: Plot, context: PlotToMapPropertyContext): MapProperty {
  const { lat, lng } = resolvePlotCoordinates(plot, context);
  const layoutPrefix = context.layoutName ? `${context.layoutName} — ` : '';

  return {
    id: plot._id,
    name: plot.propertyName?.trim() || `${layoutPrefix}Plot ${plot.plotNumber}`,
    propertyNumber: plot.propertyNumber?.trim() || plot.plotNumber,
    propertyType: (plot.propertyType as PropertyType) || 'plot',
    area: resolvePlotArea(plot),
    price: plot.price,
    status: plot.status as PropertyStatus,
    constructionStatus: normalizeConstructionStatus(plot.constructionStatus),
    latitude: lat,
    longitude: lng,
    boundary: plot.boundaryPath ?? null,
    polylines: plot.mapLinesPath?.length ? plot.mapLinesPath : null,
    parentPropertyId: context.layoutId,
    linkedLayoutId: context.layoutId,
    linkedPlotId: plot._id,
    address: context.layoutLocation?.trim() || null,
  };
}

export function layoutToMapProperty(layout: Layout, locale: AppLocale = 'en'): MapProperty | null {
  const lat = layout.latitude ?? layout.coordinates?.lat ?? layout.mapCoordinates?.lat;
  const lng = layout.longitude ?? layout.coordinates?.lng ?? layout.mapCoordinates?.lng;

  if (!hasValidCoordinates(lat, lng)) return null;

  const localizedName = getLayoutDisplayName(layout, locale);
  const area: PropertyArea = layout.area?.value
    ? (layout.area as PropertyArea)
    : {
        value: layout.totalPlots,
        unit: 'plots',
        display: `${layout.totalPlots} plots`,
      };

  return {
    id: layout._id,
    name: layout.propertyName?.trim() || localizedName,
    propertyNumber: layout.propertyNumber?.trim() || layout._id.slice(-6).toUpperCase(),
    propertyType: (layout.propertyType as PropertyType) || 'layout',
    area,
    price: layout.startingPrice ?? layout.price ?? null,
    status: layout.status === 'active' ? 'active' : 'inactive',
    latitude: lat as number,
    longitude: lng as number,
    boundary: layout.boundaryPath ?? null,
    polylines: layout.mapLinesPath?.length ? layout.mapLinesPath : null,
    parentPropertyId: null,
    linkedLayoutId: layout._id,
    address: getLocalizedLocation(layout.location?.trim() || '', locale, layout.locationMr) || null,
  };
}

export function propertyToMapProperty(property: Property): MapProperty {
  return {
    id: property.id || property._id,
    name: property.name,
    propertyNumber: property.propertyNumber,
    propertyType: property.propertyType,
    area: property.area,
    price: property.price,
    status: property.status,
    constructionStatus: property.constructionStatus,
    latitude: property.latitude,
    longitude: property.longitude,
    boundary: property.boundary ?? property.boundaryPath,
    polylines: property.polylines ?? property.mapLinesPath ?? null,
    parentPropertyId: property.parentPropertyId,
    linkedLayoutId: property.linkedLayoutId,
    linkedPlotId: property.linkedPlotId,
    address: property.address ?? null,
  };
}

export function mapPropertyToGisDetails(property: MapProperty): PropertyGisDetailsData {
  return {
    propertyName: property.name,
    propertyNumber: property.propertyNumber,
    propertyType: property.propertyType,
    area: property.area.display?.trim() || formatPropertyArea(property.area),
    price:
      property.price == null
        ? 'On request'
        : formatPropertyPrice(property.price),
    status: formatStatusLabel(property.status),
    statusKey: property.status,
    constructionStatus: property.constructionStatus,
    address: property.address ?? null,
    latitude: property.latitude,
    longitude: property.longitude,
  };
}
