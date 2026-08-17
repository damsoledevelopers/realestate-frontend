export type CmsSection = 'hero' | 'about' | 'features' | 'footer' | 'contact';

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface HeroCms {
  section: 'hero';
  badge: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  ctaText: string;
  ctaLink: string;
}

export interface AboutCms {
  section: 'about';
  title: string;
  description: string;
  image: string;
}

export interface FeaturesCms {
  section: 'features';
  cards: FeatureCard[];
}

export interface FooterCms {
  section: 'footer';
  companyName: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: SocialLinks;
  copyright: string;
}

export interface ContactCms {
  section: 'contact';
  title: string;
  subtitle: string;
  mapEmbedUrl: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
}

export type CmsData = HeroCms | AboutCms | FeaturesCms | FooterCms | ContactCms;

/** Default About page image when CMS has none set (Unsplash — same source as auth/seed imagery). */
export const ABOUT_SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80';

export const CMS_TABS: { id: CmsSection; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'footer', label: 'Footer' },
  { id: 'contact', label: 'Contact' },
];

export const CMS_DEFAULTS: {
  hero: HeroCms;
  about: AboutCms;
  features: FeaturesCms;
  footer: FooterCms;
  contact: ContactCms;
} = {
  hero: {
    section: 'hero',
    badge: 'A trusted premium land & plot platform',
    title: 'Find Your Perfect Plot',
    subtitle:
      'View Layouts, Plots, Lands, Row Houses & Farms with the help of GNSS Technology',
    backgroundImage: '',
    ctaText: 'View Layouts',
    ctaLink: '/layouts',
  },
  about: {
    section: 'about',
    title: 'Building Trust Through Smart Real Estate Solutions',
    description:
      'We specialize in land development and plot management, helping families and investors find the perfect property with transparent pricing and interactive layout maps.',
    image: ABOUT_SAMPLE_IMAGE,
  },
  features: {
    section: 'features',
    cards: [
      {
        icon: '🗺️',
        title: 'Interactive Maps',
        description: 'Click plots on visual layout maps to view details and pricing.',
      },
      {
        icon: '📋',
        title: 'Easy Booking',
        description: 'Submit booking requests online and track approval status.',
      },
      {
        icon: '📍',
        title: 'Google Maps',
        description: 'See exact property locations with embedded Google Maps.',
      },
    ],
  },
  footer: {
    section: 'footer',
    companyName: 'Real Estate Plot Management',
    address: '123 Main Street, City',
    phone: '+91 98765 43210',
    email: 'info@realestate.com',
    socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '' },
    copyright: '© 2026 Real Estate. All rights reserved.',
  },
  contact: {
    section: 'contact',
    title: 'Contact Us',
    subtitle: 'Get in touch with our team',
    mapEmbedUrl: '',
    address: '123 Main Street, City',
    phone: '+91 98765 43210',
    email: 'info@realestate.com',
    hours: 'Mon–Sat: 9:00 AM – 6:00 PM',
  },
};
