'use client';

import Link from 'next/link';
import { Layout } from '@/lib/types';
import LayoutImage from '@/components/layouts/LayoutImage';
import { getHeroImage } from '@/lib/layoutImages';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';

interface DashboardLayoutCardProps {
  layout: Layout;
}

export default function DashboardLayoutCard({ layout }: DashboardLayoutCardProps) {
  const { locale } = useLocale();
  const displayName = getLayoutDisplayName(layout, locale);
  const displayLocation = getLocalizedLocation(layout.location, locale, layout.locationMr);
  const image = getHeroImage(layout);
  const stats = layout.plotStats;
  const total = stats?.total ?? layout.totalPlots ?? 0;
  const updated = layout.updatedAt
    ? new Date(layout.updatedAt).toLocaleDateString()
    : '—';

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/dashboard/layouts/${layout._id}`} className="relative block aspect-[16/10] bg-gray-100">
        <LayoutImage
          src={image}
          alt={displayName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          fallbackSeed={layout._id}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {layout.isOwner && (
            <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
              Owner
            </span>
          )}
          {layout.isPartner && (
            <span className="rounded-full bg-sky-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
              Partner
            </span>
          )}
          {layout.status === 'inactive' && (
            <span className="rounded-full bg-gray-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
              Inactive
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/dashboard/layouts/${layout._id}`} className="group">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">{displayName}</h3>
          <p className="mt-1 text-sm text-gray-500">{displayLocation}</p>
        </Link>

        <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-lg bg-gray-50 px-2 py-1.5">
            <dt className="text-gray-400">Total</dt>
            <dd className="font-semibold text-gray-900">{total}</dd>
          </div>
          <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
            <dt className="text-emerald-600">Avail.</dt>
            <dd className="font-semibold text-emerald-700">{stats?.available ?? 0}</dd>
          </div>
          <div className="rounded-lg bg-amber-50 px-2 py-1.5">
            <dt className="text-amber-600">Booked</dt>
            <dd className="font-semibold text-amber-700">{stats?.booked ?? 0}</dd>
          </div>
          <div className="rounded-lg bg-red-50 px-2 py-1.5">
            <dt className="text-red-500">Sold</dt>
            <dd className="font-semibold text-red-700">{stats?.sold ?? 0}</dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-gray-400">
          Updated {updated} · {layout.partnerCount ?? 0} partner{(layout.partnerCount ?? 0) === 1 ? '' : 's'}
        </p>

        <Link
          href={`/dashboard/layouts/${layout._id}`}
          className="btn-primary mt-4 w-full text-center text-sm"
        >
          Open layout
        </Link>
      </div>
    </article>
  );
}
