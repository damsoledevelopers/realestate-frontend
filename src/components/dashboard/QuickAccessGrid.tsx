'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Grid3x3,
  Home,
  Landmark,
  Map,
  Trees,
} from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { DashboardSearchEntityType } from '@/lib/types';

const QUICK_ACCESS = [
  {
    type: 'layout' as DashboardSearchEntityType,
    labelKey: 'dashboard.startup.quick.layouts',
    href: '/dashboard/layouts',
    icon: Building2,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    type: 'plot' as DashboardSearchEntityType,
    labelKey: 'dashboard.startup.quick.plots',
    href: '/dashboard/plots',
    icon: Grid3x3,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    type: 'farm' as DashboardSearchEntityType,
    labelKey: 'dashboard.startup.quick.farms',
    href: '/dashboard/farms',
    icon: Trees,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    type: 'land' as DashboardSearchEntityType,
    labelKey: 'dashboard.startup.quick.lands',
    href: '/dashboard/lands',
    icon: Map,
    color: 'bg-yellow-50 text-yellow-700',
  },
  {
    type: 'row_house' as DashboardSearchEntityType,
    labelKey: 'dashboard.startup.quick.rowHouses',
    href: '/dashboard/pricing?entityType=row_house',
    icon: Home,
    color: 'bg-teal-50 text-teal-600',
  },
  {
    type: 'bungalow' as DashboardSearchEntityType,
    labelKey: 'dashboard.startup.quick.bungalows',
    href: '/dashboard/pricing?entityType=bungalow',
    icon: Landmark,
    color: 'bg-violet-50 text-violet-600',
  },
];

export default function QuickAccessGrid() {
  const { t } = useLocale();

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.startup.quickAccess')}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {QUICK_ACCESS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.type}
              href={item.href}
              className="group card transition hover:border-primary-200 hover:shadow-md"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{t(item.labelKey)}</p>
                <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
              </div>
              <p className="mt-1 text-sm text-gray-500">{t('dashboard.startup.quick.hint')}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
