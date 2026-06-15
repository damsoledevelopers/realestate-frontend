'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyBookingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/user-dashboard/bookings');
  }, [router]);

  return null;
}
