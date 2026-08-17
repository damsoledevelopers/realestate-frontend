'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface InputDialogProps {
  open: boolean;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function InputDialog({
  open,
  title,
  description,
  defaultValue = '',
  placeholder,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  required = true,
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValue(defaultValue);
    setError('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (required && !trimmed) {
      setError('This field is required');
      return;
    }
    onConfirm(trimmed);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="input-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 id="input-dialog-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
        <div className="mt-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            className={`input-field ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">
            {cancelLabel}
          </button>
          <button type="submit" className="btn-primary text-sm">
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
