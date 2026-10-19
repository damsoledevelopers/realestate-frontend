 'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildLayoutsSearchParams } from '@/lib/layoutFilters';
import { fetchPublicLocationOptions, PUBLIC_LOCATION_STATE } from '@/lib/publicLocationDirectory';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedLocation } from '@/lib/localizedText';

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
};

export default function HeroSearchFilter() {
  const { locale, t } = useLocale();
  const router = useRouter();

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtersRef = useRef<FilterState>({
    search: '',
    location: '',
    state: PUBLIC_LOCATION_STATE,
    district: '',
    taluka: '',
    village: '',
    surveyNumber: '',
  });

  const [search, setSearch] = useState('');
  const [state, setState] = useState(PUBLIC_LOCATION_STATE);
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNumber, setSurveyNumber] = useState('');

  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [locationOptionsError, setLocationOptionsError] = useState('');

  filtersRef.current = {
    ...filtersRef.current,
    search,
    state,
    district,
    taluka,
    village,
    surveyNumber,
  };

  const applyFilters = useCallback(
    (filters: FilterState) => {
      router.push(
        buildLayoutsSearchParams({
          ...filters,
          sortBy: 'newest',
         priceRange: undefined,
        })
      );
    },
    [router]
  );

  const update = (patch: Partial<FilterState>) => {
    applyFilters({
      ...filtersRef.current,
      ...patch,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      update({ search: value });
    }, 350);
  };

  const districts = state === PUBLIC_LOCATION_STATE ? districtOptions : [];

  useEffect(() => {
    const controller = new AbortController();

    fetchPublicLocationOptions('district', [], controller.signal)
      .then(setDistrictOptions)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLocationOptionsError(
            error instanceof Error ? error.message : 'Could not load districts.'
          );
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!district) {
      setTalukas([]);
      return;
    }

    const controller = new AbortController();

    setTalukas([]);
    setLocationOptionsError('');

    fetchPublicLocationOptions(
      'subdistrict',
      [
        { field: 'state', value: PUBLIC_LOCATION_STATE },
        { field: 'district', value: district },
      ],
      controller.signal
    )
      .then(setTalukas)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLocationOptionsError(
            error instanceof Error ? error.message : 'Could not load talukas.'
          );
        }
      });

    return () => controller.abort();
  }, [district]);

  useEffect(() => {
    if (!district || !taluka) {
      setVillages([]);
      return;
    }

    const controller = new AbortController();

    setVillages([]);
    setLocationOptionsError('');

    fetchPublicLocationOptions(
      'name',
      [
        { field: 'state', value: PUBLIC_LOCATION_STATE },
        { field: 'district', value: district },
        { field: 'subdistrict', value: taluka },
      ],
      controller.signal
    )
      .then(setVillages)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLocationOptionsError(
            error instanceof Error ? error.message : 'Could not load villages.'
          );
        }
      });

    return () => controller.abort();
  }, [district, taluka]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Layout name, village name..."
            className={fieldClassName}
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-state"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            {t('filters.state')}
          </label>
          <select
            id="hero-state"
            value={state}
            onChange={() => {
              setState(PUBLIC_LOCATION_STATE);
              setDistrict('');
              setTaluka('');
              setVillage('');

              update({
                state: PUBLIC_LOCATION_STATE,
                district: '',
                taluka: '',
                village: '',
              });
            }}
            className={fieldClassName}
          >
            <option value={PUBLIC_LOCATION_STATE}>
              {getLocalizedLocation(PUBLIC_LOCATION_STATE, locale)}
            </option>
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
            onChange={(e) => {
              const value = e.target.value;
              setDistrict(value);
              setTaluka('');
              setVillage('');
              update({ district: value, taluka: '', village: '' });
            }}
            className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">{t('filters.selectDistrict')}</option>
            {districts.map((item) => (
              <option key={item} value={item}>
                {getLocalizedLocation(item, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-taluka"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            {t('filters.taluka')}
          </label>
          <select
            id="hero-taluka"
            value={taluka}
            disabled={!district}
            onChange={(e) => {
              const value = e.target.value;
              setTaluka(value);
              setVillage('');
              update({ taluka: value, village: '' });
            }}
            className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">{t('filters.selectTaluka')}</option>
            {talukas.map((item) => (
              <option key={item} value={item}>
                {getLocalizedLocation(item, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="hero-village"
            className="mb-1.5 block text-xs font-semibold text-white sm:text-sm"
          >
            {t('filters.village')}
          </label>
          <select
            id="hero-village"
            value={village}
            disabled={!district}
            onChange={(e) => {
              setVillage(e.target.value);
              update({ village: e.target.value });
            }}
            className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">{t('filters.selectVillage')}</option>
            {villages.map((item) => (
              <option key={item} value={item}>
                {getLocalizedLocation(item, locale)}
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
            onChange={(e) => {
              setSurveyNumber(e.target.value);
              update({ surveyNumber: e.target.value });
            }}
            placeholder="Enter survey or gat no."
            className={fieldClassName}
          />
        </div>

        <div className="flex min-w-0 items-end">
          <button
            type="button"
            onClick={() => {
              if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
              }

              applyFilters(filtersRef.current);
            }}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-white/80"
          >
            Search Plots / Layouts
          </button>
        </div>
      </div>

      {locationOptionsError && (
        <p role="status" className="mt-2 text-xs text-red-100">
          {locationOptionsError}
        </p>
      )}
    </div>
  );
}