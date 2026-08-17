'use client';

import StatCard from '@/components/dashboard/StatCard';
import StatGridLayout from '@/components/dashboard/StatGridLayout';

export interface LayoutPlotStats {
  total?: number;
  available?: number;
  booked?: number;
  sold?: number;
}

interface LayoutOverviewStatGridProps {
  stats?: LayoutPlotStats;
  loading?: boolean;
}

export default function LayoutOverviewStatGrid({ stats, loading }: LayoutOverviewStatGridProps) {
  return (
    <StatGridLayout loading={loading} skeletonCount={4}>
      <StatCard label="Total Plots" value={stats?.total ?? 0} icon={<span>📊</span>} change="In this layout" />
      <StatCard
        label="Available"
        value={stats?.available ?? 0}
        icon={<span>✅</span>}
        change="Ready to sell"
        changePositive
      />
      <StatCard label="Booked" value={stats?.booked ?? 0} icon={<span>📋</span>} change="In progress" />
      <StatCard label="Sold" value={stats?.sold ?? 0} icon={<span>🏷️</span>} change="Completed sales" />
    </StatGridLayout>
  );
}
