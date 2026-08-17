'use client';

interface PropertyMapErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function PropertyMapErrorState({ message, onRetry }: PropertyMapErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
        ⚠️
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Unable to load map data</h3>
      <p className="mt-2 max-w-md text-sm text-red-700">{message}</p>
      <button type="button" onClick={onRetry} className="btn-primary mt-6">
        Try Again
      </button>
    </div>
  );
}
