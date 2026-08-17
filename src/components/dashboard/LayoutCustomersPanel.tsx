'use client';

import { useState } from 'react';
import { LayoutCustomer } from '@/lib/types';
import { getGoogleMapsExternalUrl } from '@/lib/googleMaps';
import ShareLocationButton from '@/components/property/ShareLocationButton';
import StatusBadge from '@/components/bookings/StatusBadge';
import PaymentHistoryPanel from '@/components/payments/PaymentHistoryPanel';
import EstimateFormModal from '@/components/estimates/EstimateFormModal';
import { useLocale } from '@/context/LocaleContext';

interface LayoutCustomersPanelProps {
  customers: LayoutCustomer[];
  layoutId: string;
  layoutName: string;
  latitude?: number | null;
  longitude?: number | null;
  canManagePayments?: boolean;
  canManageEstimates?: boolean;
}

export default function LayoutCustomersPanel({
  customers,
  layoutId,
  layoutName,
  latitude,
  longitude,
  canManagePayments = false,
  canManageEstimates = false,
}: LayoutCustomersPanelProps) {
  const { t } = useLocale();
  const [activeCustomer, setActiveCustomer] = useState<LayoutCustomer | null>(null);
  const [estimateCustomer, setEstimateCustomer] = useState<LayoutCustomer | null>(null);
  const mapsUrl =
    latitude != null && longitude != null
      ? getGoogleMapsExternalUrl(latitude, longitude)
      : null;

  if (!customers.length) {
    return (
      <div className="card py-12 text-center text-sm text-gray-400">
        No active bookings or booked-plot customers for this layout yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mapsUrl && (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">Share the layout location with customers</p>
          <div className="flex flex-wrap gap-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
              Open Google Maps
            </a>
            <ShareLocationButton latitude={latitude!} longitude={longitude!} title={layoutName} />
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="table-data">
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Plot</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Booking</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.bookingId}>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{customer.customerName}</p>
                    <p className="text-xs text-gray-500">{customer.customerEmail}</p>
                    <p className="text-xs text-gray-500">{customer.customerPhone}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">Plot {customer.plotNumber}</p>
                    <p className="text-xs capitalize text-gray-500">{customer.plotStatus}</p>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {customer.plotPrice != null ? `₹${customer.plotPrice.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={customer.bookingStatus} />
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(customer.bookedAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveCustomer(customer)}
                        className="text-left text-sm font-medium text-primary-600 hover:underline"
                      >
                        {t('payments.viewHistory')}
                      </button>
                      {canManageEstimates && (
                        <button
                          type="button"
                          onClick={() => setEstimateCustomer(customer)}
                          className="text-left text-sm font-medium text-primary-600 hover:underline"
                        >
                          {t('estimates.create')}
                        </button>
                      )}
                      <a
                        href={`/dashboard/users?search=${encodeURIComponent(customer.customerPhone)}`}
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        {t('customers.viewProfile')}
                      </a>
                      <a
                        href={`tel:${customer.customerPhone}`}
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        Call customer
                      </a>
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          Share location
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeCustomer && (
        <PaymentHistoryPanel
          customer={activeCustomer}
          layoutName={layoutName}
          canManage={canManagePayments}
          onClose={() => setActiveCustomer(null)}
        />
      )}

      {estimateCustomer && (
        <EstimateFormModal
          layoutId={layoutId}
          layoutName={layoutName}
          customer={estimateCustomer}
          onClose={() => setEstimateCustomer(null)}
          onSaved={() => setEstimateCustomer(null)}
        />
      )}
    </div>
  );
}
