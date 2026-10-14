
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLayouts } from '@/hooks/useLayouts';
import {
  buildLayoutsSearchParams,
  getDependentLocationOptions,
  INDIA_STATES,
  type LayoutSortOption,
  type PriceRangeFilter,
} from '@/lib/layoutFilters';

const fieldClassName =
  'box-border w-full min-w-0 max-w-full rounded-xl border border-white/30 bg-white px-3 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:px-4';

type FilterState = {
  search: string;
  location: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  surveyNumber: string;
  sortBy: LayoutSortOption;
  priceRange: PriceRangeFilter;
};

const initialFilters: FilterState = {
  search: '',
  location: '',
  state: '',
  district: '',
  taluka: '',
  village: '',
  surveyNumber: '',
  sortBy: 'newest',
  priceRange: 'all',
};

export default function HeroSearchFilter() {
  const router = useRouter();
  const { data: layouts = [] } = useLayouts('active');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef<FilterState>({ ...initialFilters });

  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNumber, setSurveyNumber] = useState('');

  filtersRef.current = {
    ...initialFilters,
    search,
    state,
    district,
    taluka,
    village,
    surveyNumber,
  };

  const applyFilters = useCallback(
    (filters: FilterState) => {
      router.push(buildLayoutsSearchParams(filters));
    },
    [router]
  );

  const update = useCallback(
    (patch: Partial<FilterState>) => {
      const nextFilters: FilterState = {
        ...filtersRef.current,
        ...patch,
      };

      filtersRef.current = nextFilters;
      applyFilters(nextFilters);
    },
    [applyFilters]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);

    const nextFilters = {
      ...filtersRef.current,
      search: value,
    };

    filtersRef.current = nextFilters;

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      applyFilters(filtersRef.current);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const districts = getDependentLocationOptions(layouts, 'district', {
    state,
  });

  const talukas = getDependentLocationOptions(layouts, 'taluka', {
    state,
    district,
  });

  const villages = getDependentLocationOptions(layouts, 'village', {
    state,
    district,
    taluka,
  });

  const handleStateChange = (value: string) => {
    setState(value);
    setDistrict('');
    setTaluka('');
    setVillage('');

    update({
      state: value,
      district: '',
      taluka: '',
      village: '',
    });
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setTaluka('');
    setVillage('');

    update({
      district: value,
      taluka: '',
      village: '',
    });
  };

  const handleTalukaChange = (value: string) => {
    setTaluka(value);
    setVillage('');

    update({
      taluka: value,
      village: '',
    });
  };

  const handleVillageChange = (value: string) => {
    setVillage(value);
    update({ village: value });
  };

  const handleSurveyNumberChange = (value: string) => {
    setSurveyNumber(value);
    update({ surveyNumber: value });
  };

  const handleSubmit = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    applyFilters(filtersRef.current);
  };

  return (
    <div className="box-border w-full min-w-0 max-w-full rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md sm:p-4 lg:p-5">
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor="hero-search"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            Search layout or village
          </label>
          <input
            id="hero-search"
            type="search"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="Layout name, village name..."
            className={fieldClassName}
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-state"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            State / UT
          </label>
          <select
            id="hero-state"
            value={state}
            onChange={(event) => handleStateChange(event.target.value)}
            className={fieldClassName}
          >
            <option value="">All States / UTs</option>
            {INDIA_STATES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-district"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            District
          </label>
          <select
            id="hero-district"
            value={district}
            disabled={!state}
            onChange={(event) => handleDistrictChange(event.target.value)}
            className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">All Districts</option>
            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-taluka"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            Taluka / Tehsil
          </label>
          <select
            id="hero-taluka"
            value={taluka}
            disabled={!district}
            onChange={(event) => handleTalukaChange(event.target.value)}
            className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">All Talukas</option>
            {talukas.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-village"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            Village
          </label>
          <select
            id="hero-village"
            value={village}
            disabled={!district}
            onChange={(event) => handleVillageChange(event.target.value)}
            className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">All Villages</option>
            {villages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-survey"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            Survey / Gat Number
          </label>
          <input
            id="hero-survey"
            type="search"
            value={surveyNumber}
            onChange={(event) =>
              handleSurveyNumberChange(event.target.value)
            }
            placeholder="Enter survey or gat no."
            className={fieldClassName}
          />
        </div>

        <div className="flex min-w-0 items-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-white/80"
          >
            Search Plots / Layouts
          </button>
        </div>
      </div>
    </div>
  );
}
