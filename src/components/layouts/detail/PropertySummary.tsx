'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LayoutImage from '@/components/layouts/LayoutImage';
import { Layout } from '@/lib/types';
import CountUp from '@/components/layouts/detail/CountUp';
import { formatPrice, getPlotCounts } from '@/lib/layoutStats';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';

const TAG_KEYS = [
  'detail.tag.rera',
  'detail.tag.gated',
  'detail.tag.loan',
  'detail.tag.register',
] as const;

interface PropertySummaryProps {
  layout: Layout;
  featuredImage: string;
  onBookVisit: () => void;
  onDownloadBrochure: () => void;
  onContactSales: () => void;
}

export default function PropertySummary({
  layout,
  featuredImage,
  onBookVisit,
  onDownloadBrochure,
  onContactSales,
}: PropertySummaryProps) {
  const { t, locale } = useLocale();
  const { total, available, sold } = getPlotCounts(layout, layout.plots ?? []);
  const localizedLocation = getLocalizedLocation(layout.location, locale, layout.locationMr);
  const localizedName = getLayoutDisplayName(layout, locale);
  const description =
    layout.description?.trim() ||
    t('detail.defaultDescription', { location: localizedLocation });

  return (
    <section className="border-b border-gray-200/80 bg-white">
      <div className="section-container py-6 sm:py-8">
        {/* Back Link with Micro Arrow Slide & Glow Animation */}
        <Link
          href="/layouts"
          className="group mb-5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 transition-all duration-300 hover:bg-gray-50 hover:text-primary-700"
        >
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1.5 text-gray-400 group-hover:text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{t('detail.allLayouts')}</span>
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10 xl:grid-cols-[1fr_420px]">
          {/* Main Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl transition-colors duration-300 hover:text-primary-900">
              {localizedName}
            </h1>

            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-600 sm:text-base group cursor-pointer">
              <LocationIcon />
              <span className="transition-colors duration-200 group-hover:text-primary-700">{localizedLocation}</span>
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
              {description}
            </p>

            {/* Feature Badges with Dynamic Scale & Shadow */}
            <div className="mt-4 flex flex-wrap gap-2">
              {TAG_KEYS.map((key) => (
                <span
                  key={key}
                  className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 ring-1 ring-primary-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-100 hover:scale-105 hover:shadow-md hover:shadow-primary-600/10"
                >
                  {t(key)}
                </span>
              ))}
            </div>

            {/* Stat Cards Grid with Enhanced Lift & Glow Effects */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label={t('detail.startingPrice')}
                value={
                  layout.startingPrice != null ? (
                    formatPrice(layout.startingPrice)
                  ) : (
                    t('common.onRequest')
                  )
                }
                accent
              />
              <StatCard
                label={t('common.available')}
                value={<CountUp end={available} className="text-xl font-bold text-gray-900 sm:text-2xl" />}
              />
              <StatCard
                label={t('detail.totalPlots')}
                value={<CountUp end={total} className="text-xl font-bold text-gray-900 sm:text-2xl" />}
              />
              <StatCard
                label={t('common.sold')}
                value={<CountUp end={sold} className="text-xl font-bold text-gray-900 sm:text-2xl" />}
                muted={sold === 0}
              />
            </div>
          </motion.div>

          {/* Sticky Media Card & Book Site Visit Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <div className="group overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-3.5 shadow-premium ring-1 ring-gray-100 backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.015] hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-900/15">
              {/* Media Container with Image Zoom & Ambient Vignette */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-primary-900">
                <div className="h-full w-full transform transition-transform duration-700 ease-out group-hover:scale-110">
                  <LayoutImage
                    src={featuredImage}
                    alt={localizedName}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover transition-opacity duration-300"
                    fallbackSeed={layout._id}
                  />
                </div>

                {/* Soft Vignette Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-70 transition-opacity duration-500 group-hover:opacity-40" />

                {layout.status === 'active' && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {t('common.available')}
                  </span>
                )}
              </div>

              {/* Action Buttons with Micro-Interactions & Hover Glow Shadows */}
              <div className="mt-4 space-y-2.5">
                {/* Book Site Visit Button */}
                <button
                  type="button"
                  onClick={onBookVisit}
                  className="summary-cta-primary group/btn relative overflow-hidden w-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-600/35 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>{t('detail.bookSiteVisit')}</span>
                    <svg
                      className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </button>

                {/* Download Brochure Button */}
                <button
                  type="button"
                  onClick={onDownloadBrochure}
                  className="summary-cta-secondary w-full transform transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/80 active:scale-[0.98]"
                >
                  {t('detail.downloadBrochure')}
                </button>

                {/* Contact Sales Button */}
                <button
                  type="button"
                  onClick={onContactSales}
                  className="summary-cta-outline w-full transform transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md active:scale-[0.98]"
                >
                  {t('detail.contactSales')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`group/stat rounded-xl border p-3.5 sm:p-4 transition-all duration-300 ${
        muted
          ? 'border-gray-100 bg-gray-50'
          : 'border-gray-100 bg-white shadow-sm hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/10'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs transition-colors group-hover/stat:text-primary-700">
        {label}
      </p>
      <p
        className={`mt-1 truncate transition-transform duration-300 group-hover/stat:scale-[1.02] ${
          accent ? 'text-lg font-bold text-primary-800 sm:text-xl' : 'text-xl font-bold text-gray-900 sm:text-2xl'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-primary-600 transition-transform duration-300 group-hover:scale-125" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}