'use client';

import { useState } from 'react';
import { formatPropertyPrice } from '@/lib/properties';
import type { PricingEntityType } from '@/lib/types';
import PropertyPricingModal from '@/components/pricing/PropertyPricingModal';
import { Pencil } from 'lucide-react';

interface PropertyPriceCellProps {
  entityType: PricingEntityType;
  entityId: string;
  entityLabel: string;
  price: number | null | undefined;
  canManage?: boolean;
  onUpdated?: () => void;
  compact?: boolean;
}

export default function PropertyPriceCell({
  entityType,
  entityId,
  entityLabel,
  price,
  canManage = false,
  onUpdated,
  compact = false,
}: PropertyPriceCellProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={`flex items-center gap-2 ${compact ? '' : 'min-w-[8rem]'}`}>
        <span className={price == null ? 'text-gray-400 italic' : 'font-medium text-gray-900'}>
          {formatPropertyPrice(price ?? null, 'On request')}
        </span>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
            aria-label={`Update price for ${entityLabel}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showModal && (
        <PropertyPricingModal
          entityType={entityType}
          entityId={entityId}
          entityLabel={entityLabel}
          currentPrice={price ?? null}
          canManage={canManage}
          onClose={() => setShowModal(false)}
          onUpdated={() => {
            onUpdated?.();
          }}
        />
      )}
    </>
  );
}
