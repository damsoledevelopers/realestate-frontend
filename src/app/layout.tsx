import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { PromptProvider } from '@/context/PromptContext';
import { PropertyStatusConfigProvider } from '@/context/PropertyStatusConfigContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { LocaleConfigProvider } from '@/context/LocaleConfigContext';
import LocalePreferencesSync from '@/components/locale/LocalePreferencesSync';
import LocaleHtmlSync from '@/components/locale/LocaleHtmlSync';
import AppChrome from '@/components/layout/AppChrome';
import { getOgImageUrl, getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

const siteUrl = getSiteUrl();
const ogImage = getOgImageUrl();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_IN',
    images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} overflow-x-hidden`}>
      <body className={`${inter.className} min-w-0 overflow-x-hidden font-sans`}>
        <AuthProvider>
          <LocaleConfigProvider>
            <LocaleProvider>
              <LocaleHtmlSync />
              <PropertyStatusConfigProvider>
                <ConfirmProvider>
                  <PromptProvider>
                    <LocalePreferencesSync />
                    <AppChrome>{children}</AppChrome>
                  </PromptProvider>
                </ConfirmProvider>
              </PropertyStatusConfigProvider>
            </LocaleProvider>
          </LocaleConfigProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
