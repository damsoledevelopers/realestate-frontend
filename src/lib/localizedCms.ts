import { AboutCms, ContactCms } from '@/lib/cms';
import { AppLocale } from '@/lib/locale';
import { TranslationKey } from '@/lib/i18n';
import { transliterateAddressToMarathi } from '@/lib/localizedText';
import { InquirySubject } from '@/constants/inquiry';

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

const HOURS_TRANSLATIONS: Record<string, TranslationKey> = {
  'Mon–Sat: 9:00 AM – 6:00 PM': 'contact.hours.default',
  'Mon-Sat: 9:00 AM - 6:00 PM': 'contact.hours.default',
};

export const INQUIRY_SUBJECT_KEYS: Record<InquirySubject, TranslationKey> = {
  'General Inquiry': 'contact.subject.general',
  'Plot Inquiry': 'contact.subject.plot',
  'Site Visit Request': 'contact.subject.siteVisit',
  Other: 'contact.subject.other',
};

export function getLocalizedAbout(about: AboutCms, locale: AppLocale, t: TranslateFn): AboutCms {
  if (locale !== 'mr') return about;

  return {
    ...about,
    title: t('about.title'),
    description: t('about.description'),
  };
}

export function getLocalizedContact(
  contact: ContactCms,
  locale: AppLocale,
  t: TranslateFn
): ContactCms {
  if (locale !== 'mr') return contact;

  const hoursKey = HOURS_TRANSLATIONS[contact.hours.trim()];
  const localizedHours = hoursKey ? t(hoursKey) : contact.hours;

  return {
    ...contact,
    title: t('contact.title'),
    subtitle: t('contact.subtitle'),
    address: contact.address ? transliterateAddressToMarathi(contact.address) : contact.address,
    hours: localizedHours,
  };
}

export function getInquirySubjectLabel(subject: InquirySubject, t: TranslateFn): string {
  return t(INQUIRY_SUBJECT_KEYS[subject]);
}
