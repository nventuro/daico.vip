import type { ButtonHTMLAttributes } from 'react';

/** How prominent — and how dangerous — a button looks. `primary` is the one
 *  main action on a screen; `outline` a secondary one; `dangerOutline` offers a
 *  destructive action at the same weight as a secondary one, red only in its
 *  text; `danger` is the filled button that finally confirms it. */
export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'dangerOutline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** `md` for a form's main actions; `sm` for secondary in-form actions. */
  size?: 'sm' | 'md';
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover disabled:bg-disabled',
  outline: 'border border-on-surface text-on-surface hover:bg-border-subtle',
  danger: 'bg-error text-on-error hover:bg-error-hover',
  dangerOutline: 'border border-border text-error hover:bg-border-subtle',
};

const SIZE_CLASS = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2',
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
      className={`font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...rest}
    />
  );
}
