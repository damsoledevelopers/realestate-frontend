'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Layout, Plot } from '@/lib/types';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';
import CountUp from '@/components/layouts/detail/CountUp';
import { formatPrice, getPlotCounts, getPlotSizeRange } from '@/lib/layoutStats';

interface PropertyOverviewProps {
  layout: Layout;
  plots: Plot[];
}

const OVERVIEW_ITEMS = [
  { key: 'status', label: 'Project Status', icon: StatusIcon },
  { key: 'available', label: 'Available Plots', icon: AvailableIcon },
  { key: 'sold', label: 'Sold Plots', icon: SoldIcon },
  { key: 'total', label: 'Total Plots', icon: TotalIcon },
  { key: 'price', label: 'Starting Price', icon: PriceIcon },
  { key: 'size', label: 'Plot Size Range', icon: SizeIcon },
  { key: 'possession', label: 'Possession Status', icon: PossessionIcon },
  { key: 'rera', label: 'RERA Status', icon: ReraIcon },
] as const;

export default function PropertyOverview({ layout, plots }: PropertyOverviewProps) {
  const { total, available, sold } = getPlotCounts(layout, plots);
  const sizeRange = getPlotSizeRange(plots);

  const values: Record<string, React.ReactNode> = {
    status: (
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary-500" />
        {layout.status === 'active' ? 'Active' : 'Inactive'}
      </span>
    ),
    available: <CountUp end={available} />,
    sold: <CountUp end={sold} />,
    total: <CountUp end={total} />,
    price: layout.startingPrice != null ? formatPrice(layout.startingPrice) : 'On Request',
    size: sizeRange,
    possession: 'Ready for Registration',
    rera: 'Registered',
  };

  return (
    <AnimatedSection className="section-container relative z-10 -mt-2 py-12 lg:py-16">
      <SectionHeading
        eyebrow="Overview"
        title="Property at a Glance"
        subtitle="Everything you need to know about this premium investment opportunity."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OVERVIEW_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="premium-card group"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700 transition group-hover:bg-primary-600 group-hover:text-white">
                <Icon />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
              <p className="mt-2 text-xl font-bold text-gray-900">{values[item.key]}</p>
            </motion.div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}

function StatusIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AvailableIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SoldIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TotalIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function PriceIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

function PossessionIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ReraIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
