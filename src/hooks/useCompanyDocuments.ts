'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCompanyDocuments } from '@/lib/companyDocuments';
import { CompanyDocumentCategory, CompanyDocumentsResponse } from '@/lib/documents';

interface UseCompanyDocumentsOptions {
  layoutId: string;
  token: string | null;
  category?: CompanyDocumentCategory | '';
  search?: string;
}

export function useCompanyDocuments({
  layoutId,
  token,
  category = '',
  search = '',
}: UseCompanyDocumentsOptions) {
  const [data, setData] = useState<CompanyDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !layoutId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCompanyDocuments(layoutId, token, {
        category: category || undefined,
        search: search.trim() || undefined,
      });
      setData(response);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to load company documents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, layoutId, category, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
