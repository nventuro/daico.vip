// =============================================================================
// The class strings behind the form controls. Every control component takes a
// `className` that replaces its own look, so these are exported for the two
// cases that needs: a control that sits inside something else (a chip), and one
// that is the usual control plus a tweak.
// =============================================================================

/** A labelled field: caption above, control below. */
export const FIELD_CLASS = 'flex flex-col gap-1 text-sm text-muted';

/** A text-like control (input, textarea, select) inside a form. */
export const CONTROL_CLASS =
  'border border-border bg-surface-raised px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-primary';

/** The shape of a chip; pair with one of the two colour sets below. */
export const CHIP_BASE_CLASS = 'inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm';

/** Chip colours at rest. */
export const CHIP_IDLE_CLASS = 'border-border bg-surface-raised text-muted';

/** Chip colours when it is the selected option: filled in the app's colour. */
export const CHIP_SELECTED_CLASS = 'border-(--app) bg-(--app) font-medium text-on-primary';

/** The bar pinned to the bottom of a screen — a list's add bar, the shell's
 *  undo — within thumb reach. */
export const ADD_BAR_CLASS =
  'sticky bottom-0 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur';

/** The field of an add bar, taking the row's width. */
export const ADD_BAR_INPUT_CLASS =
  'flex-1 border border-border bg-surface-raised px-4 py-3 text-base transition-colors outline-none placeholder:text-muted focus:border-primary';

/** The square button beside it, in the app's colour. */
export const ADD_BAR_BUTTON_CLASS =
  'flex h-12 w-12 shrink-0 items-center justify-center bg-(--app) text-on-primary transition-opacity hover:opacity-90 disabled:bg-disabled disabled:opacity-100';
