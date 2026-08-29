import type { TextareaHTMLAttributes } from 'react';
import { CONTROL_CLASS } from './controlClasses';

/** A multi-line form input with the app's control styling. Any `<textarea>`
 *  attribute passes through; `className` replaces the control's own look, for
 *  one that sits inside something else, or adds to it built on `CONTROL_CLASS`. */
export default function TextArea({
  className = CONTROL_CLASS,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={className} {...rest} />;
}
