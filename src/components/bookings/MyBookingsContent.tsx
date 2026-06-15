'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Booking } from '@/lib/types';
import StatusBadge from '@/components/bookings/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import { downloadBookingReceipt } from '@/lib/downloadReceipt';

interface MyBookingsResponse {
  bookings: Booking[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface MyBookingsContentProps {
  inDashboard?: boolean;
}

export default function MyBookingsContent({ inDashboard = false }: MyBookingsContentProps) {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    api
      .get<MyBookingsResponse>(`/bookings/my?page=${page}&limit=10`, token)
      .then((data) => {
        setBookings(data.bookings);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page]);

  return (
    <div className={inDashboard ? 'max-w-5xl' : 'mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8'}>
      {!inDashboard && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="mt-2 text-gray-500">Track your plot booking requests</p>
          </div>
          <Link href="/layouts" className="btn-primary text-sm">
            Browse Layouts
          </Link>
        </div>
      )}

      {inDashboard && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-500">Track your plot booking requests</p>
          <Link href="/layouts" className="btn-primary text-sm">
            Browse Layouts
          </Link>
        </div>
      )}

      <div className={`card overflow-x-auto ${inDashboard ? '' : 'mt-8'}`}>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-100" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400">No bookings yet.</p>
            <Link href="/layouts" className="btn-primary mt-4 inline-flex text-sm">
              Find a Plot
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Plot #</th>
                  <th className="px-4 py-3">Layout</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => (
                  <tr key={b._id} className="bg-white">
                    <td className="px-4 py-3 font-medium">{b.plot?.plotNumber}</td>
                    <td className="px-4 py-3">
                      <p>{b.layout?.name}</p>
                      <p className="text-xs text-gray-500">{b.layout?.location}</p>
                    </td>
                    <td className="px-4 py-3">₹{b.plot?.price?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      {b.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => downloadBookingReceipt(b)}
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          Download Receipt
                        </button>
                      )}
                      {b.status === 'rejected' && b.adminNote && (
                        <p className="max-w-xs text-xs text-red-600">Reason: {b.adminNote}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
