'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';
import { useLocale } from '@/context/LocaleContext';

const TESTIMONIAL_META = [
  { name: 'Rajesh Kumar', reviewKey: 'detail.testimonial1.review', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { name: 'Priya Sharma', reviewKey: 'detail.testimonial2.review', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
  { name: 'Anil Mehta', reviewKey: 'detail.testimonial3.review', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
] as const;

export default function TestimonialsSection() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);

  const testimonials = useMemo(
    () =>
      TESTIMONIAL_META.map((item) => ({
        ...item,
        review: t(item.reviewKey),
        rating: 5,
      })),
    [t]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const testimonial = testimonials[active];

  return (
    <AnimatedSection className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 py-8 lg:py-10">
      <div className="section-container">
        <SectionHeading
          eyebrow={t('detail.testimonials.eyebrow')}
          title={t('detail.testimonials.title')}
          subtitle={t('detail.testimonials.subtitle')}
          align="center"
          light
        />

        <div className="relative mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md sm:p-10"
            >
              <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border-4 border-white/20">
                <Image src={testimonial.photo} alt={testimonial.name} fill sizes="80px" className="object-cover" />
              </div>
              <div className="mt-4 flex justify-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <p className="mt-6 text-lg leading-relaxed text-white/85">&ldquo;{testimonial.review}&rdquo;</p>
              <p className="mt-6 font-bold text-white">{testimonial.name}</p>
              <p className="text-sm text-white/50">{t('detail.testimonials.verified')}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2 rounded-full transition-all ${
                  index === active ? 'w-8 bg-accent' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

function StarIcon() {
  return (
    <svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
