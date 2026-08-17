'use client';

import { RecentBooking } from '@/lib/types';
import { BOOKING_STATUS } from '@/constants/css';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedLayoutName } from '@/lib/localizedText';

interface RecentBookingsTableProps {
  bookings: RecentBooking[];
}

export default function RecentBookingsTable({ bookings }: RecentBookingsTableProps) {
  const { locale } = useLocale();

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No bookings yet</p>
      ) : (
        <div className="mt-4 table-wrap">
          <table className="table-data">
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">Plot</th>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Layout</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr key={booking.id} className="text-gray-700">
                  <td className="px-3 py-3 font-medium">{booking.plotNumber}</td>
                  <td className="px-3 py-3">{booking.userName}</td>
                  <td className="px-3 py-3 text-gray-500">
                    {getLocalizedLayoutName(booking.layoutName, locale)}
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {new Date(booking.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
