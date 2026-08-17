'use client';

import {
  ConstructionStatus,
  getConstructionStatusDefinition,
  normalizeConstructionStatus,
} from '@/lib/constructionStatusConfig';
import { useLocale } from '@/context/LocaleContext';

export type { ConstructionStatus };

interface ConstructionStatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md';
  className?: string;
  showPattern?: boolean;
}

function useConstructionStatusLabel(status?: string | null) {
  const { t } = useLocale();
  const key = normalizeConstructionStatus(status);
  return t(`construction.${key}`);
}

export default function ConstructionStatusBadge({
  status,
  size = 'sm',
  className = '',
  showPattern = false,
}: ConstructionStatusBadgeProps) {
  const definition = getConstructionStatusDefinition(status);
  const label = useConstructionStatusLabel(status);
  const padding = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding} ${className}`}
      style={{
        backgroundColor: definition.badgeBg,
        color: definition.badgeText,
      }}
      title={label}
    >
      {showPattern && definition.showHatching ? (
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-sm border border-current/20"
          style={{
            backgroundColor: '#e5e7eb',
            backgroundImage: definition.hatchBackground,
            backgroundBlendMode: 'multiply',
          }}
        />
      ) : null}
      {label}
    </span>
  );
}

export function ConstructionStatusSelect({
  value,
  onChange,
  disabled,
  className = '',
}: {
  value?: string | null;
  onChange: (value: ConstructionStatus) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const normalized = normalizeConstructionStatus(value);

  return (
    <select
      value={normalized}
      onChange={(e) => onChange(e.target.value as ConstructionStatus)}
      disabled={disabled}
      className={className || 'rounded border px-2 py-1 text-xs'}
      aria-label={t('property.constructionStatus')}
    >
      {(['empty_plot', 'under_construction', 'construction_completed'] as ConstructionStatus[]).map(
        (key) => (
          <option key={key} value={key}>
            {t(`construction.${key}`)}
          </option>
        )
      )}
    </select>
  );
}
