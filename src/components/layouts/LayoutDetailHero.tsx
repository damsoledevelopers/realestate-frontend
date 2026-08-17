'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Layout } from '@/lib/types';
import CountUp from '@/components/layouts/detail/CountUp';
import { formatPrice, getPlotCounts } from '@/lib/layoutStats';
import { hasCustomLayoutImages } from '@/lib/layoutImages';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';

interface LayoutDetailHeroProps {
  layout: Layout;
  heroImage: string;
  onBookVisit: () => void;
  onContactSales: () => void;
  onDownloadBrochure: () => void;
}

export default function LayoutDetailHero({
  layout,
  heroImage,
  onBookVisit,
  onContactSales,
  onDownloadBrochure,
}: LayoutDetailHeroProps) {
  const { locale } = useLocale();
  const displayName = getLayoutDisplayName(layout, locale);
  const displayLocation = getLocalizedLocation(layout.location, locale, layout.locationMr);
  const { total, available, sold } = getPlotCounts(layout, layout.plots ?? []);
  const hasCustomImages = hasCustomLayoutImages(layout);
  const tagline =
    layout.description?.trim() ||
    `Premium plotted development in ${displayLocation} — your gateway to smart land investment.`;

  return (
    <section className="relative isolate overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={displayName}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
      </div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/75 to-gray-950/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-gray-950/50" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Content */}
      <div className="relative section-container">
        <div className="flex min-h-[min(78vh,720px)] flex-col justify-center py-10 lg:py-14">
          <Link
            href="/layouts"
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to layouts
          </Link>

          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Left — main copy */}
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {layout.status === 'active' ? (
                  <Badge variant="green">Now Selling</Badge>
                ) : (
                  <Badge variant="amber">Limited Availability</Badge>
                )}
                <Badge variant="gold">RERA Registered</Badge>
                {!hasCustomImages && <Badge variant="muted">Sample imagery</Badge>}
              </div>

              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                {displayName}
              </h1>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
                <LocationIcon />
                <span>{displayLocation}</span>
              </div>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                {tagline}
              </p>

              {/* Inline quick stats */}
              <div className="mt-7 flex flex-wrap gap-3">
                {layout.startingPrice != null && (
                  <QuickStat label="From" value={formatPrice(layout.startingPrice)} accent />
                )}
                <QuickStat
                  label="Available"
                  value={<CountUp end={available} className="font-bold text-white" />}
                />
                <QuickStat
                  label="Total Plots"
                  value={<CountUp end={total} className="font-bold text-white" />}
                />
                {sold > 0 && <QuickStat label="Sold" value={sold} />}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={onBookVisit} className="hero-cta-primary">
                  <CalendarIcon />
                  Book Site Visit
                </button>
                <button type="button" onClick={onDownloadBrochure} className="hero-cta-secondary">
                  <DownloadIcon />
                  Download Brochure
                </button>
                <button type="button" onClick={onContactSales} className="hero-cta-outline">
                  <PhoneIcon />
                  Contact Sales
                </button>
              </div>
            </motion.div>

            {/* Right — white investment card */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="bg-gradient-to-r from-primary-800 to-primary-700 px-6 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary-100">
                    Investment Snapshot
                  </p>
                  <p className="mt-1 text-sm text-white/80">Key figures at a glance</p>
                </div>

                <div className="space-y-0 p-6">
                  {layout.startingPrice != null && (
                    <SnapshotRow
                      label="Starting Price"
                      value={formatPrice(layout.startingPrice)}
                      highlight
                    />
                  )}
                  <SnapshotRow
                    label="Available Plots"
                    value={<CountUp end={available} className="text-2xl font-bold text-gray-900" />}
                  />
                  <SnapshotRow
                    label="Total Plots"
                    value={<CountUp end={total} className="text-2xl font-bold text-gray-900" />}
                  />
                  <SnapshotRow label="Possession" value="Ready" />
                  <SnapshotRow label="Approval" value="DTCP Approved" />
                </div>

                <div className="border-t border-gray-100 bg-surface px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ShieldIcon />
                      <span>Secure booking process</span>
                    </div>
                    <button
                      type="button"
                      onClick={onBookVisit}
                      className="shrink-0 rounded-lg bg-primary-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-700"
                    >
                      Enquire Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Fade into page body */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}

function Badge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: 'green' | 'amber' | 'gold' | 'muted';
}) {
  const styles = {
    green: 'bg-primary-500/20 text-primary-100 ring-primary-400/30',
    amber: 'bg-amber-500/20 text-amber-100 ring-amber-400/30',
    gold: 'bg-accent/20 text-amber-100 ring-accent/30',
    muted: 'bg-white/10 text-white/60 ring-white/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 backdrop-blur-sm ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function QuickStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p>
      <p className={`mt-0.5 text-lg ${accent ? 'font-bold text-accent' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className={highlight ? 'text-2xl font-bold text-primary-800' : 'text-lg font-bold text-gray-900'}>
        {value}
      </span>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
