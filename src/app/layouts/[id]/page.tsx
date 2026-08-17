'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Layout, Plot } from '@/lib/types';
import PlotMap from '@/components/PlotMap';
import BookingModal from '@/components/BookingModal';
import PropertySummary from '@/components/layouts/detail/PropertySummary';
import QuickHighlights from '@/components/layouts/detail/QuickHighlights';
import PremiumGallery from '@/components/layouts/detail/PremiumGallery';
import SitePhotoPublicGallery from '@/components/sitePhotos/SitePhotoPublicGallery';
import ExternalLinksPublicSection from '@/components/externalLinks/ExternalLinksPublicSection';
import AmenitiesSection from '@/components/layouts/detail/AmenitiesSection';
import LocationAdvantages from '@/components/layouts/detail/LocationAdvantages';
import TestimonialsSection from '@/components/layouts/detail/TestimonialsSection';
import LayoutInquiryForm from '@/components/layouts/detail/LayoutInquiryForm';
import PropertyContact from '@/components/property/PropertyContact';
import StickyMobileCTA from '@/components/layouts/detail/StickyMobileCTA';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';
import { notify } from '@/lib/notify';
import {
  getGalleryImages,
  getHeroImage,
  getPrimaryLayoutImage,
} from '@/lib/layoutImages';
import { getPlotCounts } from '@/lib/layoutStats';
import { useLayoutRealtime } from '@/hooks/useLayoutRealtime';
import type { PlotStatusRealtimeEvent } from '@/lib/socket';

export default function LayoutDetailPage() {
  const { id } = useParams();
  const layoutId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const fetchData = () => {
    api
      .get<Layout>(`/layouts/${layoutId}`)
      .then((data) => {
        setLayout(data);
        setPlots(data.plots || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (layoutId) fetchData();
  }, [layoutId]);

  const applyRealtimeStatus = useCallback((event: PlotStatusRealtimeEvent) => {
    setPlots((prev) =>
      prev.map((plot) =>
        plot._id === event.plotId
          ? {
              ...plot,
              status: event.status as Plot['status'],
              ...(event.constructionStatus
                ? {
                    constructionStatus:
                      event.constructionStatus as Plot['constructionStatus'],
                  }
                : {}),
            }
          : plot
      )
    );
    setSelectedPlot((prev) =>
      prev && prev._id === event.plotId
        ? {
            ...prev,
            status: event.status as Plot['status'],
            ...(event.constructionStatus
              ? {
                  constructionStatus:
                    event.constructionStatus as Plot['constructionStatus'],
                }
              : {}),
          }
        : prev
    );
  }, []);

  useLayoutRealtime({
    layoutId,
    enabled: Boolean(layoutId),
    onPlotStatus: applyRealtimeStatus,
  });

  const scrollToInquiry = () => {
    document.getElementById('layout-inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBookNow = (plot: Plot) => {
    if (!user) {
      notify.error(t('detail.signInToBook'));
      router.push('/login');
      return;
    }
    setSelectedPlot(plot);
    setShowBooking(true);
  };

  const handleDownloadBrochure = () => {
    notify.success(t('detail.brochureNoted'));
    scrollToInquiry();
  };

  const localizedLocation = layout
    ? getLocalizedLocation(layout.location, locale, layout.locationMr)
    : '';
  const localizedLayoutName = layout ? getLayoutDisplayName(layout, locale) : '';

  if (!layout) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="section-container animate-pulse py-6">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <div className="h-10 w-2/3 rounded-lg bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-16 rounded-lg bg-gray-200" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-gray-200" />
                ))}
              </div>
            </div>
            <div className="h-80 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = getGalleryImages(layout);
  const featuredImage = getHeroImage(layout);
  const mapImage = getPrimaryLayoutImage(layout);
  const { available: availableCount } = getPlotCounts(layout, plots);

  return (
    <div className="bg-surface pb-20 lg:pb-0">
      {/* 1. Property Summary */}
      <PropertySummary
        layout={layout}
        featuredImage={featuredImage}
        onBookVisit={scrollToInquiry}
        onContactSales={scrollToInquiry}
        onDownloadBrochure={handleDownloadBrochure}
      />

      {/* 2. Quick Highlights */}
      <QuickHighlights />

      {/* 3. Gallery */}
      <PremiumGallery images={galleryImages} layoutName={localizedLayoutName} />

      {/* 3b. Site photos with GPS */}
      <SitePhotoPublicGallery
        entityType="layout"
        entityId={layout._id}
        title={t('sitePhotos.publicTitle')}
      />

      <ExternalLinksPublicSection
        entityType="layout"
        entityId={layout._id}
        className="section-container py-6 lg:py-8"
      />

      {/* 4. Amenities */}
      <AmenitiesSection />

      {/* 5. Interactive Plot Map */}
      <AnimatedSection id="plot-map-section" className="section-container py-6 lg:py-8">
        <div className="premium-card !p-4 sm:!p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
                {t('detail.sitePlan.eyebrow')}
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                {t('detail.sitePlan.title')}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">{t('detail.sitePlan.subtitle')}</p>
            </div>
            {availableCount > 0 && (
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-700">
                {availableCount} {t('detail.sitePlan.available')}
              </span>
            )}
          </div>
          <PlotMap
            layoutId={layout._id}
            layoutImage={mapImage}
            layoutName={localizedLayoutName}
            layoutLocation={localizedLocation}
            layoutCoordinates={layout.coordinates}
            plots={plots}
            onBookNow={handleBookNow}
          />
        </div>
      </AnimatedSection>

      {/* 6. Location & Nearby Places */}
      <LocationAdvantages layout={layout} />

      {/* Contact Information */}
      <AnimatedSection className="section-container py-6 lg:py-8">
        <PropertyContact
          entityType="layout"
          entityId={layout._id}
          propertyName={localizedLayoutName}
        />
      </AnimatedSection>

      {/* 7. Testimonials */}
      <TestimonialsSection />

      {/* 8. Inquiry Form */}
      <LayoutInquiryForm layoutName={localizedLayoutName} />

      <StickyMobileCTA onBookVisit={scrollToInquiry} contactUser={layout.contactUser} />

      {showBooking && selectedPlot && (
        <BookingModal
          plot={selectedPlot}
          layoutName={localizedLayoutName}
          layoutLocation={localizedLocation}
          onClose={() => {
            setShowBooking(false);
            setSelectedPlot(null);
          }}
          onSuccess={(plotId) => {
            setPlots((prev) =>
              prev.map((p) => (p._id === plotId ? { ...p, status: 'booked' } : p))
            );
            setSelectedPlot((prev) =>
              prev && prev._id === plotId ? { ...prev, status: 'booked' } : prev
            );
          }}
        />
      )}
    </div>
  );
}
