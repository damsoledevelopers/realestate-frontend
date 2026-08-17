'use client';

import ConstructionStatusBadge, {
  ConstructionStatusSelect,
} from '@/components/plots/ConstructionStatusBadge';
import { ConstructionStatus } from '@/lib/constructionStatusConfig';

interface ConstructionStatusFieldProps {
  value?: string | null;
  onChange?: (value: ConstructionStatus) => void;
  canEdit?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md';
  selectClassName?: string;
}

/**
 * Read-only badge for viewers; editable select for authorized layout managers.
 */
export default function ConstructionStatusField({
  value,
  onChange,
  canEdit = false,
  disabled = false,
  loading = false,
  size = 'sm',
  selectClassName = 'rounded border px-2 py-1 text-xs',
}: ConstructionStatusFieldProps) {
  if (!canEdit || !onChange) {
    return <ConstructionStatusBadge status={value} size={size} showPattern />;
  }

  return (
    <ConstructionStatusSelect
      value={value}
      onChange={onChange}
      disabled={disabled || loading}
      className={`${selectClassName} ${loading ? 'opacity-60' : ''}`}
    />
  );
}
