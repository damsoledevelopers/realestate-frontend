'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Copy,
  Share2,
  UserPlus,
  Mail,
  Building2,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import {
  PropertyContactEntityType,
  PropertyContactUser,
} from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import {
  buildWhatsAppUrl,
  copyContactDetails,
  downloadVCard,
  fetchPropertyContact,
  formatContactDetails,
} from '@/lib/propertyContacts';

export interface PropertyContactProps {
  contact?: PropertyContactUser | null;
  entityType?: PropertyContactEntityType;
  entityId?: string;
  propertyName?: string;
  compact?: boolean;
  className?: string;
  showExtendedActions?: boolean;
}

export default function PropertyContact({
  contact: contactProp,
  entityType,
  entityId,
  propertyName,
  compact = false,
  className = '',
  showExtendedActions = false,
}: PropertyContactProps) {
  const { t } = useLocale();
  const [contact, setContact] = useState<PropertyContactUser | null>(contactProp ?? null);
  const [loading, setLoading] = useState(Boolean(entityType && entityId && contactProp === undefined));

  useEffect(() => {
    if (contactProp !== undefined) {
      setContact(contactProp);
      setLoading(false);
      return;
    }

    if (!entityType || !entityId) {
      setContact(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchPropertyContact(entityType, entityId)
      .then((data) => {
        if (!cancelled) setContact(data.contactUser);
      })
      .catch(() => {
        if (!cancelled) setContact(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contactProp, entityType, entityId]);

  const phone = contact?.phone?.trim() || '';
  const whatsappUrl = useMemo(
    () =>
      phone
        ? buildWhatsAppUrl(
            phone,
            propertyName
              ? t('propertyContact.whatsappMessage', { property: propertyName })
              : undefined
          )
        : '',
    [phone, propertyName, t]
  );

  if (loading) {
    return (
      <section
        className={`rounded-2xl border border-gray-200 bg-white p-6 ${className}`}
        aria-label={t('propertyContact.title')}
      >
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" aria-hidden />
          {t('common.loading')}
        </div>
      </section>
    );
  }

  if (!contact?.name?.trim()) {
    return (
      <section
        className={`rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center ${className}`}
        aria-label={t('propertyContact.title')}
      >
        <p className="text-sm text-gray-500">{t('propertyContact.unavailable')}</p>
      </section>
    );
  }

  const handleCopyContact = async () => {
    try {
      await copyContactDetails(contact, {
        phone: t('propertyContact.mobile'),
        email: t('propertyContact.email'),
      });
      notify.success(t('propertyContact.copiedContact'));
    } catch {
      notify.error(t('propertyContact.copyFailed'));
    }
  };

  const handleShare = async () => {
    const shareText = formatContactDetails(contact, {
      phone: t('propertyContact.mobile'),
      email: t('propertyContact.email'),
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: contact.name,
          text: shareText,
        });
        return;
      } catch {
        /* fall through */
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      notify.success(t('propertyContact.sharedClipboard'));
    } catch {
      notify.error(t('propertyContact.shareFailed'));
    }
  };

  const handleSaveContact = () => {
    downloadVCard(contact);
    notify.success(t('propertyContact.saved'));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`premium-card group overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.005] hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-900/10 ${compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'} ${className}`}
      aria-labelledby="property-contact-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="property-contact-heading"
          className="text-lg font-bold text-gray-900 transition-colors duration-200 group-hover:text-primary-950 sm:text-xl"
        >
          {t('propertyContact.title')}
        </h2>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-primary-100">
          {t('propertyContact.layoutOwner')}
        </span>
      </div>

      <div className={`mt-5 flex gap-4 ${compact ? 'flex-col sm:flex-row sm:items-center' : 'flex-col sm:flex-row'}`}>
        <div className="flex shrink-0 items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-primary-100 ring-2 ring-primary-50 transition-transform duration-500 group-hover:scale-105 sm:h-20 sm:w-20">
            {contact.avatar ? (
              <Image
                src={contact.avatar}
                alt={contact.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary-700 transition-transform duration-300 group-hover:scale-110">
                {contact.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 sm:hidden">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t('propertyContact.name')}
            </p>
            <p className="truncate text-base font-bold text-gray-900 transition-colors duration-200 hover:text-primary-800">{contact.name}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="hidden sm:block">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t('propertyContact.name')}
            </p>
            <p className="text-lg font-bold text-gray-900 transition-colors duration-200 hover:text-primary-800">{contact.name}</p>
            {contact.designation ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-primary-700">
                <BadgeCheck className="h-4 w-4 shrink-0 transition-transform duration-300 hover:scale-125" aria-hidden />
                {contact.designation}
              </p>
            ) : null}
          </div>

          {contact.companyName ? (
            <p className="group/item flex items-center gap-2 text-sm text-gray-600 transition-transform duration-200 hover:translate-x-1">
              <Building2 className="h-4 w-4 shrink-0 text-primary-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:rotate-6" aria-hidden />
              {contact.companyName}
            </p>
          ) : null}

          {phone ? (
            <div className="group/item">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t('propertyContact.mobile')}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-gray-700 transition-transform duration-200 group-hover/item:translate-x-1">
                <Phone className="h-4 w-4 shrink-0 text-primary-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:rotate-12" aria-hidden />
                <a href={`tel:${phone}`} className="font-medium hover:text-primary-700 hover:underline">
                  {phone}
                </a>
              </p>
            </div>
          ) : null}

          {contact.email ? (
            <div className="group/item">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t('propertyContact.email')}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-gray-700 transition-transform duration-200 group-hover/item:translate-x-1">
                <Mail className="h-4 w-4 shrink-0 text-primary-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:-rotate-6" aria-hidden />
                <a href={`mailto:${contact.email}`} className="truncate hover:text-primary-700 hover:underline">
                  {contact.email}
                </a>
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`mt-5 grid gap-2 ${
          showExtendedActions
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.98]"
          >
            <Phone className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" aria-hidden />
            {t('propertyContact.call')}
          </a>
        ) : (
          <button type="button" disabled className="btn-primary rounded-xl py-2.5 text-sm opacity-50">
            {t('propertyContact.call')}
          </button>
        )}

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#22c35e] hover:shadow-md hover:shadow-emerald-600/25 active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
            {t('propertyContact.whatsapp')}
          </a>
        ) : (
          <button type="button" disabled className="btn-secondary rounded-xl py-2.5 text-sm opacity-50">
            {t('propertyContact.whatsapp')}
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyContact}
          className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:scale-[0.98]"
        >
          <Copy className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
          {t('propertyContact.copy')}
        </button>

        {showExtendedActions ? (
          <>
            <button
              type="button"
              onClick={handleShare}
              className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
              {t('propertyContact.share')}
            </button>

            <button
              type="button"
              onClick={handleSaveContact}
              className="btn-secondary col-span-2 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:scale-[0.98] sm:col-span-1"
            >
              <UserPlus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
              {t('propertyContact.save')}
            </button>
          </>
        ) : null}
      </div>
    </motion.section>
  );
}