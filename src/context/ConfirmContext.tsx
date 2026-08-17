'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useLocale } from '@/context/LocaleContext';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    const opts = typeof options === 'string' ? { message: options } : options;

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...opts, open: true });
    });
  }, []);

  useEffect(() => {
    if (!state?.open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state?.open, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!state?.open}
        title={state?.title ?? t('common.confirm')}
        description={state?.message ?? ''}
        confirmLabel={state?.confirmLabel ?? t('common.confirm')}
        cancelLabel={state?.cancelLabel ?? t('common.cancel')}
        destructive={state?.variant === 'danger'}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return confirm;
}
