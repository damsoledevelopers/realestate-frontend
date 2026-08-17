'use client';

import { ALL_PROPERTY_TYPES, PROPERTY_TYPE_COLORS, PROPERTY_TYPE_LABELS } from '@/lib/properties';
import { PropertyType } from '@/lib/types';

interface PropertyMapLegendProps {
  activeTypes: Set<PropertyType>;
  counts: Record<PropertyType, number>;
  onToggle: (type: PropertyType) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function PropertyMapLegend({
  activeTypes,
  counts,
  onToggle,
  onSelectAll,
  onClearAll,
}: PropertyMapLegendProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Property Types</h3>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={onSelectAll}
            className="font-medium text-primary-600 hover:underline"
          >
            All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={onClearAll}
            className="font-medium text-gray-500 hover:underline"
          >
            None
          </button>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {ALL_PROPERTY_TYPES.map((type) => {
          const colors = PROPERTY_TYPE_COLORS[type];
          const isActive = activeTypes.has(type);

          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => onToggle(type)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                  isActive ? 'bg-gray-50 ring-1 ring-gray-200' : 'opacity-50 hover:opacity-80'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border"
                  style={{
                    backgroundColor: isActive ? colors.fill : 'transparent',
                    borderColor: colors.stroke,
                  }}
                />
                <span className="flex-1 font-medium text-gray-800">{PROPERTY_TYPE_LABELS[type]}</span>
                <span className="text-xs text-gray-500">{counts[type] || 0}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
