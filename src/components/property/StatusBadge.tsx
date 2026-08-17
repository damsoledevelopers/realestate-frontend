'use client';

import { usePropertyStatusConfig } from '@/context/PropertyStatusConfigContext';
import { useLocale } from '@/context/LocaleContext';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  showIndicator?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  available: 'common.available',
  booked: 'status.bookedFull',
  sold: 'common.sold',
  reserved: 'status.reservedFull',
  active: 'status.active',
  inactive: 'status.inactive',
};

export default function StatusBadge({
  status,
  size = 'sm',
  showIndicator = true,
  className = '',
}: StatusBadgeProps) {
  const { getDefinition, getBadgeStyle, getIndicatorStyle } = usePropertyStatusConfig();
  const { t } = useLocale();

  const definition = getDefinition(status);
  const badgeStyle = getBadgeStyle(status);
  const indicatorStyle = getIndicatorStyle(status);
  const translationKey = STATUS_TRANSLATION_KEYS[status];
  // Prefer DB/config label so Super Admin edits apply; fall back to i18n.
  const label =
    definition.label?.trim() ||
    (translationKey ? t(translationKey) : status);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={badgeStyle}
      title={definition.description || label}
    >
      {showIndicator && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={indicatorStyle}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

export { StatusBadge as StatusBadgeComponent };
