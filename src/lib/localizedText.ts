import { AppLocale } from '@/lib/locale';
import { phoneticLatinToMarathi, phoneticLayoutNameToMarathi } from '@/lib/romanPhonetic';

/** Common Indian address terms — longest matches first when applying. */
const ADDRESS_TERM_MAP: [string, string][] = [
  ['Pimpalner', 'पिंपळनेर'],
  ['Sakri', 'साक्री'],
  ['Pimpalner-Sakri Road', 'पिंपळनेर-साक्री रोड'],
  ['Kalyan-Shil Road', 'कल्याण-शिल रोड'],
  ['Gangapur Road', 'गंगापूर रोड'],
  ['Green Valley Road', 'ग्रीन व्हॅली रोड'],
  ['Maharashtra', 'महाराष्ट्र'],
  ['Mallanjan', 'मल्लनजान'],
  ['Hinjewadi', 'हिंजेवाडी'],
  ['Sunrise Meadows', 'सनराइज मेडोज'],
  ['Royal Gardens', 'रॉयल गार्डन्स'],
  ['Green Valley', 'ग्रीन व्हॅली'],
  ['Mumbai', 'मुंबई'],
  ['Nashik', 'नाशिक'],
  ['Dhule', 'धुळे'],
  ['Pune', 'पुणे'],
  ['Road', 'रोड'],
  ['Layout', 'लेआउट'],
  ['Nagar', 'नगर'],
  ['Street', 'रस्ता'],
  ['Main Street', 'मेन स्ट्रीट'],
  ['City', 'सिटी'],
  ['Lane', 'लेन'],
];

const sortedAddressTerms = [...ADDRESS_TERM_MAP].sort((a, b) => b[0].length - a[0].length);

function applyTermMap(text: string, terms: [string, string][]): string {
  let result = text;
  for (const [english, marathi] of terms) {
    const pattern = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(pattern, marathi);
  }
  return result;
}

function localizeLatinSegments(text: string, terms: [string, string][]): string {
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim() || !/[a-zA-Z]/.test(part)) return part;
      const mapped = applyTermMap(part, terms);
      if (mapped.toLowerCase() === part.toLowerCase()) {
        return phoneticLatinToMarathi(part);
      }
      if (/[a-zA-Z]/.test(mapped)) {
        return phoneticLatinToMarathi(mapped);
      }
      return mapped;
    })
    .join('');
}

export function transliterateAddressToMarathi(address: string): string {
  return localizeLatinSegments(address, sortedAddressTerms);
}

export function getLocalizedLocation(
  location: string,
  locale: AppLocale,
  locationMr?: string | null
): string {
  if (locale !== 'mr') return location;
  if (locationMr?.trim()) return locationMr.trim();
  return transliterateAddressToMarathi(location);
}

/** Layout names in Marathi: phonetic Devanagari only (e.g. Example → एक्झाम्पल), not meaning translation. */
export function getLocalizedLayoutName(
  name: string,
  locale: AppLocale,
  nameMr?: string | null
): string {
  if (locale !== 'mr') return name;
  if (nameMr?.trim()) return nameMr.trim();

  const trimmed = name.trim();
  const withoutLayoutSuffix = trimmed.replace(/\s+layout$/i, '').trim();
  const nameToTransliterate = withoutLayoutSuffix || trimmed;

  return phoneticLayoutNameToMarathi(nameToTransliterate);
}

export function getLayoutDisplayName(
  layout: { name: string; nameMr?: string | null },
  locale: AppLocale
): string {
  return getLocalizedLayoutName(layout.name, locale, layout.nameMr);
}

export type LocationOption = {
  value: string;
  label: string;
};

/** Location dropdown options: English `value` for filtering, localized `label` for display. */
export function getLocationOptions(
  layouts: { location?: string; locationMr?: string | null; name?: string; nameMr?: string | null }[],
  locale: AppLocale
): LocationOption[] {
  const options = new Map<string, string>();

  for (const layout of layouts) {
    const value = layout.location?.trim();
    if (!value || options.has(value)) continue;
    options.set(value, getLocalizedLocation(value, locale, layout.locationMr));
  }

  return Array.from(options.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, locale === 'mr' ? 'mr' : 'en'));
}
