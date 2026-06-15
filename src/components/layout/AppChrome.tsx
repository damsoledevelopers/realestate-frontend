'use client';

import { usePathname } from 'next/navigation';
import GoogleMapsProvider from '@/components/maps/GoogleMapsProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard =
    pathname.startsWith('/dashboard') || pathname.startsWith('/user-dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <GoogleMapsProvider>
        <Navbar />
        <main className={isDashboard ? 'min-h-screen' : pathname === '/' ? '' : 'min-h-[calc(100vh-8rem)]'}>
          {children}
        </main>
        {!isDashboard && <Footer />}
      </GoogleMapsProvider>
    </>
  );
}
