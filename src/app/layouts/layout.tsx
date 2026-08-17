import type { Metadata } from 'next';
import { getOgImageUrl, SITE_NAME } from '@/lib/site';

const ogImage = getOgImageUrl();

export const metadata: Metadata = {
  title: 'Browse Available Properties',
  description:
    'Explore land layouts, compare starting prices, and find available plots across premium real estate projects.',
  openGraph: {
    title: 'Browse Available Properties | Real Estate Plot Management',
    description:
      'Explore land layouts, compare starting prices, and find available plots across premium real estate projects.',
    type: 'website',
    images: [{ url: ogImage, width: 1200, height: 630, alt: `${SITE_NAME} — Layouts` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Available Properties',
    description:
      'Explore land layouts and find available plots across premium real estate projects.',
    images: [ogImage],
  },
};

export default function LayoutsSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50/50 selection:bg-primary-500 selection:text-white">
      {/* Background Decorative Gradient Blobs (Static Design Polish) */}
      <div 
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 overflow-hidden opacity-40 blur-3xl" 
        aria-hidden="true"
      >
        <div className="absolute -left-10 top-10 h-72 w-72 rounded-full bg-primary-200/50 mix-blend-multiply" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-blue-100/60 mix-blend-multiply" />
      </div>

      {/* Main Section Content Wrapper with Entrance Animation */}
      <main className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
        {children}
      </main>
    </div>
  );
}