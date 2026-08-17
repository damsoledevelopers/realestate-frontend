'use client';

import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';

export default function ContactCta() {
  const { t } = useLocale();

  return (
    <section className="w-full overflow-x-hidden bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-3xl text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('home.cta.title')}</h2>
        <p className="mt-4 text-primary-100">{t('home.cta.subtitle')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/layouts" className="btn-primary bg-white text-primary-700 hover:bg-primary-50">
            {t('home.cta.browse')}
          </Link>
          <Link
            href="/contact"
            className="btn-secondary border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            {t('home.cta.contact')}
          </Link>
        </div>
      </div>
    </section>
  );
}
