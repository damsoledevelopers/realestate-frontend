import { Suspense } from 'react';
import LoginPage from './LoginPage';
import AuthLoadingFallback from '@/components/auth/AuthLoadingFallback';

export default function Page() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <LoginPage />
    </Suspense>
  );
}
