import type { ReactNode } from 'react';
import { FIELD_CLASS } from './controlClasses';

interface FormFieldProps {
  /** Caption shown above the control, e.g. "Título". */
  label: string;
  /** Set when the field holds several controls (a chip row) rather than one
   *  input: the caption then names a group instead of labelling an input. */
  group?: boolean;
  children: ReactNode;
}

/** A captioned form field. Wraps a single control in a `<label>` so tapping
 *  the caption focuses it; a `group` gets a labelled container instead. */
export default function FormField({ label, group = false, children }: FormFieldProps) {
  if (group) {
    return (
      <div role="group" aria-label={label} className={FIELD_CLASS}>
        <span>{label}</span>
        {children}
      </div>
    );
  }
  return (
    <label className={FIELD_CLASS}>
      <span>{label}</span>
      {children}
    </label>
  );
}
