export type AppRole = 'super_admin' | 'dashboard_admin' | 'user' | 'partner' | 'customer' | 'admin';
export type DashboardRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function isAdminLoginRole(role?: string | null): boolean {
  return role === 'super_admin' || role === 'dashboard_admin' || role === 'user' || role === 'partner' || role === 'admin';
}

export function isSuperAdminRole(role?: string | null): boolean {
  return role === 'super_admin' || role === 'dashboard_admin';
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

/** Admin is a restricted enquiry-only staff role. */
export function normalizeAppRole(role?: string | null): AppRole | null {
  if (!role) return null;
  if (role === 'admin') return 'admin';
  if (role === 'super_admin' || role === 'dashboard_admin' || role === 'user' || role === 'partner' || role === 'customer') return role;
  return null;
}

export function formatRoleLabel(role?: string | null): string {
  const normalized = normalizeAppRole(role) ?? role;
  switch (normalized) {
    case 'super_admin':
      return 'Super Admin';
    case 'dashboard_admin':
      return 'Admin';
    case 'user':
      return 'Layout User';
    case 'partner':
      return 'Partner';
    case 'customer':
      return 'Customer';
    case 'admin':
      return 'Admin';
    default:
      return role || 'Unknown';
  }
}
