'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Grid3x3,
  Files,
  ShieldCheck,
  Users,
  Clock,
  Handshake,
  IndianRupee,
  UserCircle,
  FileText,
  Tag,
  Shield,
  ScrollText,
  ClipboardList,
  MessageSquare,
  Newspaper,
  Palette,
  Trees,
  Map,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

const ALL_NAV_ITEMS: {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  superAdminOnly: boolean;
}[] = [
  { href: '/dashboard', labelKey: 'dashboard.nav.dashboard', icon: LayoutDashboard, superAdminOnly: false },
  { href: '/dashboard/system', labelKey: 'dashboard.nav.system', icon: Shield, superAdminOnly: true },
  { href: '/dashboard/layouts', labelKey: 'dashboard.nav.layouts', icon: Building2, superAdminOnly: false },
  { href: '/dashboard/farms', labelKey: 'dashboard.nav.farms', icon: Trees, superAdminOnly: false },
  { href: '/dashboard/lands', labelKey: 'dashboard.nav.lands', icon: Map, superAdminOnly: false },
  { href: '/dashboard/partners', labelKey: 'dashboard.nav.partners', icon: Handshake, superAdminOnly: false },
  { href: '/dashboard/documents', labelKey: 'dashboard.nav.documents', icon: Files, superAdminOnly: false },
  { href: '/dashboard/plots', labelKey: 'dashboard.nav.plots', icon: Grid3x3, superAdminOnly: false },
  { href: '/dashboard/bookings', labelKey: 'dashboard.nav.bookings', icon: ClipboardList, superAdminOnly: false },
  { href: '/dashboard/payments', labelKey: 'dashboard.nav.payments', icon: IndianRupee, superAdminOnly: false },
  { href: '/dashboard/pricing', labelKey: 'dashboard.nav.pricing', icon: Tag, superAdminOnly: false },
  { href: '/dashboard/estimates', labelKey: 'dashboard.nav.estimates', icon: FileText, superAdminOnly: false },
  { href: '/dashboard/billing-profile', labelKey: 'dashboard.nav.billingProfile', icon: UserCircle, superAdminOnly: false },
  { href: '/dashboard/users', labelKey: 'dashboard.nav.users', icon: Users, superAdminOnly: false },
  { href: '/dashboard/access-requests', labelKey: 'dashboard.nav.accessRequests', icon: ShieldCheck, superAdminOnly: true },
  { href: '/dashboard/activity-log', labelKey: 'dashboard.nav.activityLog', icon: ScrollText, superAdminOnly: true },
  { href: '/dashboard/inquiries', labelKey: 'dashboard.nav.inquiries', icon: MessageSquare, superAdminOnly: true },
  { href: '/dashboard/cms', labelKey: 'dashboard.nav.cms', icon: Newspaper, superAdminOnly: true },
  { href: '/dashboard/login-history', labelKey: 'dashboard.nav.loginHistory', icon: Clock, superAdminOnly: true },
  { href: '/dashboard/settings', labelKey: 'dashboard.nav.settings', icon: Palette, superAdminOnly: true },
  { href: '/dashboard/profile', labelKey: 'dashboard.nav.profile', icon: UserCircle, superAdminOnly: false },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();
  const { t } = useLocale();

  const navItems = ALL_NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/dashboard/profile') return pathname === '/dashboard/profile';
    if (href === '/dashboard/system') return pathname.startsWith('/dashboard/system');
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-gray-100 px-6 py-6">
        <Link href="/" className="text-lg font-bold text-primary-700" onClick={onClose}>
          RealEstate
        </Link>
        <p className="mt-1 text-xs font-medium text-gray-500">
          {isSuperAdmin ? t('dashboard.panel.superAdmin') : t('dashboard.panel.manager')}
        </p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 py-5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary-600" />
              )}
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 overflow-hidden border-r border-gray-200 bg-white lg:block">
        {navContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
          <aside className="absolute left-0 top-0 flex h-full min-h-0 w-[min(16rem,85vw)] flex-col overflow-hidden bg-white shadow-xl">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-4 z-10 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={t('common.close')}
            >
              ✕
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
