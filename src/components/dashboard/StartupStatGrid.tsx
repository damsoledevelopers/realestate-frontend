'use client';

import {
  Building2,
  Grid3x3,
  Home,
  Landmark,
  Map,
  Trees,
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import StatGridLayout from '@/components/dashboard/StatGridLayout';
import { useLocale } from '@/context/LocaleContext';
import { StartupDashboardSummary } from '@/lib/types';

interface StartupStatGridProps {
  summary?: StartupDashboardSummary;
  loading?: boolean;
}

const STAT_CONFIG = [
  { key: 'totalLayouts' as const, labelKey: 'dashboard.startup.stats.layouts', icon: Building2 },
  { key: 'totalPlots' as const, labelKey: 'dashboard.startup.stats.plots', icon: Grid3x3 },
  { key: 'totalFarms' as const, labelKey: 'dashboard.startup.stats.farms', icon: Trees },
  { key: 'totalLands' as const, labelKey: 'dashboard.startup.stats.lands', icon: Map },
  { key: 'totalRowHouses' as const, labelKey: 'dashboard.startup.stats.rowHouses', icon: Home },
  { key: 'totalBungalows' as const, labelKey: 'dashboard.startup.stats.bungalows', icon: Landmark },
];

export default function StartupStatGrid({ summary, loading }: StartupStatGridProps) {
  const { t } = useLocale();

  return (
    <StatGridLayout loading={loading} skeletonCount={6}>
      {summary &&
        STAT_CONFIG.map(({ key, labelKey, icon: Icon }) => (
          <StatCard
            key={key}
            label={t(labelKey)}
            value={summary[key]}
            icon={<Icon className="h-5 w-5" />}
            change={t('dashboard.startup.stats.inScope')}
            changePositive={summary[key] > 0}
          />
        ))}
    </StatGridLayout>
  );
}
