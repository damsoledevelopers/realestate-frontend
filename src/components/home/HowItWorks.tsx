'use client';

import { useLocale } from '@/context/LocaleContext';
import { TranslationKey } from '@/lib/i18n';

const STEPS: { step: string; icon: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  {
    step: '01',
    icon: '🗺️',
    titleKey: 'home.how.step1.title',
    descKey: 'home.how.step1.desc',
  },
  {
    step: '02',
    icon: '📍',
    titleKey: 'home.how.step2.title',
    descKey: 'home.how.step2.desc',
  },
  {
    step: '03',
    icon: '✅',
    titleKey: 'home.how.step3.title',
    descKey: 'home.how.step3.desc',
  },
];

export default function HowItWorks() {
  const { t } = useLocale();

  return (
    <section className="w-full overflow-x-hidden bg-gray-100 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home.how.title')}</h2>
          <p className="mt-2 text-gray-500">{t('home.how.subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((item, index) => (
            <div key={item.step} className="relative card text-center">
              {index < STEPS.length - 1 && (
                <span
                  className="absolute right-0 top-1/2 hidden h-0.5 w-8 translate-x-full -translate-y-1/2 bg-primary-200 md:block lg:w-12"
                  aria-hidden
                />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                {t('home.how.stepLabel', { step: item.step })}
              </span>
              <div className="mt-4 text-4xl">{item.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-primary-800">{t(item.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
