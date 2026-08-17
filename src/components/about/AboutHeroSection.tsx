'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  ArrowRight,
  FileCheck,
  IndianRupee,
  Map,
  ShieldCheck,
  Users,
  Building2,
  Award,
} from 'lucide-react';
import { AboutCms, ABOUT_SAMPLE_IMAGE } from '@/lib/cms';
import { TranslationKey } from '@/lib/i18n';
import AboutHighlightedTitle from './AboutHighlightedTitle';

interface AboutHeroSectionProps {
  about: AboutCms;
  t: (key: TranslationKey) => string;
}

const FEATURE_ITEMS = [
  { icon: ShieldCheck, labelKey: 'about.feature.verified' as TranslationKey },
  { icon: Map, labelKey: 'about.feature.maps' as TranslationKey },
  { icon: IndianRupee, labelKey: 'about.feature.pricing' as TranslationKey },
  { icon: FileCheck, labelKey: 'about.feature.docs' as TranslationKey },
] as const;

const STAT_ITEMS = [
  { icon: Users, value: '500+', labelKey: 'about.stat.customers' as TranslationKey, delay: 0 },
  { icon: Building2, value: '120+', labelKey: 'about.stat.projects' as TranslationKey, delay: 0.4 },
  { icon: Award, value: '10+', labelKey: 'about.stat.experience' as TranslationKey, delay: 0.8 },
] as const;

// Easing curves and motion variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function AboutHeroSection({ about, t }: AboutHeroSectionProps) {
  const highlights = [t('about.highlight.trust'), t('about.highlight.realEstate')];
  const imageSrc = about.image.trim() || ABOUT_SAMPLE_IMAGE;

  return (
    <motion.section
      className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={containerVariants}
      aria-labelledby="about-heading"
    >
      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Text & Features */}
          <motion.div
            className="order-1 text-center lg:text-left"
            variants={itemVariants}
          >
            {/* Animated Badge */}
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 shadow-sm backdrop-blur-sm sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t('about.badge')}
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              id="about-heading"
              className="mt-6 text-3xl font-bold leading-tight text-gray-900 transition-colors duration-300 hover:text-primary-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
              variants={itemVariants}
            >
              <AboutHighlightedTitle text={about.title} highlights={highlights} />
            </motion.h1>

            {/* Description Text */}
            <motion.p
              className="mt-6 whitespace-pre-line text-base leading-relaxed text-gray-600 sm:text-lg"
              variants={itemVariants}
            >
              {about.description}
            </motion.p>

            {/* Feature Cards Grid */}
            <motion.div
              className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
              variants={containerVariants}
            >
              {FEATURE_ITEMS.map(({ icon: Icon, labelKey }) => (
                <motion.div
                  key={labelKey}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="premium-card group relative flex items-start gap-3.5 p-4 transition-all duration-300 hover:border-emerald-300/80 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-800 via-primary-700 to-emerald-600 text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-emerald-500/20">
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" aria-hidden />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="pt-2 text-left text-sm font-semibold text-gray-900 transition-colors duration-200 group-hover:text-primary-950">
                      {t(labelKey)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
              variants={itemVariants}
            >
              <Link
                href="/layouts"
                className="btn-primary group w-full gap-2 rounded-xl px-6 py-3.5 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98] sm:w-auto"
              >
                {t('about.cta.layouts')}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden />
              </Link>
              <Link
                href="/contact"
                className="btn-secondary w-full rounded-xl px-6 py-3.5 text-primary-700 transform transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:bg-primary-50 hover:shadow-lg hover:shadow-black/10 active:scale-[0.98] sm:w-auto"
              >
                {t('about.cta.contact')}
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: Hero Image & Stat Overlays */}
          <motion.div className="relative order-2" variants={imageVariants}>
            <div className="group relative mx-auto max-w-lg lg:max-w-none">
              {/* Image Frame with Deep Depth Shadow & Scale Effects */}
              <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-2.5 shadow-premium transition-all duration-500 hover:-translate-y-2.5 hover:border-emerald-200/80 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)]">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src={imageSrc}
                    alt={about.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full rounded-2xl object-cover transition-transform duration-700 ease-out group-hover:scale-108 sm:aspect-[5/6] lg:aspect-[4/5]"
                  />
                  {/* Gradient Overlay Vignette */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-30" />
                </div>
              </div>

              {/* Floating Stat Cards with Oscillating Motion */}
              {STAT_ITEMS.map(({ icon: Icon, value, labelKey, delay }, index) => (
                <motion.div
                  key={labelKey}
                  className={`absolute max-w-[11.5rem] rounded-2xl border border-gray-100/80 bg-white/90 px-4 py-3 shadow-glass backdrop-blur-md transition-all duration-300 hover:scale-108 hover:border-emerald-200 hover:bg-white hover:shadow-2xl hover:shadow-emerald-900/10 ${
                    index === 0
                      ? '-left-2 top-8 sm:-left-6'
                      : index === 1
                        ? '-right-2 bottom-28 sm:-right-4'
                        : 'bottom-4 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0'
                  }`}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 4 + delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 transition-all duration-300 hover:scale-110 hover:bg-emerald-500 hover:text-white">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-none text-gray-900">{value}</p>
                      <p className="mt-1 text-xs font-medium text-gray-600">{t(labelKey)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}