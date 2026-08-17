'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from '@/components/NotificationBell';
import DashboardGlobalSearch from '@/components/dashboard/DashboardGlobalSearch';

interface AdminNavbarProps {
  onMenuClick: () => void;
  title?: string;
  hideTitle?: boolean;
  /** Hide all navbar search UI */
  hideSearch?: boolean;
  /** Hide inline desktop search but keep mobile search toggle */
  hideDesktopSearch?: boolean;
}

export default function AdminNavbar({
  onMenuClick,
  title = 'Dashboard',
  hideTitle = false,
  hideSearch = false,
  hideDesktopSearch = false,
}: AdminNavbarProps) {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  const showMobileSearch = !hideSearch;
  const showDesktopSearch = !hideSearch && !hideDesktopSearch;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-100 lg:hidden"
            aria-label={t('dashboard.nav.openMenu')}
          >
            <Menu className="h-5 w-5" />
          </button>
          {!hideTitle && (
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{title}</h1>
              <Link href="/" className="text-xs font-medium text-primary-600 hover:underline">
                {t('nav.viewWebsite')}
              </Link>
            </div>
          )}
        </div>

        {showMobileSearch && (
          <button
            type="button"
            onClick={() => setMobileSearchOpen((open) => !open)}
            className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-100 sm:hidden"
            aria-label={t('dashboard.nav.search')}
            aria-expanded={mobileSearchOpen}
          >
            <Search className="h-5 w-5" />
          </button>
        )}
        {showDesktopSearch && (
          <div className="hidden max-w-xs flex-1 sm:block lg:max-w-sm xl:max-w-md">
            <DashboardGlobalSearch variant="navbar" />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <NotificationBell />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition hover:border-gray-300 hover:shadow"
              aria-label="Profile menu"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary-100 text-sm font-semibold text-primary-700">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <span className="hidden max-w-[7rem] truncate text-sm font-medium text-gray-700 sm:block">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="truncate text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  {t('nav.myProfile')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileSearch && mobileSearchOpen && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:hidden">
          <DashboardGlobalSearch variant="navbar" />
        </div>
      )}
    </header>
  );
}
