'use client';

import { usePathname } from 'next/navigation';
import GoogleMapsProvider from '@/components/maps/GoogleMapsProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PendingDashboardBanner from '@/components/auth/PendingDashboardBanner';

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard =
    pathname.startsWith('/dashboard') || pathname.startsWith('/user-dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isDashboard || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <GoogleMapsProvider>
        <Navbar />
        <PendingDashboardBanner />
        <main
          className={
            isDashboard
              ? 'min-h-screen min-w-0'
              : pathname === '/'
                ? 'min-w-0 overflow-x-hidden'
                : 'min-h-[calc(100vh-8rem)] min-w-0 overflow-x-hidden'
          }
        >
          {children}
        </main>
        {!isDashboard && <Footer />}
      </GoogleMapsProvider>
    </div>
  );
}
