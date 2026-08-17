'use client';

interface PropertyMapEmptyStateProps {
  onRetry?: () => void;
}

export default function PropertyMapEmptyState({ onRetry }: PropertyMapEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl">
        🗺️
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No layouts on the map yet</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Active layout projects with map coordinates will appear here. Add or update layouts from{' '}
        <span className="font-medium">Dashboard → Layouts</span>.
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-6">
          Refresh
        </button>
      )}
    </div>
  );
}
