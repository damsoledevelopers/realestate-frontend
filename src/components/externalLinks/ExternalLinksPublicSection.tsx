'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { fetchExternalLinks, getCategoryLabel } from '@/lib/externalLinks';
import type { ExternalLinkEntityType, ExternalLinkRecord } from '@/lib/types';

interface ExternalLinksPublicSectionProps {
  entityType: ExternalLinkEntityType;
  entityId: string;
  title?: string;
  className?: string;
}

export default function ExternalLinksPublicSection({
  entityType,
  entityId,
  title,
  className = '',
}: ExternalLinksPublicSectionProps) {
  const { t } = useLocale();
  const [links, setLinks] = useState<ExternalLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchExternalLinks(entityType, entityId)
      .then((data) => {
        if (active) setLinks(data.links || []);
      })
      .catch(() => {
        if (active) setLinks([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  if (loading || links.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">
        {title || t('externalLinks.publicTitle')}
      </h3>
      <p className="mt-1 text-sm text-gray-500">{t('externalLinks.publicSubtitle')}</p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link._id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-primary-200 hover:bg-primary-50/40"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 ring-1 ring-gray-200 group-hover:ring-primary-200">
                <ExternalLink className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-gray-900 group-hover:text-primary-700">
                  {link.title}
                </span>
                <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">
                  {link.categoryLabel || getCategoryLabel(link.category)}
                </span>
                {link.description?.trim() && (
                  <span className="mt-2 block text-sm text-gray-500">{link.description}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
