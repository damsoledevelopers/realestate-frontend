'use client';

import { motion } from 'framer-motion';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';

const INVESTMENT_BENEFITS = [
  {
    title: 'Prime Location',
    description: 'Strategically positioned in a high-demand corridor with excellent connectivity and lifestyle amenities nearby.',
    icon: LocationIcon,
    gradient: 'from-emerald-500 to-primary-700',
  },
  {
    title: 'Future Growth Potential',
    description: 'Located in an emerging growth zone with infrastructure development driving long-term appreciation.',
    icon: GrowthIcon,
    gradient: 'from-primary-600 to-emerald-600',
  },
  {
    title: 'Approved Layout',
    description: 'Fully approved layout with clear titles, legal documentation, and transparent ownership process.',
    icon: ApprovedIcon,
    gradient: 'from-primary-700 to-primary-900',
  },
  {
    title: 'High ROI Opportunity',
    description: 'Attractive entry pricing with strong rental and resale potential in a rapidly developing area.',
    icon: RoiIcon,
    gradient: 'from-accent to-orange-600',
  },
  {
    title: 'Road Connectivity',
    description: 'Direct access to major roads and highways, ensuring seamless commute to city centers.',
    icon: RoadIcon,
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    title: 'Loan Availability',
    description: 'Partner banks offer competitive home loan options with flexible EMI plans for plot buyers.',
    icon: LoanIcon,
    gradient: 'from-blue-600 to-indigo-700',
  },
];

export default function WhyInvestSection() {
  return (
    <AnimatedSection className="bg-white py-16 lg:py-20">
      <div className="section-container">
        <SectionHeading
          eyebrow="Investment"
          title="Why Invest Here"
          subtitle="Discover what makes this layout a smart choice for discerning investors and homebuyers."
          align="center"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {INVESTMENT_BENEFITS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-surface p-6 shadow-sm transition-shadow hover:shadow-premium"
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg transition group-hover:scale-110`}
                >
                  <Icon />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-primary-50 opacity-0 transition group-hover:opacity-100" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

function LocationIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    </svg>
  );
}

function GrowthIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function ApprovedIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function RoiIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RoadIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function LoanIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}
