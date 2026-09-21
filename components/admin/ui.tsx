'use client';

import type { ReactNode } from 'react';

// Small styled form primitives shared across the admin managers, matching the
// blush/gold/ink palette used on the public site.

interface FieldProps {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}

export function Field({ id, label, children, hint }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-widest text-ink-700/70"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-700/50">{hint}</p> : null}
    </div>
  );
}

const inputClasses =
  'mt-2 w-full rounded-lg border border-blush-200 bg-blush-50 px-4 py-2.5 text-sm text-ink-900 outline-none focus:border-gold-400';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClasses} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={inputClasses} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClasses} />;
}

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-ink-900 text-blush-50 hover:bg-gold-500',
    ghost: 'border border-blush-200 text-ink-700 hover:border-gold-400 hover:text-ink-900',
    danger: 'border border-blush-300 text-blush-500 hover:bg-blush-500 hover:text-white',
  };
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
}
