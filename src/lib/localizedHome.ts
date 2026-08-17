import { FeatureCard, HeroCms } from '@/lib/cms';
import { AppLocale } from '@/lib/locale';
import { TranslationKey } from '@/lib/i18n';

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

const FEATURE_CARD_KEYS: Record<string, { title: TranslationKey; desc: TranslationKey }> = {
  'Interactive Maps': { title: 'home.why.maps.title', desc: 'home.why.maps.desc' },
  'Easy Booking': { title: 'home.why.booking.title', desc: 'home.why.booking.desc' },
  'Google Maps': { title: 'home.why.googleMaps.title', desc: 'home.why.googleMaps.desc' },
  'Verified Layouts': { title: 'home.why.verified.title', desc: 'home.why.verified.desc' },
  'Expert Support': { title: 'home.why.support.title', desc: 'home.why.support.desc' },
  'Secure Process': { title: 'home.why.secure.title', desc: 'home.why.secure.desc' },
};

export function getLocalizedHero(hero: HeroCms, locale: AppLocale, t: TranslateFn): HeroCms {
  if (locale !== 'mr') return hero;

  return {
    ...hero,
    badge: t('home.hero.badge'),
    title: t('home.hero.title'),
    subtitle: t('home.hero.subtitle'),
    ctaText: t('home.hero.cta'),
  };
}

export function getLocalizedFeatureCard(
  card: FeatureCard,
  locale: AppLocale,
  t: TranslateFn
): FeatureCard {
  if (locale !== 'mr') return card;

  const keys = FEATURE_CARD_KEYS[card.title];
  if (!keys) return card;

  return {
    ...card,
    title: t(keys.title),
    description: t(keys.desc),
  };
}
