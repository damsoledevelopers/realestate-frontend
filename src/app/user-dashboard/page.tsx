'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Booking } from '@/lib/types';
import StatusBadge from '@/components/bookings/StatusBadge';

interface MyBookingsResponse {
  bookings: Booking[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function UserDashboardPage() {
  const { user, token } = useAuth();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    api
      .get<MyBookingsResponse>('/bookings/my?page=1&limit=1', token)
      .then(async (summary) => {
        setTotal(summary.pagination.total);

        if (summary.pagination.total === 0) {
          setAllBookings([]);
          return;
        }

        const all = await api.get<MyBookingsResponse>(
          `/bookings/my?page=1&limit=${summary.pagination.total}`,
          token
        );
        setAllBookings(all.bookings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const recentBookings = allBookings.slice(0, 5);
  const pending = allBookings.filter((b) => b.status === 'pending').length;
  const approved = allBookings.filter((b) => b.status === 'approved').length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h2>
        <p className="mt-1 text-sm text-gray-500">Manage your plot bookings and account</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Total Bookings</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? '—' : total}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{loading ? '—' : pending}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Approved</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{loading ? '—' : approved}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
          <Link href="/user-dashboard/bookings" className="text-sm font-medium text-primary-600 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-gray-100" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">No bookings yet.</p>
            <Link href="/layouts" className="btn-primary mt-4 inline-flex text-sm">
              Browse Layouts
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">Plot</th>
                  <th className="px-3 py-3">Layout</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentBookings.map((b) => (
                  <tr key={b._id} className="text-gray-700">
                    <td className="px-3 py-3 font-medium">{b.plot?.plotNumber}</td>
                    <td className="px-3 py-3">{b.layout?.name}</td>
                    <td className="px-3 py-3 text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/layouts" className="btn-primary text-sm">
            Browse Layouts
          </Link>
          <Link href="/user-dashboard/bookings" className="btn-secondary text-sm">
            My Bookings
          </Link>
          <Link href="/user-dashboard/profile" className="btn-secondary text-sm">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
