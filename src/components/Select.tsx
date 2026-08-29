import type { SelectHTMLAttributes } from 'react';
import { CONTROL_CLASS } from './controlClasses';

/** A choice from a list, with the app's control styling. Any `<select>`
 *  attribute passes through; `className` replaces the control's own look, for
 *  one that sits inside something else (a chip). */
export default function Select({
  className = CONTROL_CLASS,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={className} {...rest} />;
}
