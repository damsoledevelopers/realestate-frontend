'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Map Listings admin was removed — layout projects are managed under Layouts. */
export default function DashboardPropertiesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/layouts');
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-400">
      Redirecting to Layouts…
    </div>
  );
}
