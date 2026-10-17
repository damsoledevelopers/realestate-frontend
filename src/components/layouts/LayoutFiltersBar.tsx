'use client';

import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { INDIA_STATES, getDependentLocationOptions, LayoutSortOption, PriceRangeFilter } from '@/lib/layoutFilters';
import { fetchPublicLocationOptions, PUBLIC_LOCATION_STATE } from '@/lib/publicLocationDirectory';
import { LayoutStatusFilter } from '@/hooks/useLayouts';
import { useLocale } from '@/context/LocaleContext';
import { LocationOption, getLocalizedLocation } from '@/lib/localizedText';
import { Layout } from '@/lib/types';

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
  layouts?: Layout[];
  state?: string;
  onStateChange?: (value: string) => void;
  district?: string;
  onDistrictChange?: (value: string) => void;
  taluka?: string;
  onTalukaChange?: (value: string) => void;
  village?: string;
  onVillageChange?: (value: string) => void;
  surveyNumber?: string;
  onSurveyNumberChange?: (value: string) => void;
  /** Enables the Maharashtra-only administrative directory for public search surfaces. */
  publicLocationOnly?: boolean;
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
  layouts = [],
  state = '',
  onStateChange,
  district = '',
  onDistrictChange,
  taluka = '',
  onTalukaChange,
  village = '',
  onVillageChange,
  surveyNumber = '',
  onSurveyNumberChange,
  publicLocationOnly = false,
}: LayoutFiltersBarProps) {
  const { t, locale } = useLocale();
  const [publicDistricts, setPublicDistricts] = useState<string[]>([]);
  const [publicTalukas, setPublicTalukas] = useState<string[]>([]);
  const [publicVillages, setPublicVillages] = useState<string[]>([]);
  const [publicLocationError, setPublicLocationError] = useState('');
  const locationFiltersEnabled = publicLocationOnly || state === PUBLIC_LOCATION_STATE;

  useEffect(() => {
    if (!locationFiltersEnabled) { setPublicDistricts([]); return; }
    const controller = new AbortController();
    setPublicDistricts([]);
    setPublicLocationError('');
    fetchPublicLocationOptions('district', [{ field: 'state', value: PUBLIC_LOCATION_STATE }], controller.signal)
      .then(setPublicDistricts)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setPublicDistricts(['Dhule', 'Jalgaon', 'Nandurbar']);
          setPublicLocationError(error instanceof Error ? error.message : 'Could not load districts.');
        }
      });
    return () => controller.abort();
  }, [locationFiltersEnabled]);

  useEffect(() => {
    if (!locationFiltersEnabled || !district) {
      setPublicTalukas([]);
      return;
    }
    const controller = new AbortController();
    setPublicTalukas([]);
    setPublicLocationError('');
    fetchPublicLocationOptions('subdistrict', [
      { field: 'state', value: PUBLIC_LOCATION_STATE },
      { field: 'district', value: district },
    ], controller.signal).then(setPublicTalukas).catch((error: unknown) => {
      if (!controller.signal.aborted) setPublicLocationError(error instanceof Error ? error.message : 'Could not load talukas.');
    });
    return () => controller.abort();
  }, [locationFiltersEnabled, district]);

  useEffect(() => {
    if (!locationFiltersEnabled || !district || !taluka) { setPublicVillages([]); return; }
    const controller = new AbortController();
    setPublicVillages([]);
    setPublicLocationError('');
    fetchPublicLocationOptions('name', [
      { field: 'state', value: PUBLIC_LOCATION_STATE },
      { field: 'district', value: district },
      { field: 'subdistrict', value: taluka },
    ], controller.signal).then(setPublicVillages).catch((error: unknown) => {
      if (!controller.signal.aborted) setPublicLocationError(error instanceof Error ? error.message : 'Could not load villages.');
    });
    return () => controller.abort();
  }, [locationFiltersEnabled, district, taluka]);

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

        {/* Dependent State -> District -> Taluka -> Village filters */}
        {onStateChange && onDistrictChange && onTalukaChange && onVillageChange && (
          <>
            <motion.div variants={itemVariants} className="group/field min-w-0">
              <label htmlFor={`${idPrefix}-state`} className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm">{t('filters.state')}</label>
              <select id={`${idPrefix}-state`} value={(publicLocationOnly || state === PUBLIC_LOCATION_STATE) ? PUBLIC_LOCATION_STATE : state} onChange={(e) => { onStateChange((publicLocationOnly || state === PUBLIC_LOCATION_STATE) ? PUBLIC_LOCATION_STATE : e.target.value); onDistrictChange(''); onTalukaChange(''); onVillageChange(''); }} className="input-field cursor-pointer">
                {(publicLocationOnly || state === PUBLIC_LOCATION_STATE) ? <option value={PUBLIC_LOCATION_STATE}>{getLocalizedLocation(PUBLIC_LOCATION_STATE, locale)}</option> : <><option value="">All States / UTs</option>{INDIA_STATES.map((item) => <option key={item} value={item}>{getLocalizedLocation(item, locale)}</option>)}</>}
              </select>
            </motion.div>
            <motion.div variants={itemVariants} className="group/field min-w-0">
              <label htmlFor={`${idPrefix}-district`} className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm">{t('filters.district')}</label>
              <select id={`${idPrefix}-district`} value={district} disabled={!state} onChange={(e) => { onDistrictChange(e.target.value); onTalukaChange(''); onVillageChange(''); }} className="input-field cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100">
                <option value="">{t('filters.allDistricts')}</option>
                {(locationFiltersEnabled ? publicDistricts : getDependentLocationOptions(layouts, 'district', { state })).map((item) => <option key={item} value={item}>{getLocalizedLocation(item, locale)}</option>)}
              </select>
            </motion.div>
            <motion.div variants={itemVariants} className="group/field min-w-0">
              <label htmlFor={`${idPrefix}-taluka`} className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm">{t('filters.taluka')}</label>
              <select id={`${idPrefix}-taluka`} value={taluka} disabled={!district} onChange={(e) => { onTalukaChange(e.target.value); onVillageChange(''); }} className="input-field cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100">
                <option value="">{t('filters.selectTaluka')}</option>
                {(locationFiltersEnabled ? publicTalukas : getDependentLocationOptions(layouts, 'taluka', { state, district })).map((item) => <option key={item} value={item}>{getLocalizedLocation(item, locale)}</option>)}
              </select>
            </motion.div>
            <motion.div variants={itemVariants} className="group/field min-w-0">
              <label htmlFor={`${idPrefix}-village`} className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm">{t('filters.village')}</label>
              <select id={`${idPrefix}-village`} value={village} disabled={!district} onChange={(e) => onVillageChange(e.target.value)} className="input-field cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100">
                <option value="">{t('filters.selectVillage')}</option>
                {(locationFiltersEnabled ? publicVillages : getDependentLocationOptions(layouts, 'village', { state, district, taluka })).map((item) => <option key={item} value={item}>{getLocalizedLocation(item, locale)}</option>)}
              </select>
            </motion.div>
          </>
        )}

        {/* Survey / Gat Number Search */}
        {onSurveyNumberChange && (
          <motion.div variants={itemVariants} className="group/field min-w-0">
            <label htmlFor={`${idPrefix}-survey-number`} className="mb-1.5 block text-xs font-semibold text-gray-700 sm:text-sm">Survey / Gat Number</label>
            <input
              id={`${idPrefix}-survey-number`}
              type="search"
              value={surveyNumber}
              onChange={(e) => onSurveyNumberChange(e.target.value)}
              placeholder="e.g. 125 or 12/A"
              className="input-field"
            />
          </motion.div>
        )}

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
      {publicLocationOnly && publicLocationError && <p role="status" className="mt-2 text-xs text-red-600">{publicLocationError}</p>}
    </motion.div>
  );
}