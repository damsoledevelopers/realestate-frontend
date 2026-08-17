'use client';

import { motion, Variants } from 'framer-motion';
import {
  Eye,
  Heart,
  Target,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  ArrowRight,
  Leaf,
  Lightbulb,
  Handshake,
} from 'lucide-react';
import { TranslationKey } from '@/lib/i18n';

interface AboutPrinciplesSectionProps {
  t: (key: TranslationKey) => string;
}

const PRINCIPLE_CARDS = [
  {
    icon: Target,
    titleKey: 'about.mission.title' as TranslationKey,
    textKey: 'about.mission.text' as TranslationKey,
    accent: 'from-primary-800 to-primary-600',
    glowColor: 'rgba(22, 101, 52, 0.15)',
    tag: 'Core Purpose',
  },
  {
    icon: Eye,
    titleKey: 'about.vision.title' as TranslationKey,
    textKey: 'about.vision.text' as TranslationKey,
    accent: 'from-primary-700 to-primary-500',
    glowColor: 'rgba(34, 197, 94, 0.15)',
    tag: 'Future Goal',
  },
  {
    icon: Heart,
    titleKey: 'about.values.title' as TranslationKey,
    textKey: null,
    accent: 'from-primary-800 to-primary-500',
    glowColor: 'rgba(21, 128, 61, 0.15)',
    tag: 'Guiding Pillars',
    valueKeys: [
      'about.values.trust',
      'about.values.transparency',
      'about.values.customer',
      'about.values.innovation',
    ] as TranslationKey[],
  },
] as const;

const COMMITMENTS = [
  {
    icon: Leaf,
    title: 'Sustainable Growth',
    description: 'Committed to eco-conscious strategies that foster long-term positive impact for our communities.',
  },
  {
    icon: Lightbulb,
    title: 'Forward Innovation',
    description: 'Continuously refining our methods to deliver modern solutions tailored to dynamic client needs.',
  },
  {
    icon: Handshake,
    title: 'Ethical Partnerships',
    description: 'Building meaningful, long-lasting relationships founded on total transparency and shared success.',
  },
];

const HIGHLIGHT_STATS = [
  { icon: ShieldCheck, label: 'Uncompromised Integrity', value: '100%' },
  { icon: Users, label: 'Customer First Approach', value: '24/7' },
  { icon: Award, label: 'Excellence Guaranteed', value: 'Top Tier' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36, filter: 'blur(8px)', scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function AboutPrinciplesSection({ t }: AboutPrinciplesSectionProps) {
  return (
    <motion.section
      className="relative overflow-hidden bg-gradient-to-b from-primary-50/40 via-white to-primary-50/30 px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pb-28"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={containerVariants}
      aria-labelledby="about-principles-heading"
    >
      {/* Decorative Background Ambient Glows */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary-100/50 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        {/* Section Header */}
        <motion.div variants={fadeInVariants} className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-800 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary-600" />
            <span>Our Foundation</span>
          </div>

          <h2
            id="about-principles-heading"
            className="text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl lg:text-5xl"
          >
            {t('about.principles.heading')}
          </h2>

          <p className="mt-4 text-base text-gray-600 sm:text-lg">
            Driven by purpose and guided by core values to deliver excellence every single day.
          </p>

          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-primary-600 to-primary-400" />
        </motion.div>

        {/* Principles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {PRINCIPLE_CARDS.map((card) => {
            const Icon = card.icon;

            return (
              <motion.article
                key={card.titleKey}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="premium-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary-100/80 bg-white/80 p-7 shadow-lg shadow-primary-950/5 backdrop-blur-md transition-all duration-500 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-900/15"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle, ${card.glowColor} 0%, transparent 70%)`,
                  }}
                  aria-hidden="true"
                />

                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-md shadow-primary-900/20 transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-900/35`}
                  >
                    <Icon
                      className="h-7 w-7 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                      aria-hidden
                    />
                  </div>

                  <span className="rounded-md border border-primary-100 bg-primary-50/80 px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors duration-300 group-hover:border-primary-200 group-hover:bg-primary-100/60">
                    {card.tag}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-primary-900 transition-colors duration-300 group-hover:text-primary-950">
                  {t(card.titleKey)}
                </h3>

                {'valueKeys' in card && card.valueKeys ? (
                  <ul className="mt-5 space-y-3">
                    {card.valueKeys.map((valueKey) => (
                      <li
                        key={valueKey}
                        className="group/item flex items-center gap-3 rounded-lg p-1.5 transition-all duration-300 hover:bg-primary-50/80 hover:translate-x-1.5"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 transition-all duration-300 group-hover/item:bg-primary-600 group-hover/item:text-white group-hover/item:shadow-sm">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-gray-700 transition-colors duration-300 group-hover/item:text-gray-950">
                          {t(valueKey)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600 transition-colors duration-300 group-hover:text-gray-800 sm:text-base">
                    {card.textKey ? t(card.textKey) : ''}
                  </p>
                )}

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary-700 opacity-80 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                  <span>Learn more</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* NEW SECTION: Our Core Commitments */}
        <motion.div variants={fadeInVariants} className="mt-20">
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-primary-950 sm:text-3xl">
              Our Core Commitments
            </h3>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              The promises we live by to ensure sustainable value and trust.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {COMMITMENTS.map((item) => {
              const CommitIcon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative rounded-xl border border-primary-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white">
                      <CommitIcon className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-semibold text-primary-900 group-hover:text-primary-950">
                      {item.title}
                    </h4>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Highlights / Impact Banner */}
        <motion.div
          variants={fadeInVariants}
          className="mt-14 rounded-2xl border border-primary-200/60 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 p-6 shadow-xl shadow-primary-950/10 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-primary-700/50">
            {HIGHLIGHT_STATS.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 text-white sm:first:pl-0 sm:pl-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-700/60 text-primary-200 ring-1 ring-primary-500/30">
                    <StatIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {stat.value}
                    </div>
                    <div className="text-xs font-medium text-primary-200 sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}