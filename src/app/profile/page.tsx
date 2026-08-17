'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProfilePageContent from '@/components/profile/ProfilePageContent';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { loading, isDashboardUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (isDashboardUser) router.replace('/dashboard/profile');
  }, [loading, isDashboardUser, router]);

  if (loading || isDashboardUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <ProfilePageContent />
      </div>
    </ProtectedRoute>
  );
}
