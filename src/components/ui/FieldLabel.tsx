import { LabelHTMLAttributes, ReactNode } from 'react';

interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: ReactNode;
}

export default function FieldLabel({
  required = false,
  children,
  className = '',
  ...props
}: FieldLabelProps) {
  return (
    <label className={`mb-1 block text-sm font-medium ${className}`.trim()} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
