'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import InputDialog from '@/components/ui/InputDialog';
import SelectDialog, { type SelectDialogOption } from '@/components/ui/SelectDialog';
import { useLocale } from '@/context/LocaleContext';

export interface InputPromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
}

export interface SelectPromptOptions {
  title: string;
  message?: string;
  options: SelectDialogOption[];
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type InputPromptFn = (options: InputPromptOptions) => Promise<string | null>;
type SelectPromptFn = (options: SelectPromptOptions) => Promise<string | null>;

type PromptContextType = {
  input: InputPromptFn;
  select: SelectPromptFn;
};

type PromptState =
  | ({ kind: 'input' } & InputPromptOptions & { open: boolean })
  | ({ kind: 'select' } & SelectPromptOptions & { open: boolean });

const PromptContext = createContext<PromptContextType | null>(null);

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [state, setState] = useState<PromptState | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  const close = useCallback((result: string | null) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(null);
  }, []);

  const input = useCallback<InputPromptFn>((options) => {
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      setState({ kind: 'input', ...options, open: true });
    });
  }, []);

  const select = useCallback<SelectPromptFn>((options) => {
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      setState({ kind: 'select', ...options, open: true });
    });
  }, []);

  return (
    <PromptContext.Provider value={{ input, select }}>
      {children}
      {state?.kind === 'input' && (
        <InputDialog
          open={state.open}
          title={state.title}
          description={state.message}
          defaultValue={state.defaultValue}
          placeholder={state.placeholder}
          confirmLabel={state.confirmLabel ?? t('common.save')}
          cancelLabel={state.cancelLabel ?? t('common.cancel')}
          required={state.required}
          onConfirm={(value) => close(value)}
          onCancel={() => close(null)}
        />
      )}
      {state?.kind === 'select' && (
        <SelectDialog
          open={state.open}
          title={state.title}
          description={state.message}
          options={state.options}
          defaultValue={state.defaultValue}
          confirmLabel={state.confirmLabel ?? t('common.save')}
          cancelLabel={state.cancelLabel ?? t('common.cancel')}
          onConfirm={(value) => close(value)}
          onCancel={() => close(null)}
        />
      )}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const prompt = useContext(PromptContext);
  if (!prompt) {
    throw new Error('usePrompt must be used within PromptProvider');
  }
  return prompt;
}
