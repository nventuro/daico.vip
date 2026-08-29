import type { InputHTMLAttributes } from 'react';
import { CONTROL_CLASS } from './controlClasses';

/** A single-line form input with the app's control styling. Any `<input>`
 *  attribute passes through; `className` replaces the control's own look, for
 *  one that sits inside something else (a chip). */
export default function TextInput({
  className = CONTROL_CLASS,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className} {...rest} />;
}
