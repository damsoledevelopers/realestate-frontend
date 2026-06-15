'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import UserSidebar from './UserSidebar';
import UserNavbar from './UserNavbar';

const pageTitles: Record<string, string> = {
  '/user-dashboard': 'Overview',
  '/user-dashboard/bookings': 'My Bookings',
  '/user-dashboard/profile': 'My Profile',
};

export default function UserShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'My Account';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <UserNavbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
