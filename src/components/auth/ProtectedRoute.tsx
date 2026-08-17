'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCustomerFallbackPath, getPostAuthRedirect } from '@/lib/auth-redirect';
import { hasPendingDashboardRequest } from '@/lib/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Super Admin and User roles — blocks Customers from dashboard areas */
  requireDashboard?: boolean;
  /** Super Admin only */
  requireSuperAdmin?: boolean;
  /** @deprecated Use requireDashboard */
  requireAdmin?: boolean;
  /** Legacy user-dashboard shell — redirects dashboard users to /dashboard */
  requireUser?: boolean;
}

export default function ProtectedRoute({
  children,
  requireDashboard = false,
  requireSuperAdmin = false,
  requireAdmin = false,
  requireUser = false,
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, isDashboardUser, isSuperAdmin, isCustomer, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const needsDashboard = requireDashboard || requireAdmin;

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated()) {
      const from = pathname ? `?from=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${from}`);
      return;
    }

    if (!user) return;

    if (requireSuperAdmin && !isSuperAdmin) {
      router.replace(getPostAuthRedirect(user.role));
      return;
    }

    if (needsDashboard && !isDashboardUser) {
      if (hasPendingDashboardRequest(user.dashboardRequestStatus)) {
        sessionStorage.setItem('dashboardAccessPending', '1');
        router.replace('/layouts');
        return;
      }
      router.replace(isCustomer ? getCustomerFallbackPath() : getPostAuthRedirect(user.role));
      return;
    }

    if (requireUser && isDashboardUser) {
      router.replace('/dashboard');
    }
  }, [
    loading,
    isAuthenticated,
    isDashboardUser,
    isSuperAdmin,
    isCustomer,
    needsDashboard,
    requireSuperAdmin,
    requireUser,
    user,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        Checking access...
      </div>
    );
  }

  if (!isAuthenticated()) return null;
  if (requireSuperAdmin && !isSuperAdmin) return null;
  if (needsDashboard && !isDashboardUser) return null;
  if (requireUser && isDashboardUser) return null;

  return <>{children}</>;
}
