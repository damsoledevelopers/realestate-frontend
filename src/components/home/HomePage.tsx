'use client';

import Hero from '@/components/home/Hero';
import StatsSection from '@/components/home/StatsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import FeaturedLayouts from '@/components/home/FeaturedLayouts';
import HowItWorks from '@/components/home/HowItWorks';
import ContactCta from '@/components/home/ContactCta';
import { useCmsSection, mergeCmsData } from '@/hooks/useCmsSection';

export default function HomePage() {
  const { data: heroData } = useCmsSection('hero');
  const { data: featuresData } = useCmsSection('features');
  const hero = mergeCmsData('hero', heroData);
  const features = mergeCmsData('features', featuresData);

  return (
    <div className="min-w-0 overflow-x-hidden">
      <Hero hero={hero} />
      <StatsSection />
      <FeaturesSection features={features} />
      <FeaturedLayouts />
      <HowItWorks />
      <ContactCta />
    </div>
  );
}
