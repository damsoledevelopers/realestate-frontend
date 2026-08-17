'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '@/lib/api';
import {
  buildStatusMap,
  FALLBACK_PROPERTY_STATUSES,
  getMapMarkerStyle,
  getStatusDefinitionFromList,
  PropertyStatusRecord,
  SALE_PROPERTY_STATUS_KEYS,
  StatusColorTokens,
} from '@/lib/propertyStatusConfig';

interface PropertyStatusConfigResponse {
  statuses: PropertyStatusRecord[];
}

interface PropertyStatusConfigContextValue {
  loading: boolean;
  statuses: PropertyStatusRecord[];
  saleStatuses: PropertyStatusRecord[];
  getDefinition: (status: string) => PropertyStatusRecord;
  getBadgeStyle: (status: string) => { backgroundColor: string; color: string };
  getIndicatorStyle: (status: string) => { backgroundColor: string };
  getMapMarkerStyle: (status: string) => { backgroundColor: string; borderColor: string };
  getChartColor: (status: string) => string;
  isBookable: (status: string) => boolean;
  refresh: () => Promise<void>;
  updateStatuses: (statuses: PropertyStatusRecord[], token: string) => Promise<void>;
}

const PropertyStatusConfigContext = createContext<PropertyStatusConfigContextValue | undefined>(
  undefined
);

export function PropertyStatusConfigProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<PropertyStatusRecord[]>(FALLBACK_PROPERTY_STATUSES);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await api.get<PropertyStatusConfigResponse>('/property-status-config');
      if (response.statuses?.length) {
        setStatuses(response.statuses);
      }
    } catch {
      setStatuses(FALLBACK_PROPERTY_STATUSES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const statusMap = useMemo(() => buildStatusMap(statuses), [statuses]);

  const saleStatuses = useMemo(
    () =>
      SALE_PROPERTY_STATUS_KEYS.map((key) => statusMap[key]).filter(
        (status): status is PropertyStatusRecord => Boolean(status)
      ),
    [statusMap]
  );

  const getDefinition = useCallback(
    (status: string) => getStatusDefinitionFromList(statuses, status),
    [statuses]
  );

  const getBadgeStyle = useCallback(
    (status: string) => {
      const colors = getDefinition(status).colors;
      return { backgroundColor: colors.badgeBg, color: colors.badgeText };
    },
    [getDefinition]
  );

  const getIndicatorStyle = useCallback(
    (status: string) => ({ backgroundColor: getDefinition(status).colors.indicator }),
    [getDefinition]
  );

  const getMapMarkerStyleForStatus = useCallback(
    (status: string) => getMapMarkerStyle(getDefinition(status).colors),
    [getDefinition]
  );

  const getChartColor = useCallback(
    (status: string) => getDefinition(status).colors.indicator,
    [getDefinition]
  );

  const isBookable = useCallback(
    (status: string) => getDefinition(status).bookable,
    [getDefinition]
  );

  const updateStatuses = useCallback(async (nextStatuses: PropertyStatusRecord[], token: string) => {
    const response = await api.put<PropertyStatusConfigResponse>(
      '/property-status-config',
      { statuses: nextStatuses },
      token
    );

    if (response.statuses?.length) {
      setStatuses(response.statuses);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      statuses,
      saleStatuses,
      getDefinition,
      getBadgeStyle,
      getIndicatorStyle,
      getMapMarkerStyle: getMapMarkerStyleForStatus,
      getChartColor,
      isBookable,
      refresh: fetchConfig,
      updateStatuses,
    }),
    [
      loading,
      statuses,
      saleStatuses,
      getDefinition,
      getBadgeStyle,
      getIndicatorStyle,
      getMapMarkerStyleForStatus,
      getChartColor,
      isBookable,
      fetchConfig,
      updateStatuses,
    ]
  );

  return (
    <PropertyStatusConfigContext.Provider value={value}>
      {children}
    </PropertyStatusConfigContext.Provider>
  );
}

export function usePropertyStatusConfig() {
  const context = useContext(PropertyStatusConfigContext);
  if (!context) {
    throw new Error('usePropertyStatusConfig must be used within PropertyStatusConfigProvider');
  }
  return context;
}

export function useIsPropertyBookable() {
  const { isBookable } = usePropertyStatusConfig();
  return isBookable;
}
