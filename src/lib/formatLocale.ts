import { AppLocale } from '@/lib/locale';

export function getIntlLocale(locale: AppLocale): string {
  return locale === 'mr' ? 'mr-IN' : 'en-IN';
}

export function formatNumber(value: number, locale: AppLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}

export function formatCurrency(value: number, locale: AppLocale, currency = 'INR') {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(
  value: string | number | Date,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions
) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(date);
}

export function formatDateTime(value: string | number | Date, locale: AppLocale) {
  return formatDate(value, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
