import type { TextareaHTMLAttributes } from 'react';
import { CONTROL_CLASS } from './controlClasses';

/** A multi-line form input with the app's control styling. Any `<textarea>`
 *  attribute passes through; `className` is appended. */
export default function TextArea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL_CLASS} ${className}`} {...rest} />;
}
