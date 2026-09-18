'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { user, logout, isDashboardUser, isCustomer } = useAuth();
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  const homeActionClass =
    'hidden rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 md:inline-flex';

  const signInClass = isHome
    ? homeActionClass
    : 'btn-secondary hidden text-sm md:inline-flex';

  const registerClass = isHome
    ? 'hidden rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-gray-900 transition hover:opacity-90 md:inline-flex'
    : 'btn-primary hidden text-sm md:inline-flex';

  const mobileSignInClass = isHome
    ? 'inline-flex rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white md:hidden'
    : 'hidden';

  const links = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.layouts'), href: '/layouts' },
    { label: t('nav.about'), href: '/about' },
    { label: t('nav.contact'), href: '/contact' },
  ];

  return (
    <>
      <nav
        className={
          isHome
            ? 'absolute top-0 z-50 w-full max-w-full overflow-x-clip border-b border-white/10 bg-transparent'
            : 'sticky top-0 z-50 w-full max-w-full overflow-x-clip border-b border-gray-200 bg-white/95 backdrop-blur'
        }
      >
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/"
            className={`shrink-0 text-lg font-bold sm:text-xl ${isHome ? 'text-white' : 'text-primary-700'}`}
          >
            RealEstate
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  isHome ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {user ? (
              <>
                {isDashboardUser ? (
                  <Link
                    href="/dashboard"
                    className={isHome ? homeActionClass : 'btn-secondary hidden text-xs sm:inline-flex sm:text-sm'}
                  >
                    {t('nav.dashboard')}
                  </Link>
                ) : isCustomer ? (
                  <Link
                    href="/my-bookings"
                    className={isHome ? homeActionClass : 'btn-secondary hidden text-xs sm:inline-flex sm:text-sm'}
                  >
                    {t('nav.myBookings')}
                  </Link>
                ) : null}
                <NotificationBell variant={isHome ? 'dark' : 'default'} />

                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className={
                      isHome
                        ? 'flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25'
                        : 'flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 ring-2 ring-transparent transition hover:ring-primary-200'
                    }
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    {initial}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <Link
                        href={isDashboardUser ? '/dashboard/profile' : '/profile'}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.myProfile')}
                      </Link>
                      <Link
                        href={isDashboardUser ? '/dashboard' : '/my-bookings'}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {isDashboardUser ? t('nav.dashboard') : t('nav.myBookings')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                      >
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className={mobileSignInClass}>
                  Admin Login
                </Link>
                <Link href="/login" className={signInClass}>
                  Admin Login
                </Link>
              </>
            )}

            <LanguageSwitcher
              variant={isHome ? 'dark' : 'default'}
              className="hidden md:block"
            />

            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-lg p-2 md:hidden ${
                isHome ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            className="fixed left-0 right-0 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-gray-200 bg-white shadow-lg md:hidden"
            style={{ top: 'var(--navbar-height, 4rem)' }}
          >
            <div className="flex flex-col px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href={isDashboardUser ? '/dashboard' : '/my-bookings'}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {isDashboardUser ? t('nav.dashboard') : t('nav.myBookings')}
                  </Link>
                  <Link
                    href={isDashboardUser ? '/dashboard/profile' : '/profile'}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('nav.myProfile')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-gray-50"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              )}
              {!user && (
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Login
                </Link>
              )}
              <LanguageSwitcher variant="field" className="mt-2" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
