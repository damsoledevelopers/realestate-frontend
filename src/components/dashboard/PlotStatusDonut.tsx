'use client';

import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';

interface PlotStatusDonutProps {
  available: number;
  booked: number;
  sold: number;
  reserved?: number;
}

export default function PlotStatusDonut({
  available,
  booked,
  sold,
  reserved = 0,
}: PlotStatusDonutProps) {
  const { getDefinition, getChartColor } = usePropertyStatusConfig();
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

  const data = [
    { name: getDefinition('available').label, value: available, status: 'available' },
    { name: getDefinition('booked').label, value: booked, status: 'booked' },
    { name: getDefinition('sold').label, value: sold, status: 'sold' },
    { name: getDefinition('reserved').label, value: reserved, status: 'reserved' },
  ].filter((item) => item.value > 0);

  const total = available + booked + sold + reserved;

  return (
    <div className="card h-full">
      <h2 className="text-lg font-semibold text-gray-900">Plot Status</h2>
      <p className="mt-1 text-sm text-gray-500">{total} total plots</p>
      <div className="mt-4 h-64 w-full min-w-0">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No plot data yet
          </div>
        ) : !chartReady ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((item) => (
                  <Cell key={item.status} fill={getChartColor(item.status)} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [Number(value ?? 0), 'Plots']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
