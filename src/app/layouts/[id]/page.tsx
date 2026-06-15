'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Layout, Plot } from '@/lib/types';
import PlotMap from '@/components/PlotMap';
import LayoutLocationMap from '@/components/maps/LayoutLocationMap';
import AddressFallback from '@/components/maps/AddressFallback';
import BookingModal from '@/components/BookingModal';
import LayoutDetailHero from '@/components/layouts/LayoutDetailHero';
import LayoutImageGallery from '@/components/layouts/LayoutImageGallery';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/lib/notify';
import { PLOT_STATUS } from '@/constants/css';
import { hasValidCoordinates } from '@/lib/googleMaps';
import { getLayoutImages, getPrimaryLayoutImage } from '@/lib/layoutImages';

export default function LayoutDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [highlightPlotId, setHighlightPlotId] = useState<string | null>(null);

  const fetchData = () => {
    api
      .get<Layout>(`/layouts/${id}`)
      .then((data) => {
        setLayout(data);
        setPlots(data.plots || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleBookNow = (plot: Plot) => {
    if (!user) {
      notify.error('Please sign in to book a plot');
      router.push('/login');
      return;
    }
    setSelectedPlot(plot);
    setShowBooking(true);
  };

  if (!layout) {
    return (
      <div className="min-h-[50vh] bg-gray-50">
        <div className="animate-pulse bg-gray-200 py-32" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-80 rounded-xl bg-gray-200" />
            <div className="h-80 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const layoutImages = getLayoutImages(layout);
  const mapImage = getPrimaryLayoutImage(layout);
  const availableCount =
    layout.plotStats?.available ?? plots.filter((p) => p.status === 'available').length;

  const scrollToLocationMap = () => {
    const el = document.getElementById('layout-location-map');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bg-primary-50');
    window.setTimeout(() => {
      el.classList.remove('bg-primary-50');
    }, 1500);
  };

  const handleViewMap = (plot: Plot) => {
    scrollToLocationMap();
    setHighlightPlotId(plot._id);
    window.setTimeout(() => setHighlightPlotId(null), 4000);
  };

  return (
    <div className="bg-gray-50">
      <LayoutDetailHero
        layout={layout}
        heroImage={layoutImages[0]}
        galleryImages={layoutImages}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {layoutImages.length > 1 && (
          <div className="mb-10">
            <LayoutImageGallery images={layoutImages} skipFirst />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          <section className="card lg:col-span-3">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Interactive Plot Map</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Click a plot marker to view details and book
                </p>
              </div>
              {availableCount > 0 && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {availableCount} available now
                </span>
              )}
            </div>
            <div className="mt-5">
              <PlotMap
                layoutId={layout._id}
                layoutImage={mapImage}
                layoutName={layout.name}
                layoutLocation={layout.location}
                layoutCoordinates={layout.coordinates}
                plots={plots}
                highlightPlotId={highlightPlotId}
                onBookNow={handleBookNow}
                onViewMap={handleViewMap}
              />
            </div>
          </section>

          <aside className="space-y-6 lg:col-span-2">
            <section id="layout-location-map" className="card scroll-mt-24 transition-colors duration-300">
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              <p className="mt-1 text-sm text-gray-500">{layout.location}</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                {hasValidCoordinates(layout.coordinates?.lat, layout.coordinates?.lng) ? (
                  <LayoutLocationMap
                    lat={layout.coordinates!.lat as number}
                    lng={layout.coordinates!.lng as number}
                    layoutName={layout.name}
                    address={layout.location}
                    layoutId={layout._id}
                  />
                ) : (
                  <AddressFallback address={layout.location} layoutName={layout.name} />
                )}
              </div>
            </section>

            <section className="card">
              <h3 className="font-semibold text-gray-900">Quick Summary</h3>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <SummaryItem
                  label="Total plots"
                  value={layout.plotStats?.total ?? layout.totalPlots ?? plots.length}
                />
                <SummaryItem label="Available" value={availableCount} valueClass="text-emerald-600" />
                <SummaryItem
                  label="Booked"
                  value={layout.plotStats?.booked ?? 0}
                  valueClass="text-amber-600"
                />
                <SummaryItem
                  label="Sold"
                  value={layout.plotStats?.sold ?? 0}
                  valueClass="text-red-600"
                />
              </dl>
              {layout.startingPrice != null && (
                <div className="mt-4 rounded-lg bg-primary-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
                    Starting price
                  </p>
                  <p className="mt-1 text-xl font-bold text-primary-900">
                    ₹{layout.startingPrice.toLocaleString()}
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>

        <section className="card mt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Plots</h2>
              <p className="mt-1 text-sm text-gray-500">
                Compare size, facing, price, and availability
              </p>
            </div>
          </div>

          {plots.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No plots listed for this layout yet.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Plot #</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Facing</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {plots.map((plot) => (
                      <tr key={plot._id} className="bg-white transition hover:bg-gray-50/80">
                        <td className="px-4 py-3.5 font-medium text-gray-900">{plot.plotNumber}</td>
                        <td className="px-4 py-3.5 text-gray-600">{plot.size}</td>
                        <td className="px-4 py-3.5 text-gray-600">{plot.facing || '—'}</td>
                        <td className="px-4 py-3.5 font-medium text-gray-900">
                          ₹{plot.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PLOT_STATUS[plot.status].badge}`}
                          >
                            {plot.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {plot.status === 'available' ? (
                            <button
                              type="button"
                              onClick={() => handleBookNow(plot)}
                              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
                            >
                              Book now
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {plots.map((plot) => (
                  <div
                    key={plot._id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">Plot {plot.plotNumber}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {plot.size}
                          {plot.facing ? ` · ${plot.facing}` : ''}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PLOT_STATUS[plot.status].badge}`}
                      >
                        {plot.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">₹{plot.price.toLocaleString()}</p>
                      {plot.status === 'available' && (
                        <button
                          type="button"
                          onClick={() => handleBookNow(plot)}
                          className="btn-primary text-xs"
                        >
                          Book now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {showBooking && selectedPlot && (
        <BookingModal
          plot={selectedPlot}
          layoutName={layout.name}
          layoutLocation={layout.location}
          onClose={() => {
            setShowBooking(false);
            setSelectedPlot(null);
          }}
          onSuccess={(plotId) => {
            setPlots((prev) =>
              prev.map((p) => (p._id === plotId ? { ...p, status: 'booked' } : p))
            );
          }}
        />
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</dd>
    </div>
  );
}
