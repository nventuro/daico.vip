// =============================================================================
// The class strings behind the form primitives (FormField, TextInput, TextArea,
// Chip). Exported so the rare control without a component of its own — a
// <select>, a number input — can still look exactly like the rest.
// =============================================================================

/** A labelled field: caption above, control below. */
export const FIELD_CLASS = 'flex flex-col gap-1 text-sm text-muted';

/** A text-like control (input, textarea, select) inside a form. */
export const CONTROL_CLASS =
  'rounded-xl border border-border bg-surface-raised px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-primary';

/** The shape of a pill chip; pair with one of the two colour sets below. */
export const CHIP_BASE_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm';

/** Chip colours at rest. */
export const CHIP_IDLE_CLASS = 'border-border bg-surface-raised text-muted';

/** Chip colours when it is the selected option. */
export const CHIP_SELECTED_CLASS = 'border-primary bg-primary-subtle font-medium text-primary';
