'use client';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';

  return (
    <div className={`mb-6 max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p
          className={`mb-2 text-sm font-semibold uppercase tracking-widest ${
            light ? 'text-primary-300' : 'text-primary-600'
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base leading-relaxed ${light ? 'text-white/75' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
