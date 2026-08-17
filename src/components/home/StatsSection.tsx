'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PublicStats } from '@/lib/types';
import { useCountUp, useInView } from '@/hooks/useCountUp';
import { useLocale } from '@/context/LocaleContext';
import { TranslationKey } from '@/lib/i18n';

const STAT_ITEMS: { key: keyof PublicStats; labelKey: TranslationKey; suffix: string }[] = [
  { key: 'totalLayouts', labelKey: 'home.stats.activeLayouts', suffix: '+' },
  { key: 'totalPlots', labelKey: 'home.stats.totalPlots', suffix: '+' },
  { key: 'availablePlots', labelKey: 'home.stats.plotsAvailable', suffix: '+' },
  { key: 'happyCustomers', labelKey: 'home.stats.happyCustomers', suffix: '+' },
];

function StatItem({
  label,
  value,
  suffix,
  animate,
}: {
  label: string;
  value: number;
  suffix: string;
  animate: boolean;
}) {
  const count = useCountUp(value, 1600, animate);

  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-primary-100">{label}</p>
    </div>
  );
}

export default function StatsSection() {
  const { t } = useLocale();
  const { ref, inView } = useInView(0.15);
  const [stats, setStats] = useState<PublicStats>({
    totalLayouts: 0,
    totalPlots: 0,
    availablePlots: 0,
    happyCustomers: 0,
    completedBookings: 0,
  });

  useEffect(() => {
    api
      .get<PublicStats>('/public/stats')
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <section ref={ref} className="w-full overflow-x-hidden bg-primary-800 py-14">
      <div className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-2 gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STAT_ITEMS.map((item) => (
          <StatItem
            key={item.key}
            label={t(item.labelKey)}
            value={stats[item.key]}
            suffix={item.suffix}
            animate={inView}
          />
        ))}
      </div>
    </section>
  );
}
