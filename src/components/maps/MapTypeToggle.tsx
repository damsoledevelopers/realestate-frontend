'use client';

import { MapStyleId, MAP_STYLE_LABELS } from '@/lib/maplibre';

interface MapTypeToggleProps {
  mapStyleId: MapStyleId;
  onChange: (styleId: MapStyleId) => void;
  styles?: MapStyleId[];
}

export default function MapTypeToggle({
  mapStyleId,
  onChange,
  styles = ['street', 'satellite'],
}: MapTypeToggleProps) {
  return (
    <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      {styles.map((styleId) => (
        <button
          key={styleId}
          type="button"
          onClick={() => onChange(styleId)}
          className={`px-4 py-2 text-sm font-semibold transition ${
            mapStyleId === styleId
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {MAP_STYLE_LABELS[styleId]}
        </button>
      ))}
    </div>
  );
}
