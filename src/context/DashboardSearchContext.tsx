'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardSearchHref, searchDashboard } from '@/lib/dashboard';
import {
  DashboardSearchEntityType,
  DashboardSearchResponse,
  DashboardSearchResult,
} from '@/lib/types';

interface DashboardSearchContextValue {
  query: string;
  setQuery: (value: string) => void;
  typeFilter: DashboardSearchEntityType | '';
  setTypeFilter: (value: DashboardSearchEntityType | '') => void;
  results: DashboardSearchResult[];
  pagination: DashboardSearchResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  clearSearch: () => void;
  getResultHref: (result: DashboardSearchResult) => string;
}

const DashboardSearchContext = createContext<DashboardSearchContextValue | null>(null);

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DashboardSearchEntityType | ''>('');
  const [results, setResults] = useState<DashboardSearchResult[]>([]);
  const [pagination, setPagination] = useState<DashboardSearchResponse['pagination'] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const requestId = useRef(0);

  const runSearch = useCallback(
    async (searchQuery: string, type: DashboardSearchEntityType | '') => {
      const trimmed = searchQuery.trim();
      const canSearch = Boolean(type) || trimmed.length >= 2;

      if (!token || !canSearch) {
        setResults([]);
        setPagination(null);
        setError(null);
        setLoading(false);
        return;
      }

      const currentRequest = ++requestId.current;
      setLoading(true);
      setError(null);

      try {
        const data = await searchDashboard(token, {
          q: trimmed || undefined,
          type: type || undefined,
          page: 1,
          limit: 8,
        });

        if (currentRequest !== requestId.current) return;

        setResults(data.results);
        setPagination(data.pagination);
      } catch (err: unknown) {
        if (currentRequest !== requestId.current) return;
        const message = (err as { message?: string })?.message || 'Search failed';
        setError(message);
        setResults([]);
        setPagination(null);
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    const canSearch = Boolean(typeFilter) || query.trim().length >= 2;

    if (!canSearch) {
      setResults([]);
      setPagination(null);
      setError(null);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      runSearch(query, typeFilter);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, typeFilter, runSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setTypeFilter('');
    setResults([]);
    setPagination(null);
    setError(null);
    setIsOpen(false);
  }, []);

  const getResultHref = useCallback(
    (result: DashboardSearchResult) =>
      getDashboardSearchHref({
        type: result.type,
        id: result.id,
        layoutId: result.layoutId,
      }),
    []
  );

  const value = useMemo(
    () => ({
      query,
      setQuery,
      typeFilter,
      setTypeFilter,
      results,
      pagination,
      loading,
      error,
      isOpen,
      setIsOpen,
      clearSearch,
      getResultHref,
    }),
    [
      query,
      typeFilter,
      results,
      pagination,
      loading,
      error,
      isOpen,
      clearSearch,
      getResultHref,
    ]
  );

  return (
    <DashboardSearchContext.Provider value={value}>{children}</DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch() {
  const context = useContext(DashboardSearchContext);
  if (!context) {
    throw new Error('useDashboardSearch must be used within DashboardSearchProvider');
  }
  return context;
}

export function useOptionalDashboardSearch() {
  return useContext(DashboardSearchContext);
}
