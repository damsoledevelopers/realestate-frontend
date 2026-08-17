'use client';

import { ReactNode } from 'react';
import { StatCardSkeleton } from '@/components/dashboard/Skeletons';

interface StatGridLayoutProps {
  loading?: boolean;
  skeletonCount?: number;
  children?: ReactNode;
  showWhenEmpty?: boolean;
}

export default function StatGridLayout({
  loading = false,
  skeletonCount = 6,
  children,
  showWhenEmpty = false,
}: StatGridLayoutProps) {
  if (loading) {
    return (
      <div className="card-grid">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!showWhenEmpty && !children) return null;

  return <div className="card-grid">{children}</div>;
}
