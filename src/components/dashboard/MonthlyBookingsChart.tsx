'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MonthlyBooking } from '@/lib/types';

interface MonthlyBookingsChartProps {
  data: MonthlyBooking[];
}

export default function MonthlyBookingsChart({ data }: MonthlyBookingsChartProps) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

  return (
    <div className="card h-full">
      <h2 className="text-lg font-semibold text-gray-900">Monthly Bookings</h2>
      <p className="mt-1 text-sm text-gray-500">Last 6 months</p>
      <div className="mt-6 h-64 w-full min-w-0">
        {!chartReady ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              formatter={(value) => [Number(value ?? 0), 'Bookings']}
            />
            <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
