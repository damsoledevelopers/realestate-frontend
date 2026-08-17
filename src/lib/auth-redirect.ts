import { AppRole, isCustomerRole, isDashboardUserRole } from '@/lib/roles';

const BLOCKED_RETURN_PATHS = ['/login', '/register'];

export function sanitizeReturnPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  if (BLOCKED_RETURN_PATHS.some((blocked) => path === blocked || path.startsWith(`${blocked}?`))) {
    return null;
  }
  if (path.startsWith('/user-dashboard')) {
    return null;
  }
  return path;
}

export function getPostAuthRedirect(role: AppRole, returnTo?: string | null): string {
  const safeReturn = sanitizeReturnPath(returnTo);
  if (safeReturn) return safeReturn;

  if (isDashboardUserRole(role)) return '/dashboard';
  if (isCustomerRole(role)) return '/my-bookings';
  return '/layouts';
}

export function getCustomerFallbackPath(): string {
  return '/my-bookings';
}
