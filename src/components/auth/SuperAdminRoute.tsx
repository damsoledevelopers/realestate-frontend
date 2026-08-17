'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function SuperAdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requireSuperAdmin>{children}</ProtectedRoute>;
}
