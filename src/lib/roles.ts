export type AppRole = 'super_admin' | 'user' | 'customer' | 'admin';
export type DashboardRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function isAdminLoginRole(role?: string | null): boolean {
  return role === 'super_admin' || role === 'user' || role === 'admin';
}

export function isSuperAdminRole(role?: string | null): boolean {
  return role === 'super_admin';
}

export function isDashboardUserRole(role?: string | null): boolean {
  return isAdminLoginRole(role);
}

export function isCustomerRole(role?: string | null): boolean {
  return role === 'customer';
}

export function hasPendingDashboardRequest(
  status?: DashboardRequestStatus | string | null
): boolean {
  return status === 'pending';
}

export function wasDashboardRequestRejected(
  status?: DashboardRequestStatus | string | null
): boolean {
  return status === 'rejected';
}

/** Legacy `admin` is treated the same as `user` (layout manager). */
export function normalizeAppRole(role?: string | null): AppRole | null {
  if (!role) return null;
  if (role === 'admin') return 'user';
  if (role === 'super_admin' || role === 'user' || role === 'customer') return role;
  return null;
}

export function formatRoleLabel(role?: string | null): string {
  const normalized = normalizeAppRole(role) ?? role;
  switch (normalized) {
    case 'super_admin':
      return 'Super Admin';
    case 'user':
      return 'Layout User';
    case 'customer':
      return 'Customer';
    case 'admin':
      return 'User';
    default:
      return role || 'Unknown';
  }
}
