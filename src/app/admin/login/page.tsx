import { Suspense } from 'react';
import LoginPage from '@/app/login/LoginPage';
import AuthLoadingFallback from '@/components/auth/AuthLoadingFallback';

/** Dedicated admin entry URL; authentication and role validation remain in the existing login flow. */
export default function AdminLoginPage() {
  return <Suspense fallback={<AuthLoadingFallback />}><LoginPage /></Suspense>;
}
