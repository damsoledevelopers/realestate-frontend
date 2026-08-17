'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useCmsSection, mergeCmsData } from '@/hooks/useCmsSection';
import { useLocale } from '@/context/LocaleContext';

// Framer Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)', scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function Footer() {
  const { t } = useLocale();
  const { data } = useCmsSection('footer');
  const footer = mergeCmsData('footer', data);

  const navLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.layouts'), href: '/layouts' },
    { label: t('nav.about'), href: '/about' },
    { label: t('nav.contact'), href: '/contact' },
  ];

  const socialEntries = Object.entries(footer.socialLinks || {}).filter(([, url]) => url);

  return (
    <footer className="group/footer relative w-full overflow-x-hidden border-t border-gray-200 bg-white transition-all duration-500 hover:shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.08)]">
      {/* Top Subtle Shimmer Accent Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 transition-opacity duration-500 group-hover/footer:opacity-100" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="mx-auto w-full min-w-0 max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Brand Column */}
          <motion.div variants={columnVariants} className="group/brand">
            <p className="text-sm font-semibold text-primary-700 transition-all duration-300 group-hover/brand:translate-x-1 group-hover/brand:text-primary-800">
              {footer.companyName}
            </p>
            <p className="mt-2 text-sm text-gray-500 transition-colors duration-300 hover:text-gray-700">
              {footer.address}
            </p>
          </motion.div>

          {/* Contact Column */}
          <motion.div variants={columnVariants} className="group/contact">
            <p className="text-sm font-semibold text-gray-900">{t('footer.contact')}</p>
            <p className="mt-2 text-sm text-gray-500 transition-transform duration-200 hover:translate-x-1 hover:text-gray-700">
              {footer.phone}
            </p>
            <a
              href={`mailto:${footer.email}`}
              className="inline-block text-sm text-primary-600 transition-all duration-200 hover:translate-x-1 hover:text-primary-700 hover:underline"
            >
              {footer.email}
            </a>
          </motion.div>

          {/* Quick Links Column */}
          <motion.div variants={columnVariants}>
            <p className="text-sm font-semibold text-gray-900">{t('footer.quickLinks')}</p>
            <div className="mt-2 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group/link relative w-fit text-sm text-gray-500 transition-all duration-300 hover:translate-x-1.5 hover:text-primary-600"
                >
                  <span>{link.label}</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-600 transition-all duration-300 group-hover/link:w-full" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Social Links Column */}
          {socialEntries.length > 0 && (
            <motion.div variants={columnVariants}>
              <p className="text-sm font-semibold text-gray-900">{t('footer.followUs')}</p>
              <div className="mt-2 flex flex-col gap-2">
                {socialEntries.map(([network, url]) => (
                  <a
                    key={network}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/social relative w-fit text-sm capitalize text-gray-500 transition-all duration-300 hover:translate-x-1.5 hover:text-primary-600"
                  >
                    <span>{network}</span>
                    <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary-600 transition-all duration-300 group-hover/social:w-full" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Legal Links Bar */}
        <motion.div
          variants={columnVariants}
          className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500"
        >
          <Link
            href="/privacy-policy"
            className="transition-all duration-200 hover:-translate-y-0.5 hover:text-primary-600"
          >
            {t('footer.privacy')}
          </Link>
          <span className="text-gray-300">·</span>
          <Link
            href="/terms-and-conditions"
            className="transition-all duration-200 hover:-translate-y-0.5 hover:text-primary-600"
          >
            {t('footer.terms')}
          </Link>
        </motion.div>

        {/* Copyright Notice */}
        <motion.p
          variants={columnVariants}
          className="mt-8 text-center text-sm text-gray-400 transition-colors duration-300 hover:text-gray-600"
        >
          {footer.copyright}
        </motion.p>
      </motion.div>
    </footer>
  );
}