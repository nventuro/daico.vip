/** The two kinds of entry Salud keeps, in the order the list draws them: what
 *  is still to be done, then what was done and kept. */
export const SALUD_KINDS = ['checkup', 'record'] as const;
export type SaludKind = (typeof SALUD_KINDS)[number];

/** How each kind is named: on the chip that picks or states it, as the
 *  heading of its section, and around its delete. */
export const SALUD_KIND_LABELS: Record<
  SaludKind,
  { one: string; many: string; remove: string; question: string }
> = {
  checkup: {
    one: 'Control',
    many: 'Controles',
    remove: 'Eliminar control',
    question: '¿Eliminar el control?',
  },
  record: {
    one: 'Estudio',
    many: 'Estudios',
    remove: 'Eliminar estudio',
    question: '¿Eliminar el estudio?',
  },
};

/** The kind a new entry starts as: what is typed into the bar is more often
 *  something to have done than something already done and kept. */
export const SALUD_KIND_DEFAULT: SaludKind = 'checkup';
