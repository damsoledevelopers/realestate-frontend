'use client';

import { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion, Variants } from 'framer-motion';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import { INQUIRY_SUBJECTS, InquirySubject } from '@/constants/inquiry';
import InquiryRecaptcha from '@/components/contact/InquiryRecaptcha';
import { useCmsSection, mergeCmsData } from '@/hooks/useCmsSection';
import { useLocale } from '@/context/LocaleContext';
import { getInquirySubjectLabel, getLocalizedContact } from '@/lib/localizedCms';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: 'General Inquiry' as InquirySubject,
  message: '',
};

// Motion Variants for Staggered Field Reveal
const formContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const formFieldVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ContactPage() {
  const { t, locale } = useLocale();
  const { data: cmsData } = useCmsSection('contact');
  const cmsContact = mergeCmsData('contact', cmsData);
  const contact = getLocalizedContact(cmsContact, locale, t);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const mapSrc =
    cmsContact.mapEmbedUrl ||
    (cmsContact.address
      ? `https://maps.google.com/maps?q=${encodeURIComponent(cmsContact.address)}&output=embed`
      : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (siteKey && !recaptchaToken) {
      notify.warning(t('contact.form.recaptcha'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/inquiries', {
        ...form,
        recaptchaToken: recaptchaToken || undefined,
      });
      setSubmitted(true);
      setForm(initialForm);
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
      notify.success(t('contact.form.successNotify'));
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('contact.form.failNotify')));
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Header Section with Blur-to-Clear & Slide Animation */}
      <motion.div
        initial={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold transition-colors duration-300 hover:text-primary-900 sm:text-4xl">
          {contact.title}
        </h1>
        <p className="mt-2 text-gray-500 sm:text-base">{contact.subtitle}</p>
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Left Column: Contact Information & Google Map */}
        <div className="space-y-6">
          {/* Contact Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="card group space-y-4 transition-all duration-500 ease-out hover:-translate-y-2 hover:border-primary-200 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)]"
          >
            <h2 className="font-semibold transition-colors duration-200 group-hover:text-primary-950">
              {t('contact.contactInfo')}
            </h2>

            {contact.phone && (
              <p className="group/item flex items-center gap-2 text-sm transition-transform duration-200 hover:translate-x-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-primary-600 group-hover/item:text-white group-hover/item:shadow-md">
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover/item:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <span className="font-medium text-gray-700">{t('contact.phone')}:</span>{' '}
                <a href={`tel:${contact.phone}`} className="text-primary-600 transition-all duration-200 hover:text-primary-700 hover:underline">
                  {contact.phone}
                </a>
              </p>
            )}

            {contact.email && (
              <p className="group/item flex items-center gap-2 text-sm transition-transform duration-200 hover:translate-x-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-primary-600 group-hover/item:text-white group-hover/item:shadow-md">
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover/item:-rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="font-medium text-gray-700">{t('contact.email')}:</span>{' '}
                <a href={`mailto:${contact.email}`} className="text-primary-600 transition-all duration-200 hover:text-primary-700 hover:underline">
                  {contact.email}
                </a>
              </p>
            )}

            {contact.address && (
              <p className="group/item flex items-start gap-2 text-sm transition-transform duration-200 hover:translate-x-1">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-primary-600 group-hover/item:text-white group-hover/item:shadow-md">
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover/item:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span>
                  <span className="font-medium text-gray-700">{t('contact.address')}:</span> {contact.address}
                </span>
              </p>
            )}

            {contact.hours && (
              <p className="group/item flex items-center gap-2 text-sm transition-transform duration-200 hover:translate-x-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-primary-600 group-hover/item:text-white group-hover/item:shadow-md">
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover/item:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="font-medium text-gray-700">{t('contact.hours')}:</span> {contact.hours}
              </p>
            )}
          </motion.div>

          {/* Google Map Wrapper */}
          {mapSrc && (
            <motion.div
              initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="group overflow-hidden rounded-2xl border border-gray-200 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)]"
            >
              <iframe
                title={t('contact.mapTitle')}
                src={mapSrc}
                className="h-64 w-full border-0 transition-transform duration-700 group-hover:scale-[1.02]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </motion.div>
          )}
        </div>

        {/* Right Column: Contact Form or Success State */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {submitted ? (
            <div className="card flex flex-col items-center justify-center py-12 text-center transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 transition-transform duration-500 hover:scale-110 hover:rotate-6">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{t('contact.form.successTitle')}</h2>
              <p className="mt-2 max-w-sm text-sm text-gray-500">{t('contact.form.successBody')}</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="btn-secondary mt-6 transform transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
              >
                {t('contact.form.sendAnother')}
              </button>
            </div>
          ) : (
            <motion.form
              variants={formContainerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
              className="card relative overflow-hidden space-y-4 transition-all duration-500 hover:-translate-y-2 hover:border-gray-300 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]"
            >
              {/* Subtle Shimmer Line */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100" />

              <motion.div variants={formFieldVariants} className="group/field">
                <label className="mb-1 block text-sm font-medium transition-colors group-focus-within/field:text-primary-800">
                  {t('contact.form.name')}
                </label>
                <input
                  className="input-field transform transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus:-translate-y-0.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </motion.div>

              <motion.div variants={formFieldVariants} className="group/field">
                <label className="mb-1 block text-sm font-medium transition-colors group-focus-within/field:text-primary-800">
                  {t('contact.form.email')}
                </label>
                <input
                  type="email"
                  className="input-field transform transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus:-translate-y-0.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </motion.div>

              <motion.div variants={formFieldVariants} className="group/field">
                <label className="mb-1 block text-sm font-medium transition-colors group-focus-within/field:text-primary-800">
                  {t('contact.form.phone')}
                </label>
                <input
                  type="tel"
                  className="input-field transform transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus:-translate-y-0.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </motion.div>

              <motion.div variants={formFieldVariants} className="group/field">
                <label className="mb-1 block text-sm font-medium transition-colors group-focus-within/field:text-primary-800">
                  {t('contact.form.subject')}
                </label>
                <select
                  className="input-field transform transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus:-translate-y-0.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value as InquirySubject })
                  }
                  required
                >
                  {INQUIRY_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {getInquirySubjectLabel(subject, t)}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div variants={formFieldVariants} className="group/field">
                <label className="mb-1 block text-sm font-medium transition-colors group-focus-within/field:text-primary-800">
                  {t('contact.form.message')}
                </label>
                <textarea
                  className="input-field transform transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus:-translate-y-0.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </motion.div>

              <motion.div variants={formFieldVariants}>
                <InquiryRecaptcha ref={recaptchaRef} onChange={setRecaptchaToken} />
              </motion.div>

              <motion.div variants={formFieldVariants} className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
                >
                  {loading ? t('contact.form.sending') : t('contact.form.send')}
                </button>
              </motion.div>
            </motion.form>
          )}
        </motion.div>
      </div>
    </div>
  );
}