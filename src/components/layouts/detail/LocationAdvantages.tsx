'use client';

import { motion } from 'framer-motion';
import PropertyGisDetails from '@/components/property/PropertyGisDetails';
import ViewOnGoogleMapsButton from '@/components/property/ViewOnGoogleMapsButton';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';
import { Layout } from '@/lib/types';

interface LocationAdvantagesProps {
  layout: Layout;
}

const LANDMARK_KEYS = [
  { key: 'detail.landmark.schools', distance: '2.5 km', icon: SchoolIcon },
  { key: 'detail.landmark.hospitals', distance: '4 km', icon: HospitalIcon },
  { key: 'detail.landmark.highway', distance: '1.2 km', icon: HighwayIcon },
  { key: 'detail.landmark.railway', distance: '8 km', icon: TrainIcon },
  { key: 'detail.landmark.bus', distance: '3 km', icon: BusIcon },
  { key: 'detail.landmark.market', distance: '1.8 km', icon: MarketIcon },
] as const;

export default function LocationAdvantages({ layout }: LocationAdvantagesProps) {
  const { t, locale } = useLocale();
  const startingPrice = layout.startingPrice ?? 0;
  const localizedLocation = getLocalizedLocation(layout.location, locale, layout.locationMr);
  const localizedName = getLayoutDisplayName(layout, locale);

  return (
    <AnimatedSection id="layout-location-map" className="section-container py-8 lg:py-10">
      <SectionHeading
        eyebrow={t('detail.location.eyebrow')}
        title={t('detail.location.title')}
        subtitle={t('detail.location.subtitle')}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left GIS Card with Floating Depth & Elevation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-premium ring-1 ring-gray-100 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-900/10 sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600 transition-colors duration-200 group-hover:text-primary-700">
            {t('detail.location.layout')}
          </p>
          <h3 className="mt-1 text-xl font-bold text-gray-900 transition-colors duration-200 group-hover:text-primary-950">
            {localizedName}
          </h3>
          <p className="mt-1 text-sm font-medium text-gray-500">{localizedLocation}</p>

          <div className="mt-5 overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-[1.005]">
            <PropertyGisDetails
              property={{
                propertyName: layout.propertyName || localizedName,
                propertyNumber: layout.propertyNumber || layout._id.slice(-6).toUpperCase(),
                propertyType: layout.propertyType || 'layout',
                area: layout.area?.display || t('property.plotsCount', { count: layout.totalPlots }),
                price: startingPrice > 0 ? startingPrice : t('common.onRequest'),
                status: layout.status,
                statusKey: layout.status,
                latitude: layout.latitude ?? layout.mapCoordinates?.lat,
                longitude: layout.longitude ?? layout.mapCoordinates?.lng,
                address: localizedLocation,
              }}
            />
          </div>

          <div className="mt-6">
            <ViewOnGoogleMapsButton
              latitude={layout.latitude ?? layout.mapCoordinates?.lat}
              longitude={layout.longitude ?? layout.mapCoordinates?.lng}
            />
          </div>
        </motion.div>

        {/* Right Landmark Timeline with Micro-Interactions */}
        <div className="relative">
          <div className="absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-primary-500 via-primary-300 to-transparent" />
          <div className="space-y-6">
            {LANDMARK_KEYS.map((landmark, index) => {
              const Icon = landmark.icon;
              return (
                <motion.div
                  key={landmark.key}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="group relative flex items-center gap-4 pl-12"
                >
                  {/* Glowing Node Marker */}
                  <div className="absolute left-3 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary-500 ring-4 ring-white shadow-sm transition-transform duration-300 group-hover:scale-125 group-hover:bg-primary-600 group-hover:ring-primary-100">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  </div>

                  {/* Item Container with Lift & Glow Shadow */}
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-900/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white">
                        <Icon />
                      </div>
                      <p className="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-primary-900">
                        {t(landmark.key)}
                      </p>
                    </div>

                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 transition-all duration-300 group-hover:bg-primary-100 group-hover:scale-105">
                      {landmark.distance}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

function SchoolIcon() {
  return (
    <svg className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function HighwayIcon() {
  return (
    <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}