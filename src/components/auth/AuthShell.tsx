'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/context/LocaleContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80';

// Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

// Theme Color Profiles for Interactive Selection
const THEME_PROFILES = [
  {
    id: 'emerald',
    accentColor: '#c8ff00',
    glowBg: 'bg-[#c8ff00]/10',
    borderGlow: 'hover:border-[#c8ff00]/50',
    activeBorder: 'border-[#c8ff00] bg-white/10 shadow-[0_0_20px_rgba(200,255,0,0.25)]',
    badgeBg: 'bg-[#c8ff00]',
    badgeText: 'text-black',
    highlightText: 'text-[#c8ff00]',
    overlayGradient: 'from-black/90 via-emerald-950/85 to-primary-950/95',
  },
  {
    id: 'amber',
    accentColor: '#f59e0b',
    glowBg: 'bg-amber-500/15',
    borderGlow: 'hover:border-amber-400/50',
    activeBorder: 'border-amber-400 bg-white/10 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-gray-950',
    highlightText: 'text-amber-400',
    overlayGradient: 'from-black/90 via-amber-950/85 to-primary-950/95',
  },
  {
    id: 'cyan',
    accentColor: '#06b6d4',
    glowBg: 'bg-cyan-500/15',
    borderGlow: 'hover:border-cyan-400/50',
    activeBorder: 'border-cyan-400 bg-white/10 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    badgeBg: 'bg-cyan-400',
    badgeText: 'text-black',
    highlightText: 'text-cyan-400',
    overlayGradient: 'from-black/90 via-cyan-950/85 to-primary-950/95',
  },
];

function BrandPanel() {
  const { t } = useLocale();
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);

  const activeTheme = THEME_PROFILES[activeThemeIndex];

  const features = [
    {
      title: t('auth.shell.feature1.title'),
      description: t('auth.shell.feature1.desc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      ),
    },
    {
      title: t('auth.shell.feature2.title'),
      description: t('auth.shell.feature2.desc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
    {
      title: t('auth.shell.feature3.title'),
      description: t('auth.shell.feature3.desc'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      ),
    },
  ];

  const stats = [
    { value: '500+', label: t('auth.shell.stat.plots') },
    { value: '50+', label: t('auth.shell.stat.layouts') },
    { value: '24/7', label: t('auth.shell.stat.access') },
  ];

  return (
    <aside className="relative hidden h-full shrink-0 lg:grid lg:w-[42%] lg:grid-rows-[auto_1fr_auto] xl:w-[46%]">
      <Image
        src={AUTH_IMAGE}
        alt=""
        fill
        priority
        sizes="50vw"
        className="object-cover transition-transform duration-1000 ease-out hover:scale-105"
        aria-hidden
      />

      {/* Dynamic Overlay Gradient based on selected feature theme */}
      <motion.div
        key={activeTheme.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`absolute inset-0 bg-gradient-to-br ${activeTheme.overlayGradient}`}
      />

      {/* Ambient Decorative Light Orb */}
      <motion.div
        key={`orb-${activeTheme.id}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={`pointer-events-none absolute -right-20 top-1/4 h-64 w-64 rounded-full ${activeTheme.glowBg} blur-3xl animate-pulse`}
        aria-hidden
      />

      <header className="relative z-10 px-8 pb-2 pt-8 xl:px-12 xl:pt-10">
        <Link href="/" className="inline-block text-xl font-bold tracking-tight text-white transition-transform duration-300 hover:scale-105 xl:text-2xl">
          RealEstate
        </Link>
        <p className={`mt-1 text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${activeTheme.highlightText} xl:text-sm`}>
          {t('auth.shell.badge')}
        </p>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex min-h-0 flex-col justify-center overflow-y-auto px-8 py-4 scrollbar-hide xl:px-12"
      >
        <motion.span 
          key={`badge-${activeTheme.id}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`inline-flex w-fit rounded-full ${activeTheme.badgeBg} ${activeTheme.badgeText} px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-lg transition-all duration-300`}
        >
          {t('auth.shell.trusted')}
        </motion.span>

        <motion.h2 variants={itemVariants} className="mt-5 max-w-sm text-2xl font-bold leading-snug text-white xl:mt-6 xl:text-[1.75rem] xl:leading-tight">
          {t('auth.shell.title')}
        </motion.h2>

        <motion.p variants={itemVariants} className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
          {t('auth.shell.subtitleLong')}
        </motion.p>

        {/* Interactive Feature List with Theme Changing on Click */}
        <motion.ul variants={containerVariants} className="mt-6 space-y-3 xl:mt-8">
          {features.map((feature, idx) => {
            const isSelected = activeThemeIndex === idx;

            return (
              <motion.li
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -3, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveThemeIndex(idx)}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 backdrop-blur-sm transition-all duration-300 ${
                  isSelected
                    ? activeTheme.activeBorder
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                    isSelected
                      ? `${activeTheme.badgeBg} ${activeTheme.badgeText} scale-110 shadow-md`
                      : 'bg-white/10 text-white group-hover:scale-110'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {feature.icon}
                  </svg>
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold transition-colors duration-200 ${
                      isSelected ? activeTheme.highlightText : 'text-white group-hover:text-white'
                    }`}
                  >
                    {feature.title}
                  </p>
                  <p className="truncate text-xs text-gray-400">{feature.description}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </motion.div>

      {/* Footer Stats linked to theme color */}
      <footer className="relative z-10 border-t border-white/10 bg-black/25 px-8 py-5 backdrop-blur-sm xl:px-12 xl:py-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -3, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-black/50"
            >
              <p className={`text-lg font-bold transition-colors duration-300 ${activeTheme.highlightText} xl:text-xl`}>
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400 xl:text-xs">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </footer>
    </aside>
  );
}

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  useEffect(() => {
    document.documentElement.classList.add('auth-page');
    document.body.classList.add('auth-page');

    return () => {
      document.documentElement.classList.remove('auth-page');
      document.body.classList.remove('auth-page');
    };
  }, []);

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-gray-50">
      <BrandPanel />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative shrink-0 overflow-hidden lg:hidden">
          <Image
            src={AUTH_IMAGE}
            alt=""
            width={800}
            height={140}
            className="h-24 w-full object-cover sm:h-28"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-emerald-950/80 to-primary-950/90" />
          <div className="absolute inset-0 flex items-center justify-between px-5">
            <div>
              <Link href="/" className="text-lg font-bold text-white">
                RealEstate
              </Link>
              <p className="mt-0.5 text-xs text-gray-300">{t('auth.shell.badge')}</p>
            </div>
            <LanguageSwitcher variant="dark" />
          </div>
        </div>

        <header className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200/80 bg-white px-4 py-3 sm:px-6 lg:border-none lg:bg-transparent lg:px-10 lg:pt-6">
          <Link
            href="/layouts"
            className="text-sm font-medium text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:text-primary-600"
          >
            {t('auth.shell.browseLayouts')}
          </Link>
          <LanguageSwitcher className="hidden lg:block" />
        </header>

        <main className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full min-w-0 max-w-lg"
          >
            {children}
          </motion.div>
        </main>

        <footer className="shrink-0 border-t border-gray-200/80 bg-white px-4 py-3 text-center text-xs text-gray-400 sm:px-6 lg:bg-transparent">
          © {new Date().getFullYear()} RealEstate ·{' '}
          <Link href="/contact" className="transition-colors duration-200 hover:text-primary-600">
            {t('auth.shell.contactSupport')}
          </Link>
        </footer>
      </div>
    </div>
  );
}