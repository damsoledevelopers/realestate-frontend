'use client';

import AboutDecorativeBg from '@/components/about/AboutDecorativeBg';
import AboutHeroSection from '@/components/about/AboutHeroSection';
import AboutPrinciplesSection from '@/components/about/AboutPrinciplesSection';
import { useCmsSection, mergeCmsData } from '@/hooks/useCmsSection';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedAbout } from '@/lib/localizedCms';

export default function AboutPage() {
  const { locale, t } = useLocale();
  const { data } = useCmsSection('about');
  const about = getLocalizedAbout(mergeCmsData('about', data), locale, t);

  return (
    <div className="relative min-w-0 overflow-x-hidden bg-surface">
      <AboutDecorativeBg />
      <div className="relative">
        <AboutHeroSection about={about} t={t} />
        <AboutPrinciplesSection t={t} />
      </div>
    </div>
  );
}
