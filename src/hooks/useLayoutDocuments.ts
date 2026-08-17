'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { LayoutDocumentsResponse } from '@/lib/documents';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface UseDocumentsOptions {
  token: string | null;
  layoutFilter?: string | null;
}

export function useDocuments({ token, layoutFilter = null }: UseDocumentsOptions) {
  const [data, setData] = useState<LayoutDocumentsResponse | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (layoutFilter) {
        params.set('layoutId', layoutFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      } else if (currentFolderId) {
        params.set('folderId', currentFolderId);
      }
      const query = params.toString();
      const response = await api.get<LayoutDocumentsResponse>(
        `/documents${query ? `?${query}` : ''}`,
        token
      );
      setData(response);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load documents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, currentFolderId, debouncedSearch, layoutFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const openFolder = (folderId: string | null) => {
    setSearch('');
    setCurrentFolderId(folderId);
  };

  const runSearch = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      setCurrentFolderId(null);
    }
  };

  return {
    data,
    loading,
    error,
    currentFolderId,
    search,
    openFolder,
    setSearch: runSearch,
    refresh: fetchDocuments,
  };
}

// Backward-compatible alias
export const useLayoutDocuments = useDocuments;
