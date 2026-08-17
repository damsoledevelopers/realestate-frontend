'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LayoutImage from '@/components/layouts/LayoutImage';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';
import { useLocale } from '@/context/LocaleContext';

interface PremiumGalleryProps {
  images: string[];
  layoutName: string;
}

export default function PremiumGallery({ images, layoutName }: PremiumGalleryProps) {
  const { t } = useLocale();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxIndex, goNext, goPrev]);

  if (!images.length) return null;

  const masonryPattern = [
    'col-span-2 row-span-2',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-2',
    'col-span-1 row-span-1',
    'col-span-2 row-span-1',
  ];

  return (
    <AnimatedSection className="section-container py-8 lg:py-10">
      <SectionHeading
        eyebrow={t('detail.gallery.eyebrow')}
        title={t('detail.gallery.title')}
        subtitle={t('detail.gallery.subtitle')}
      />

      <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4 lg:gap-4">
        {images.slice(0, 6).map((src, index) => (
          <motion.button
            key={`${src}-${index}`}
            type="button"
            onClick={() => openLightbox(index)}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className={`group relative overflow-hidden rounded-2xl ${masonryPattern[index % masonryPattern.length]}`}
          >
            <LayoutImage
              src={src}
              alt={`${layoutName} gallery ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-110"
              fallbackSeed={`gallery-${index}`}
            />
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
            <div className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 opacity-0 shadow transition group-hover:opacity-100">
              <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </motion.button>
        ))}
      </div>

      {images.length > 6 && (
        <button
          type="button"
          onClick={() => openLightbox(6)}
          className="mt-4 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          {t('detail.gallery.viewAll', { count: images.length })}
        </button>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
            onClick={closeLightbox}
            onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStart === null) return;
              const diff = e.changedTouches[0].clientX - touchStart;
              if (diff > 50) goPrev();
              else if (diff < -50) goNext();
              setTouchStart(null);
            }}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
              aria-label="Close gallery"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 z-10 hidden rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20 sm:block"
              aria-label="Previous image"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative h-[70vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <LayoutImage
                src={images[lightboxIndex]}
                alt={`${layoutName} ${lightboxIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
                fallbackSeed={`lightbox-${lightboxIndex}`}
              />
            </motion.div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 z-10 hidden rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20 sm:block"
              aria-label="Next image"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <p className="absolute bottom-6 text-sm text-white/70">
              {lightboxIndex + 1} / {images.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
