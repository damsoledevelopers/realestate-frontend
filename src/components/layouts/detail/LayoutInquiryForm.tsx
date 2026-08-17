'use client';

import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion, Variants } from 'framer-motion';
import { api, getApiErrorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';
import InquiryRecaptcha from '@/components/contact/InquiryRecaptcha';
import AnimatedSection from '@/components/layouts/detail/AnimatedSection';
import SectionHeading from '@/components/layouts/detail/SectionHeading';
import { useLocale } from '@/context/LocaleContext';

interface LayoutInquiryFormProps {
  layoutName: string;
  defaultSubject?: string;
}

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const formContainerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const formFieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function LayoutInquiryForm({
  layoutName,
  defaultSubject = 'Plot Inquiry',
}: LayoutInquiryFormProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      message: t('detail.inquiry.defaultMessage', { name: layoutName }),
    }));
  }, [layoutName, t]);

  const submitInquiry = async (subject: string) => {
    if (siteKey && !recaptchaToken) {
      notify.warning('Please complete the reCAPTCHA verification');
      return;
    }

    setLoading(true);
    try {
      await api.post('/inquiries', {
        ...form,
        subject,
        recaptchaToken: recaptchaToken || undefined,
      });
      setSubmitted(true);
      notify.success('Thank you! Our team will contact you shortly.');
      setForm({
        name: '',
        email: '',
        phone: '',
        message: t('detail.inquiry.defaultMessage', { name: layoutName }),
      });
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, 'Submission failed'));
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInquiry(defaultSubject);
  };

  return (
    <AnimatedSection id="layout-inquiry" className="section-container py-8 lg:py-10">
      {/* 
        Card container with increased translateY lift, smooth scaling, 
        and dramatic black box shadow enhancement on hover
      */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="group/card overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 to-primary-900 shadow-xl shadow-black/20 ring-1 ring-white/10 transition-all duration-500 ease-out hover:-translate-y-3 hover:scale-[1.015] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] hover:ring-white/20"
      >
        <div className="grid lg:grid-cols-2">
          {/* Left Column: Offer Details & Benefits */}
          <div className="p-8 sm:p-10 lg:p-12">
            <SectionHeading
              eyebrow={t('detail.inquiry.eyebrow')}
              title={t('detail.inquiry.title')}
              subtitle={t('detail.inquiry.subtitle')}
              light
            />
            <motion.ul
              variants={listContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4 text-white/75"
            >
              <motion.li
                variants={listItemVariants}
                className="group/item flex items-center gap-3 transition-transform duration-300 hover:translate-x-2.5 hover:text-white"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-white/20 group-hover/item:shadow-lg group-hover/item:shadow-black/30">
                  <CheckIcon />
                </span>
                <span className="font-medium text-sm sm:text-base">{t('detail.inquiry.benefit1')}</span>
              </motion.li>

              <motion.li
                variants={listItemVariants}
                className="group/item flex items-center gap-3 transition-transform duration-300 hover:translate-x-2.5 hover:text-white"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-white/20 group-hover/item:shadow-lg group-hover/item:shadow-black/30">
                  <CheckIcon />
                </span>
                <span className="font-medium text-sm sm:text-base">{t('detail.inquiry.benefit2')}</span>
              </motion.li>

              <motion.li
                variants={listItemVariants}
                className="group/item flex items-center gap-3 transition-transform duration-300 hover:translate-x-2.5 hover:text-white"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-white/20 group-hover/item:shadow-lg group-hover/item:shadow-black/30">
                  <CheckIcon />
                </span>
                <span className="font-medium text-sm sm:text-base">{t('detail.inquiry.benefit3')}</span>
              </motion.li>
            </motion.ul>
          </div>

          {/* Right Column: Form Container */}
          <div className="bg-white p-8 sm:p-10 lg:p-12 transition-all duration-300">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="flex h-full flex-col items-center justify-center py-12 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 shadow-md transition-transform duration-500 hover:scale-110 hover:rotate-6">
                  <CheckIcon />
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">{t('detail.inquiry.received')}</h3>
                <p className="mt-2 text-gray-500">{t('detail.inquiry.followUp')}</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm font-semibold text-primary-700 transition-all duration-200 hover:scale-105 hover:underline"
                >
                  {t('detail.inquiry.another')}
                </button>
              </motion.div>
            ) : (
              <motion.form
                variants={formContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <motion.div variants={formFieldVariants}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('detail.inquiry.fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field transition-all duration-300 hover:border-gray-400 focus:ring-2 focus:ring-primary-500/20 hover:shadow-md hover:shadow-black/5"
                    placeholder={t('detail.inquiry.namePlaceholder')}
                  />
                </motion.div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <motion.div variants={formFieldVariants}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('detail.inquiry.phone')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-field transition-all duration-300 hover:border-gray-400 focus:ring-2 focus:ring-primary-500/20 hover:shadow-md hover:shadow-black/5"
                      placeholder="+91 98765 43210"
                    />
                  </motion.div>

                  <motion.div variants={formFieldVariants}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('detail.inquiry.email')}
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field transition-all duration-300 hover:border-gray-400 focus:ring-2 focus:ring-primary-500/20 hover:shadow-md hover:shadow-black/5"
                      placeholder="you@email.com"
                    />
                  </motion.div>
                </div>

                <motion.div variants={formFieldVariants}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('detail.inquiry.message')}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input-field resize-none transition-all duration-300 hover:border-gray-400 focus:ring-2 focus:ring-primary-500/20 hover:shadow-md hover:shadow-black/5"
                    placeholder={t('detail.inquiry.messagePlaceholder')}
                  />
                </motion.div>

                <motion.div variants={formFieldVariants}>
                  <InquiryRecaptcha ref={recaptchaRef} onChange={setRecaptchaToken} />
                </motion.div>

                {/* Interactive Action Buttons with Increased Translate Lift and Black Shadow Depth */}
                <motion.div variants={formFieldVariants} className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 transform transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 active:scale-[0.98]"
                  >
                    {loading ? t('detail.inquiry.sending') : t('detail.inquiry.bookVisit')}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submitInquiry('Site Visit Request')}
                    className="btn-secondary flex-1 transform transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-400 hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]"
                  >
                    {t('detail.inquiry.callback')}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submitInquiry('Plot Inquiry')}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-800 transform transition-all duration-300 hover:-translate-y-1.5 hover:bg-primary-100 hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]"
                  >
                    {t('detail.downloadBrochure')}
                  </button>
                </motion.div>
              </motion.form>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-primary-300 transition-transform duration-300 group-hover/item:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}