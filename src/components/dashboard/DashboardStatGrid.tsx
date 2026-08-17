'use client';

import StatCard from '@/components/dashboard/StatCard';
import StatGridLayout from '@/components/dashboard/StatGridLayout';
import { DashboardStats } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

const LayoutsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PlotsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

function pct(part: number, total: number) {
  if (!total) return '0% of total';
  return `${((part / total) * 100).toFixed(0)}% of total`;
}

interface DashboardStatGridProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export default function DashboardStatGrid({ stats, loading }: DashboardStatGridProps) {
  const { isSuperAdmin } = useAuth();

  const cards = stats
    ? [
        { label: 'Total Layouts', value: stats.totalLayouts, icon: <LayoutsIcon />, change: 'Assigned to you' },
        { label: 'Total Plots', value: stats.totalPlots, icon: <PlotsIcon />, change: 'Across layouts' },
        {
          label: 'Available Plots',
          value: stats.availablePlots,
          icon: <PlotsIcon />,
          change: pct(stats.availablePlots, stats.totalPlots),
          positive: stats.availablePlots > 0,
        },
        {
          label: 'Booked Plots',
          value: stats.bookedPlots,
          icon: <PlotsIcon />,
          change: pct(stats.bookedPlots, stats.totalPlots),
          positive: false,
        },
        {
          label: 'Sold Plots',
          value: stats.soldPlots,
          icon: <PlotsIcon />,
          change: pct(stats.soldPlots, stats.totalPlots),
          positive: false,
        },
        {
          label: 'Reserved Plots',
          value: stats.reservedPlots,
          icon: <PlotsIcon />,
          change: pct(stats.reservedPlots, stats.totalPlots),
          positive: false,
        },
        {
          label: 'Under Construction',
          value: stats.underConstructionPlots,
          icon: <PlotsIcon />,
          change: pct(stats.underConstructionPlots, stats.totalPlots),
          positive: false,
        },
        {
          label: 'Construction Completed',
          value: stats.constructionCompletedPlots,
          icon: <PlotsIcon />,
          change: pct(stats.constructionCompletedPlots, stats.totalPlots),
          positive: stats.constructionCompletedPlots > 0,
        },
      ]
    : [];

  return (
    <StatGridLayout loading={loading} skeletonCount={8}>
      {stats && (
        <>
          {isSuperAdmin && (
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={<LayoutsIcon />}
              change={`${stats.recentUsers.length} recent`}
            />
          )}
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              change={card.change}
              changePositive={card.positive}
            />
          ))}
        </>
      )}
    </StatGridLayout>
  );
}
