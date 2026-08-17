'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useLocaleConfig } from '@/context/LocaleConfigContext';
import { AppLocale } from '@/lib/locale';

interface LanguageSwitcherProps {
  /** dark = transparent navbar on home hero; default = white navbar */
  variant?: 'dark' | 'default' | 'field';
  className?: string;
}

export default function LanguageSwitcher({
  variant = 'default',
  className = '',
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const { enabledLocales, labels } = useLocaleConfig();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = enabledLocales.map((value) => ({
    value,
    label: labels[value] || value,
  }));

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const currentLabel = labels[locale] || labels.en;

  const triggerClass =
    variant === 'dark'
      ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
      : variant === 'field'
        ? 'input-field w-full justify-between'
        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50';

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${triggerClass}`}
        aria-label={t('common.language')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{currentLabel}</span>
        <span className="text-[10px] opacity-80" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-[60] mt-1 min-w-[8.5rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={locale === option.value}
              onClick={() => {
                setLocale(option.value as AppLocale);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm ${
                locale === option.value
                  ? 'bg-primary-50 font-semibold text-primary-700'
                  : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
