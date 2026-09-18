'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ViewOnGoogleMapsButton from '@/components/property/ViewOnGoogleMapsButton';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';
import { Layout } from '@/lib/types';

interface LocationAdvantagesProps {
  layout: Layout;
}

/** Slim location strip — the interactive status map lives in the Site Plan section. */
export default function LocationAdvantages({ layout }: LocationAdvantagesProps) {
  const { t, locale } = useLocale();
  const localizedLocation = getLocalizedLocation(layout.location, locale, layout.locationMr);
  const localizedName = getLayoutDisplayName(layout, locale);

  return (
    <AnimatedSection id="layout-location-map" className="section-container py-8 lg:py-10">
      <SectionHeading
        eyebrow={t('detail.location.eyebrow')}
        title={t('detail.location.title')}
        subtitle={t('detail.location.subtitle')}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-premium ring-1 ring-gray-100 sm:p-6"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
          {t('detail.location.layout')}
        </p>
        <h3 className="mt-1 text-xl font-bold text-gray-900">{localizedName}</h3>
        {localizedLocation ? (
          <p className="mt-1 text-sm font-medium text-gray-500">{localizedLocation}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ViewOnGoogleMapsButton
            latitude={layout.latitude ?? layout.mapCoordinates?.lat}
            longitude={layout.longitude ?? layout.mapCoordinates?.lng}
            boundary={layout.boundaryPath}
            polylines={layout.mapLinesPath}
            layoutId={layout._id}
            hasMapGeoJson={layout.hasMapGeoJson || (layout.mapLineCount ?? 0) > 0}
          />
          <Link
            href={`/layouts/${layout._id}/map`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-primary-300 hover:text-primary-700"
          >
            {t('plotMap.viewOnMap')}
          </Link>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}
