'use client';

import { motion, Variants } from 'framer-motion';
import {
  LayoutSortOption,
  PRICE_RANGE_OPTIONS,
  PriceRangeFilter,
  SORT_OPTIONS,
} from '@/lib/layoutFilters';
import { LayoutStatusFilter } from '@/hooks/useLayouts';
import { useLocale } from '@/context/LocaleContext';
import { LocationOption } from '@/lib/localizedText';

interface LayoutFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  priceRange: PriceRangeFilter;
  onPriceRangeChange: (value: PriceRangeFilter) => void;
  sortBy: LayoutSortOption;
  onSortByChange: (value: LayoutSortOption) => void;
  statusFilter?: LayoutStatusFilter;
  onStatusFilterChange?: (value: LayoutStatusFilter) => void;
  locationOptions?: LocationOption[];
  showStatusFilter?: boolean;
  idPrefix?: string;
}

// Staggered Entrance Animations
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 320, damping: 22 },
  },
};

export default function LayoutFiltersBar({
  search,
  onSearchChange,
  location,
  onLocationChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortByChange,
  statusFilter = 'active',
  onStatusFilterChange,
  locationOptions = [],
  showStatusFilter = false,
  idPrefix = 'layout',
}: LayoutFiltersBarProps) {
  const { t, locale } = useLocale();

  const priceLabels: Record<string, string> =
    locale === 'mr'
      ? {
          all: 'कोणतीही किंमत',
          'under-5l': '₹5 लाखांखाली',
          '5l-10l': '₹5 - 10 लाख',
          '10l-25l': '₹10 - 25 लाख',
          'above-25l': '₹25 लाखांपेक्षा जास्त',
        }
      : {};

  const sortLabels: Record<string, string> =
    locale === 'mr'
      ? {
          newest: 'नवीनतम',
          updated: 'अलीकडे अपडेट',
          price: 'किंमत: कमी ते जास्त',
          available: 'जास्त उपलब्ध',
          plots: 'जास्त प्लॉट',
        }
      : {};

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="group/card box-border relative w-full min-w-0 max-w-full rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 hover:border-emerald-300 hover:shadow-[0_25px_60px_-15px_rgba(16,185,129,0.22)] sm:p-5 z-10"
    >
      {/* Top Gradient Shimmer Sweep Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />

      <div className="relative z-10 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap lg:items-end">
        
        {/* Search Field */}
        <motion.div variants={itemVariants} className="group/field min-w-0 sm:col-span-2 lg:min-w-[200px] lg:flex-1">
          <label htmlFor={`${idPrefix}-search`} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 transition-colors duration-200 group-focus-within/field:text-emerald-700 sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-focus-within/field:bg-emerald-500" />
            {t('filters.search')}
          </label>
          <input
            id={`${idPrefix}-search`}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('filters.searchPlaceholder')}
            className="input-field transform transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:-translate-y-0.5 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          />
        </motion.div>

        {/* Location Dropdown / Input */}
        <motion.div variants={itemVariants} className="group/field min-w-0 lg:max-w-[220px] lg:flex-1">
          <label htmlFor={`${idPrefix}-location`} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 transition-colors duration-200 group-focus-within/field:text-emerald-700 sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-focus-within/field:bg-emerald-500" />
            {t('filters.location')}
          </label>
          {locationOptions.length > 0 ? (
            <select
              id={`${idPrefix}-location`}
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              className="input-field cursor-pointer transform transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:-translate-y-0.5 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              <option value="">{t('filters.allLocations')}</option>
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`${idPrefix}-location`}
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t('filters.locationPlaceholder')}
              className="input-field transform transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:-translate-y-0.5 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            />
          )}
        </motion.div>

        {/* Price Range Dropdown */}
        <motion.div variants={itemVariants} className="group/field min-w-0">
          <label htmlFor={`${idPrefix}-price`} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 transition-colors duration-200 group-focus-within/field:text-emerald-700 sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-focus-within/field:bg-emerald-500" />
            {t('filters.priceRange')}
          </label>
          <select
            id={`${idPrefix}-price`}
            value={priceRange}
            onChange={(e) => onPriceRangeChange(e.target.value as PriceRangeFilter)}
            className="input-field cursor-pointer transform transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:-translate-y-0.5 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          >
            {PRICE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {priceLabels[option.value] || option.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Sort By Dropdown */}
        <motion.div variants={itemVariants} className="group/field min-w-0">
          <label htmlFor={`${idPrefix}-sort`} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 transition-colors duration-200 group-focus-within/field:text-emerald-700 sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-focus-within/field:bg-emerald-500" />
            {t('filters.sortBy')}
          </label>
          <select
            id={`${idPrefix}-sort`}
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as LayoutSortOption)}
            className="input-field cursor-pointer transform transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:-translate-y-0.5 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {sortLabels[option.value] || option.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Status Dropdown */}
        {showStatusFilter && onStatusFilterChange && (
          <motion.div variants={itemVariants} className="group/field min-w-0">
            <label htmlFor={`${idPrefix}-status`} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 transition-colors duration-200 group-focus-within/field:text-emerald-700 sm:text-sm">
              <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              {t('filters.status')}
            </label>
            <select
              id={`${idPrefix}-status`}
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as LayoutStatusFilter)}
              className="input-field cursor-pointer transform transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:-translate-y-0.5 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              <option value="active">{t('filters.activeOnly')}</option>
              <option value="all">{t('filters.all')}</option>
            </select>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}