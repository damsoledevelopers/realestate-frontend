const BLOCKED_RETURN_PATHS = ['/login', '/register'];

export function sanitizeReturnPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  if (BLOCKED_RETURN_PATHS.some((blocked) => path === blocked || path.startsWith(`${blocked}?`))) {
    return null;
  }
  return path;
}

export function getPostAuthRedirect(
  role: 'user' | 'admin',
  returnTo?: string | null
): string {
  const safeReturn = sanitizeReturnPath(returnTo);
  if (safeReturn) return safeReturn;
  return role === 'admin' ? '/dashboard' : '/user-dashboard';
}
