'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Layouts', href: '/layouts' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { user, logout, isAdmin } = useAuth();
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

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <nav
      className={
        isHome
          ? 'absolute top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-md'
          : 'sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur'
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={`text-xl font-bold ${isHome ? 'text-white' : 'text-primary-700'}`}
        >
          RealEstate
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
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

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/dashboard" className="btn-secondary hidden text-xs sm:inline-flex sm:text-sm">
                  Dashboard
                </Link>
              ) : (
                <Link href="/user-dashboard" className="btn-secondary hidden text-xs sm:inline-flex sm:text-sm">
                  Dashboard
                </Link>
              )}
              <Link
                href={isAdmin ? '/dashboard' : '/user-dashboard/bookings'}
                className={`hidden text-sm font-medium lg:block ${
                  isHome ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {isAdmin ? 'Dashboard' : 'My Bookings'}
              </Link>
              <NotificationBell />

              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 ring-2 ring-transparent transition hover:ring-primary-200"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {initial}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <Link
                      href={isAdmin ? '/dashboard/profile' : '/user-dashboard/profile'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href={isAdmin ? '/dashboard' : '/user-dashboard/bookings'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {isAdmin ? 'Dashboard' : 'My Bookings'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

            </>
          ) : (
            <>
              <Link
                href="/login"
                className={
                  isHome
                    ? 'inline-flex items-center justify-center rounded-lg border border-white/30 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 sm:text-sm'
                    : 'btn-secondary text-xs sm:text-sm'
                }
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={
                  isHome
                    ? 'inline-flex items-center justify-center rounded-full bg-[#c8ff00] px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-[#b8ef00] sm:text-sm'
                    : 'btn-primary text-xs sm:text-sm'
                }
              >
                Get Started
              </Link>
            </>
          )}

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

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-[65px] z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-lg md:hidden">
            <div className="flex flex-col px-4 py-4">
              {NAV_LINKS.map((link) => (
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
                    href={isAdmin ? '/dashboard' : '/user-dashboard/bookings'}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {isAdmin ? 'Dashboard' : 'My Bookings'}
                  </Link>
                  {!isAdmin && (
                    <Link
                      href="/user-dashboard"
                      className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Account
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </>
              )}
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary mx-3 mt-2 text-center text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
