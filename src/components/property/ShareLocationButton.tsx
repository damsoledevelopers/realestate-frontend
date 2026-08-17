'use client';

import { useEffect, useRef, useState } from 'react';
import { getGoogleMapsExternalUrl, hasValidCoordinates } from '@/lib/googleMaps';
import { notify } from '@/lib/notify';
import { useLocale } from '@/context/LocaleContext';

interface ShareLocationButtonProps {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  className?: string;
  fullWidth?: boolean;
}

export default function ShareLocationButton({
  latitude,
  longitude,
  title = 'Property Location',
  className = '',
  fullWidth = true,
}: ShareLocationButtonProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mapsUrl = getGoogleMapsExternalUrl(latitude, longitude);
  const hasCoords = hasValidCoordinates(latitude, longitude);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!hasCoords || !mapsUrl) {
    return (
      <button
        type="button"
        disabled
        className={`btn-secondary cursor-not-allowed opacity-60 ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {t('property.shareLocation')}
      </button>
    );
  }

  const shareMessage = `${title}\n${mapsUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(mapsUrl);
      notify.success(t('property.linkCopied'));
      setOpen(false);
    } catch {
      notify.error(t('property.couldNotCopy'));
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const shareEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareMessage)}`;
    setOpen(false);
  };

  const shareNative = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: title, url: mapsUrl });
      setOpen(false);
    } catch {
      /* user cancelled */
    }
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`relative ${widthClass} ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`btn-secondary inline-flex items-center justify-center gap-2 ${widthClass}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ShareIcon />
        {t('property.shareLocation')}
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2"
          role="menu"
        >
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <ShareMenuItem onClick={shareNative} label={t('property.shareViaDevice')} />
          )}
          <ShareMenuItem onClick={shareWhatsApp} label="WhatsApp" />
          <ShareMenuItem onClick={shareEmail} label={t('contact.email')} />
          <ShareMenuItem onClick={copyLink} label={t('property.copyLink')} />
        </div>
      )}
    </div>
  );
}

function ShareMenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}
