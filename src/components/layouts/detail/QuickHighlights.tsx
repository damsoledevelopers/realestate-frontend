'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/context/LocaleContext';

const HIGHLIGHT_KEYS = [
  'detail.highlight.prime',
  'detail.highlight.appreciation',
  'detail.highlight.road',
  'detail.highlight.utilities',
  'detail.highlight.investment',
] as const;

export default function QuickHighlights() {
  const { t } = useLocale();

  return (
    <section className="border-b border-gray-200/60 bg-surface py-2">
      <div className="section-container py-4 sm:py-5">
        {/* Subtle Real Estate Section Accent Banner */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Key Property Highlights
            </span>
          </div>
          <span className="text-xs font-medium text-gray-400 hidden sm:inline-block">
            Verified Layout Assets
          </span>
        </div>

        {/* Highlights Cards Container */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          {HIGHLIGHT_KEYS.map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                delay: index * 0.06,
                duration: 0.35,
                ease: 'easeOut',
              }}
              className="group relative flex min-w-[210px] shrink-0 items-center justify-between rounded-xl border border-gray-100/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-900/10 sm:min-w-0"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-md">
                  <CheckIcon />
                </span>
                <span className="text-sm font-semibold text-gray-800 transition-colors duration-200 group-hover:text-primary-950">
                  {t(key)}
                </span>
              </div>

              {/* Decorative Arrow Indicator on Hover */}
              <svg
                className="h-3.5 w-3.5 text-gray-300 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary-600 group-hover:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}