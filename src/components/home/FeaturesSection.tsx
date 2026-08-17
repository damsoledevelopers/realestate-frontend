'use client';

import { FeaturesCms } from '@/lib/cms';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedFeatureCard } from '@/lib/localizedHome';

interface FeaturesSectionProps {
  features: FeaturesCms;
}

export default function FeaturesSection({ features }: FeaturesSectionProps) {
  const { locale, t } = useLocale();

  return (
    <section className="w-full overflow-x-hidden bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home.why.title')}</h2>
          <p className="mt-2 text-gray-500">{t('home.why.subtitle')}</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.cards.slice(0, 6).map((feature, index) => {
            const card = getLocalizedFeatureCard(feature, locale, t);
            return (
              <div key={`${card.title}-${index}`} className="card text-center transition hover:shadow-md">
                <div className="text-3xl">{card.icon || '✨'}</div>
                <h3 className="mt-3 font-semibold text-primary-700">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
