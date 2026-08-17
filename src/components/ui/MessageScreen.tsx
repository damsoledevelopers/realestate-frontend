'use client';

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Info,
  Inbox,
} from 'lucide-react';

export type MessageTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const toneStyles: Record<
  MessageTone,
  {
    panel: string;
    iconWrap: string;
    title: string;
    description: string;
    Icon: LucideIcon;
  }
> = {
  neutral: {
    panel: 'border-gray-200 bg-white shadow-sm',
    iconWrap: 'bg-gray-100 text-gray-500',
    title: 'text-gray-900',
    description: 'text-gray-500',
    Icon: Inbox,
  },
  info: {
    panel: 'border-primary-200 bg-primary-50/50',
    iconWrap: 'bg-white text-primary-600 shadow-sm',
    title: 'text-gray-900',
    description: 'text-gray-600',
    Icon: Info,
  },
  success: {
    panel: 'border-green-200 bg-green-50/70',
    iconWrap: 'bg-white text-green-600 shadow-sm',
    title: 'text-green-900',
    description: 'text-green-800/80',
    Icon: CheckCircle2,
  },
  warning: {
    panel: 'border-amber-200 bg-amber-50/80',
    iconWrap: 'bg-white text-amber-600 shadow-sm',
    title: 'text-amber-950',
    description: 'text-amber-900/80',
    Icon: Clock3,
  },
  error: {
    panel: 'border-red-200 bg-red-50/70',
    iconWrap: 'bg-white text-red-600 shadow-sm',
    title: 'text-red-900',
    description: 'text-red-800/80',
    Icon: AlertCircle,
  },
};

interface MessageScreenProps {
  tone?: MessageTone;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function MessageScreen({
  tone = 'neutral',
  icon,
  title,
  description,
  action,
  className = '',
}: MessageScreenProps) {
  const styles = toneStyles[tone];
  const Icon = icon || styles.Icon;

  return (
    <section
      className={`rounded-2xl border px-6 py-10 text-center sm:px-10 sm:py-12 ${styles.panel} ${className}`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${styles.iconWrap}`}
      >
        <Icon className="h-8 w-8" aria-hidden />
      </div>
      <h2 className={`mt-5 text-xl font-semibold tracking-tight ${styles.title}`}>{title}</h2>
      {description && (
        <p className={`mx-auto mt-2 max-w-lg text-sm leading-relaxed ${styles.description}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex flex-col items-center justify-center gap-3">{action}</div>}
    </section>
  );
}

interface MessageAlertProps {
  tone?: Exclude<MessageTone, 'neutral'>;
  title?: string;
  children?: ReactNode;
  className?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function MessageAlert({
  tone = 'info',
  title,
  children,
  className = '',
  onDismiss,
  dismissLabel = 'Dismiss',
}: MessageAlertProps) {
  const styles = toneStyles[tone];
  const Icon = styles.Icon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border px-4 py-3 ${styles.panel} ${className}`}
    >
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.iconWrap}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 text-left">
        {title && <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>}
        {children && (
          <p className={`text-sm leading-relaxed ${title ? 'mt-1' : ''} ${styles.description}`}>
            {children}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          {dismissLabel}
        </button>
      )}
    </div>
  );
}
