'use client';

import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import {
  StartupLayoutActivity,
  StartupPlotActivity,
} from '@/lib/types';
import StatusBadge from '@/components/property/StatusBadge';
import { TableSkeleton } from '@/components/dashboard/Skeletons';

interface RecentActivityPanelProps {
  recentlyUpdatedLayouts: StartupLayoutActivity[];
  recentlyBookedSoldPlots: StartupPlotActivity[];
  recentlyAddedLayouts: StartupLayoutActivity[];
  loading?: boolean;
}

function LayoutActivityList({
  items,
  emptyLabel,
}: {
  items: StartupLayoutActivity[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-gray-400">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-gray-100">
      {items.map((layout) => (
        <li key={layout.id}>
          <Link
            href={`/dashboard/layouts/${layout.id}`}
            className="flex items-start justify-between gap-3 py-3 transition hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{layout.name}</p>
              <p className="truncate text-sm text-gray-500">{layout.location || '—'}</p>
            </div>
            <time className="shrink-0 text-xs text-gray-400">
              {new Date(layout.date).toLocaleDateString()}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PlotActivityList({
  items,
  emptyLabel,
}: {
  items: StartupPlotActivity[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-gray-400">{emptyLabel}</p>;
  }

  return (
    <div className="mt-4 table-wrap">
      <table className="table-data">
        <thead className="border-b text-xs uppercase text-gray-500">
          <tr>
            <th className="px-3 py-3">Plot</th>
            <th className="px-3 py-3">Layout</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((plot) => (
            <tr key={plot.id} className="text-gray-700">
              <td className="px-3 py-3 font-medium">
                <Link
                  href={plot.layoutId ? `/dashboard/layouts/${plot.layoutId}` : '/dashboard/plots'}
                  className="hover:text-primary-600"
                >
                  {plot.plotNumber}
                </Link>
              </td>
              <td className="px-3 py-3 text-gray-500">{plot.layoutName || '—'}</td>
              <td className="px-3 py-3">
                <StatusBadge status={plot.status} />
              </td>
              <td className="px-3 py-3 text-gray-500">
                {new Date(plot.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecentActivityPanel({
  recentlyUpdatedLayouts,
  recentlyBookedSoldPlots,
  recentlyAddedLayouts,
  loading,
}: RecentActivityPanelProps) {
  const { t } = useLocale();

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.startup.recentActivity')}</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <TableSkeleton rows={4} />
          <TableSkeleton rows={4} />
          <TableSkeleton rows={4} />
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.startup.recentActivity')}</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold text-gray-900">{t('dashboard.startup.recent.updatedLayouts')}</h3>
          <LayoutActivityList
            items={recentlyUpdatedLayouts}
            emptyLabel={t('dashboard.startup.recent.emptyUpdated')}
          />
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900">{t('dashboard.startup.recent.bookedSoldPlots')}</h3>
          <PlotActivityList
            items={recentlyBookedSoldPlots}
            emptyLabel={t('dashboard.startup.recent.emptyPlots')}
          />
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900">{t('dashboard.startup.recent.addedLayouts')}</h3>
          <LayoutActivityList
            items={recentlyAddedLayouts}
            emptyLabel={t('dashboard.startup.recent.emptyAdded')}
          />
        </div>
      </div>
    </section>
  );
}
