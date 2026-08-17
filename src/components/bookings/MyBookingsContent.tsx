'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Booking } from '@/lib/types';
import StatusBadge from '@/components/bookings/StatusBadge';
import ConstructionStatusBadge from '@/components/plots/ConstructionStatusBadge';
import Pagination from '@/components/ui/Pagination';
import ResponsiveTable, { MobileDataCard, MobileDataRow } from '@/components/ui/ResponsiveTable';
import MessageScreen from '@/components/ui/MessageScreen';
import { downloadBookingReceipt } from '@/lib/downloadReceipt';
import { useLocale } from '@/context/LocaleContext';
import type { TranslationKey } from '@/lib/i18n';
import { getLayoutDisplayName, getLocalizedLocation } from '@/lib/localizedText';
import PaymentHistoryPanel from '@/components/payments/PaymentHistoryPanel';
import type { LayoutCustomer } from '@/lib/types';

interface MyBookingsResponse {
  bookings: Booking[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface MyBookingsContentProps {
  inDashboard?: boolean;
}

function BookingActions({
  booking,
  onViewPayments,
  t,
}: {
  booking: Booking;
  onViewPayments: () => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}) {
  const layoutId = booking.layout?._id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {layoutId && (
        <Link
          href={`/layouts/${layoutId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-primary-300 hover:text-primary-700"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          {t('myBookings.viewLayout')}
        </Link>
      )}
      {booking.status === 'approved' && (
        <>
          <button
            type="button"
            onClick={() => downloadBookingReceipt(booking)}
            className="text-xs font-medium text-primary-600 hover:underline"
          >
            {t('myBookings.downloadReceipt')}
          </button>
          <button
            type="button"
            onClick={onViewPayments}
            className="text-xs font-medium text-primary-600 hover:underline"
          >
            {t('payments.viewHistory')}
          </button>
        </>
      )}
      {booking.status === 'rejected' && booking.adminNote && (
        <p className="w-full text-xs text-red-600">
          {t('dashboard.bookings.reason', { note: booking.adminNote })}
        </p>
      )}
    </div>
  );
}

export default function MyBookingsContent({ inDashboard = false }: MyBookingsContentProps) {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [paymentCustomer, setPaymentCustomer] = useState<LayoutCustomer | null>(null);

  const fetchBookings = () => {
    if (!token) return;

    setLoading(true);
    setLoadError('');
    api
      .get<MyBookingsResponse>(`/bookings/my?page=${page}&limit=10`, token)
      .then((data) => {
        setBookings(data.bookings);
        setPagination(data.pagination);
      })
      .catch(() => setLoadError(t('myBookings.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const openPayments = (booking: Booking) => {
    setPaymentCustomer({
      bookingId: booking._id,
      bookingStatus: booking.status,
      plotId: booking.plot?._id || '',
      plotNumber: booking.plot?.plotNumber || '',
      plotStatus: booking.plot?.status || '',
      plotPrice: booking.plot?.price ?? null,
      customerName: booking.fullName,
      customerEmail: booking.email,
      customerPhone: booking.phone,
      message: booking.message || '',
      bookedAt: booking.createdAt,
    });
  };

  const containerClass = inDashboard
    ? 'min-w-0 max-w-5xl space-y-6'
    : 'mx-auto min-w-0 max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:py-10';

  return (
    <div className={containerClass}>
      <div className="page-header">
        <div>
          {!inDashboard && <h1 className="page-header-title">{t('nav.myBookings')}</h1>}
          <p className={inDashboard ? 'text-sm text-gray-500' : 'page-header-subtitle'}>
            {t('myBookings.subtitle')}
          </p>
        </div>
        <Link href="/layouts" className="btn-primary w-full text-center text-sm sm:w-auto">
          {t('myBookings.browseLayouts')}
        </Link>
      </div>

      {loading ? (
        <div className="card space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : loadError ? (
        <MessageScreen
          tone="error"
          title={t('myBookings.loadFailed')}
          description={t('common.retryHint')}
          action={
            <button type="button" onClick={fetchBookings} className="btn-primary text-sm">
              {t('common.retry')}
            </button>
          }
        />
      ) : bookings.length === 0 ? (
        <MessageScreen
          tone="neutral"
          title={t('myBookings.emptyTitle')}
          description={t('myBookings.emptyHint')}
          action={
            <Link href="/layouts" className="btn-primary inline-flex text-sm">
              {t('myBookings.browseLayouts')}
            </Link>
          }
        />
      ) : (
        <div className="card">
          <ResponsiveTable
            tableClassName="table-data"
            mobile={
              <>
                {bookings.map((booking) => (
                  <MobileDataCard key={booking._id}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Plot {booking.plot?.plotNumber || '—'}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">
                          {booking.layout ? getLayoutDisplayName(booking.layout, locale) : '—'}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <MobileDataRow label={t('dashboard.bookings.colConstruction')}>
                      <ConstructionStatusBadge status={booking.plot?.constructionStatus} showPattern />
                    </MobileDataRow>
                    <MobileDataRow label={t('dashboard.bookings.colDate')}>
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </MobileDataRow>
                    <MobileDataRow label={t('myBookings.colPrice')}>
                      ₹{booking.plot?.price?.toLocaleString() || '—'}
                    </MobileDataRow>
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <BookingActions
                        booking={booking}
                        onViewPayments={() => openPayments(booking)}
                        t={t}
                      />
                    </div>
                  </MobileDataCard>
                ))}
              </>
            }
          >
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('dashboard.bookings.colPlot')}</th>
                <th className="px-4 py-3">{t('dashboard.bookings.colLayout')}</th>
                <th className="px-4 py-3">{t('dashboard.bookings.colConstruction')}</th>
                <th className="px-4 py-3">{t('dashboard.bookings.colDate')}</th>
                <th className="px-4 py-3">{t('dashboard.bookings.colStatus')}</th>
                <th className="px-4 py-3">{t('dashboard.bookings.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr key={booking._id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-medium">{booking.plot?.plotNumber}</p>
                    <p className="text-xs text-gray-500">₹{booking.plot?.price?.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{booking.layout ? getLayoutDisplayName(booking.layout, locale) : '—'}</p>
                    <p className="text-xs text-gray-500">
                      {booking.layout
                        ? getLocalizedLocation(booking.layout.location, locale, booking.layout.locationMr)
                        : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <ConstructionStatusBadge status={booking.plot?.constructionStatus} showPattern />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <BookingActions
                      booking={booking}
                      onViewPayments={() => openPayments(booking)}
                      t={t}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </div>
      )}

      {paymentCustomer && (
        <PaymentHistoryPanel
          customer={paymentCustomer}
          layoutName={
            bookings.find((b) => b._id === paymentCustomer.bookingId)?.layout
              ? getLayoutDisplayName(
                  bookings.find((b) => b._id === paymentCustomer.bookingId)!.layout!,
                  locale
                )
              : '—'
          }
          canManage={false}
          onClose={() => setPaymentCustomer(null)}
        />
      )}
    </div>
  );
}
