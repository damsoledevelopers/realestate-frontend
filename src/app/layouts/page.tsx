import { Suspense } from 'react';
import LayoutCardSkeleton from '@/components/layouts/LayoutCardSkeleton';
import LayoutsPageContent from './LayoutsPageContent';

export default function LayoutsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <section className="bg-gradient-to-br from-primary-800 to-primary-600 px-4 py-16 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Browse Available Properties
              </h1>
            </div>
          </section>
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <LayoutCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <LayoutsPageContent />
    </Suspense>
  );
}
