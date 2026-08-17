'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HeroCms } from '@/lib/cms';
import HeroSearchFilter from '@/components/home/HeroSearchFilter';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedHero } from '@/lib/localizedHome';

interface HeroProps {
  hero: HeroCms;
}

function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2" aria-hidden="true">
      <div className="flex h-11 w-7 items-start justify-center rounded-full border-2 border-white/30 p-1.5">
        <div className="h-2 w-1 animate-bounce rounded-full bg-white/70" />
      </div>
    </div>
  );
}

export default function Hero({ hero }: HeroProps) {
  const { locale, t } = useLocale();
  const content = getLocalizedHero(hero, locale, t);
  const hasImage = Boolean(content.backgroundImage);

  return (
    <section className="relative flex min-h-[100dvh] w-full max-w-full flex-col items-center justify-center bg-black px-4 pb-24 pt-20 text-white sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      {hasImage ? (
        <>
          <Image
            src={content.backgroundImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-emerald-950/40 to-emerald-900/60"
          aria-hidden
        />
      )}

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-4xl text-center">
        {content.badge && (
          <span className="mx-auto inline-block max-w-full rounded-2xl bg-[#c8ff00] px-3 py-1.5 text-[11px] font-semibold leading-snug text-black sm:rounded-full sm:px-4 sm:text-sm">
            {content.badge}
          </span>
        )}

        <h1 className="mt-5 text-balance text-[1.75rem] font-bold leading-[1.15] tracking-tight sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
          {content.title}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-gray-300 sm:mt-6 sm:text-base md:text-lg lg:text-xl">
          {content.subtitle}
        </p>

        <div className="mt-8 w-full min-w-0 sm:mt-10">
          <div className="flex flex-col items-stretch gap-6 sm:items-center sm:gap-8">
            <Link
              href={content.ctaLink || '/layouts'}
              className="mx-auto inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#c8ff00] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#b8ef00] focus:outline-none focus:ring-2 focus:ring-[#c8ff00] focus:ring-offset-2 focus:ring-offset-black sm:w-auto sm:max-w-none sm:px-8 sm:py-3.5 sm:text-base"
            >
              {content.ctaText || t('home.hero.cta')}
            </Link>

            <HeroSearchFilter />
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
