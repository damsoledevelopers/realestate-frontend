'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { MapPropertiesResponse, PropertyType } from '@/lib/types';

interface UseMapPropertiesOptions {
  types?: PropertyType[];
  enabled?: boolean;
}

interface UseMapPropertiesResult {
  properties: MapPropertiesResponse['properties'];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMapProperties({
  types,
  enabled = true,
}: UseMapPropertiesOptions = {}): UseMapPropertiesResult {
  const [properties, setProperties] = useState<MapPropertiesResponse['properties']>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!enabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (types?.length === 1) {
        params.set('propertyType', types[0]);
      }

      const endpoint = `/properties/map${params.toString() ? `?${params}` : ''}`;
      const response = await api.get<MapPropertiesResponse>(endpoint);

      if (controller.signal.aborted) return;

      const filtered =
        types && types.length > 1
          ? response.properties.filter((property) => types.includes(property.propertyType))
          : response.properties;

      setProperties(filtered);
      setTotal(filtered.length);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = (err as { message?: string })?.message || 'Failed to load properties';
      setError(message);
      setProperties([]);
      setTotal(0);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled, types]);

  useEffect(() => {
    fetchProperties();
    return () => abortRef.current?.abort();
  }, [fetchProperties]);

  return {
    properties,
    total,
    loading,
    error,
    refetch: fetchProperties,
  };
}
