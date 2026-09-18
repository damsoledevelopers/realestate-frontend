'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import LayoutLinesMap from '@/components/maps/LayoutLinesMap';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName } from '@/lib/localizedText';
import {
  clearLayoutMapGeoJsonCache,
  hasGeoJsonLines,
  LayoutMapGeoJson,
  prefetchLayoutMapGeoJson,
} from '@/lib/layoutMapGeoJson';
import { Layout } from '@/lib/types';

export default function LayoutMapPage() {
  const { id } = useParams<{ id: string }>();
  const { locale, t } = useLocale();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [geoJson, setGeoJson] = useState<LayoutMapGeoJson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    clearLayoutMapGeoJsonCache(id);

    Promise.all([
      api.get<Layout>(`/layouts/${id}`),
      prefetchLayoutMapGeoJson(id).catch(() => null),
    ])
      .then(([layoutData, mapData]) => {
        if (cancelled) return;
        setLayout(layoutData);
        setGeoJson(mapData && hasGeoJsonLines(mapData) ? mapData : null);
      })
      .catch(() => {
        if (!cancelled) {
          setLayout(null);
          setGeoJson(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayName = layout ? getLayoutDisplayName(layout, locale) : t('detail.location.title');

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/layouts/${id}`}
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              ← {t('detail.location.layout')}
            </Link>
            <h1 className="truncate text-lg font-bold text-gray-900">{displayName}</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        {loading && !layout ? (
          <div className="flex flex-1 items-center justify-center rounded-xl bg-white">
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          </div>
        ) : !layout ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-gray-100 px-4 text-center">
            <p className="text-sm text-gray-600">Layout not found.</p>
            <Link href="/layouts" className="btn-primary mt-4">
              Browse layouts
            </Link>
          </div>
        ) : (
          <LayoutLinesMap
            key={`${layout._id}-${geoJson?.features?.length || 0}`}
            layoutId={layout._id}
            layout={layout}
            initialGeoJson={geoJson}
            className="min-h-[calc(100vh-12rem)] w-full flex-1 rounded-xl"
          />
        )}
      </div>
    </div>
  );
}
