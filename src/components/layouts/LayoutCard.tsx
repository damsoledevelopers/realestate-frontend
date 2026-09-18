'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/lib/types';
import LayoutImage from '@/components/layouts/LayoutImage';
import { getLayoutImages, getHeroImage } from '@/lib/layoutImages';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';

interface LayoutCardProps {
  layout: Layout;
}

export default function LayoutCard({ layout }: LayoutCardProps) {
  const { t, locale } = useLocale();
  const [imageLoaded, setImageLoaded] = useState(false);
  const localizedLocation = getLocalizedLocation(layout.location, locale, layout.locationMr);
  const localizedName = getLayoutDisplayName(layout, locale);
  const images = getLayoutImages(layout);
  const primaryImage = getHeroImage(layout);
  const total = layout.plotStats?.total ?? layout.totalPlots ?? 0;
  const available = layout.plotStats?.available ?? layout.availablePlots ?? 0;
  const booked = layout.plotStats?.booked ?? 0;
  const sold = layout.plotStats?.sold ?? 0;
  const landCount = layout.linkedPropertyCounts?.land ?? 0;
  const farmCount = layout.linkedPropertyCounts?.farm ?? 0;

  return (
    <article className="group relative flex h-full min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-900/10">
      {/* Top Media & Image Badge Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {/* Animated Skeleton Overlay */}
        {!imageLoaded && (
          <div
            className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]"
            aria-hidden="true"
          />
        )}

        {/* Hover Zoom Wrapper */}
        <div className="h-full w-full transform transition-transform duration-500 ease-out group-hover:scale-105">
          <LayoutImage
            src={primaryImage}
            alt={localizedName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-all duration-500 ease-in-out ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-90 scale-102'
            }`}
            fallbackSeed={layout._id}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Gradient Overlay for Top & Bottom Contrast */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-black/25 opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

        {/* Floating Status & Gallery Badges */}
        <div className="absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2">
          {layout.status === 'inactive' ? (
            <span className="inline-flex items-center rounded-full bg-gray-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 group-hover:scale-105 shadow-sm">
              {t('layouts.inactive')}
            </span>
          ) : (
            <div />
          )}

          {images.length > 1 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-all duration-300 group-hover:scale-105 shadow-sm">
              <svg className="h-3.5 w-3.5 text-white/80 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              +{images.length - 1} {t('layouts.photos')}
            </span>
          )}
        </div>
      </div>

      {/* Card Details Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Title */}
          <h3 className="line-clamp-1 text-lg font-bold text-gray-900 transition-colors duration-200 group-hover:text-primary-700">
            {localizedName}
          </h3>

          {/* Location Badge */}
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500 line-clamp-1">
            <svg
              className="h-4 w-4 shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{localizedLocation}</span>
          </p>

          {/* Availability Tag */}
          <div className="mt-3.5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-600/15 transition-all duration-200 group-hover:bg-primary-100 group-hover:shadow-sm">
              {available} / {total} {t('layouts.plotsAvailable')}
            </span>
            {landCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-600/15">
                {landCount} {t('property.type.land')}
              </span>
            ) : null}
            {farmCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800 ring-1 ring-inset ring-lime-600/15">
                {farmCount} {t('property.type.farm')}
              </span>
            ) : null}
            {booked > 0 ? (
              <span className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/15">
                {booked} {t('common.booked')}
              </span>
            ) : null}
            {sold > 0 ? (
              <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/15">
                {sold} {t('common.sold')}
              </span>
            ) : null}
          </div>
        </div>

        {/* Pricing & CTA Divider Area */}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t('layouts.startingFrom')}
            </span>
            <span className="text-base font-extrabold tracking-tight text-gray-900 transition-colors duration-200 group-hover:text-primary-700">
              {layout.startingPrice != null
                ? `₹${layout.startingPrice.toLocaleString()}`
                : t('layouts.priceOnRequest')}
            </span>
          </div>

          {/* Action Link Button */}
          <Link
            href={`/layouts/${layout._id}`}
            className="btn-primary mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-center text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.98]"
          >
            <span>{t('layouts.viewLayout')}</span>
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}