import type { ButtonHTMLAttributes } from 'react';

/** How prominent — and how dangerous — a button looks. `primary` is the one
 *  main action on a screen; `outline` a secondary one; `dangerOutline` offers a
 *  destructive action at the same weight as a secondary one, red only in its
 *  text; `danger` is the filled button that finally confirms it; `link` is the
 *  quiet way out of a screen that has no other. */
export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'dangerOutline' | 'link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** `md` for a form's main actions; `sm` for secondary in-form actions. */
  size?: 'sm' | 'md';
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover disabled:bg-disabled disabled:hover:bg-disabled',
  outline: 'border border-on-surface text-on-surface hover:bg-border-subtle',
  danger: 'bg-error text-on-error hover:bg-error-hover',
  dangerOutline: 'border border-border text-error hover:bg-border-subtle',
  link: 'text-muted underline hover:text-muted-strong disabled:no-underline disabled:hover:text-muted',
};

const SIZE_CLASS: Record<'sm' | 'md' | 'link', string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2',
  // A link is words in a paragraph: it takes no room of its own.
  link: '',
};

/** The app's button. Defaults to `type="button"` so a button inside a form
 *  never submits it by accident; pass `type="submit"` for the one that should. */
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`transition-colors disabled:cursor-not-allowed ${variant === 'link' ? '' : 'font-medium'} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[variant === 'link' ? 'link' : size]} ${className}`}
      {...rest}
    />
  );
}
