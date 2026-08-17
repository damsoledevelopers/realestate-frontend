'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCustomerFallbackPath } from '@/lib/auth-redirect';

/** @deprecated Legacy shell — routes redirect via next.config.js; kept as auth safety net. */
export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, isDashboardUser, isCustomer, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !isAuthenticated() || !user) return;

    if (isDashboardUser) {
      router.replace('/dashboard');
      return;
    }

    if (isCustomer) {
      router.replace(getCustomerFallbackPath());
    }
  }, [loading, isAuthenticated, isDashboardUser, isCustomer, user, router]);

  if (loading || !user || isDashboardUser || isCustomer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}
