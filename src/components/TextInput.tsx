import type { InputHTMLAttributes } from 'react';
import { CONTROL_CLASS } from './controlClasses';

/** A single-line form input with the app's control styling. Any `<input>`
 *  attribute passes through; `className` is appended. */
export default function TextInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_CLASS} ${className}`} {...rest} />;
}
