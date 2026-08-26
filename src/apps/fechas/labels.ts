import { DATE_NOTICE_DAYS_OPTIONS, type RepeatKind } from '../../types';

type NoticeDays = (typeof DATE_NOTICE_DAYS_OPTIONS)[number];

const NOTICE_LABELS: Record<NoticeDays, string> = {
  0: 'Aviso: el día',
  1: '1 día antes',
  3: '3 días antes',
  7: '1 semana antes',
  14: '2 semanas antes',
  30: '1 mes antes',
};

function isNoticeOption(days: number): days is NoticeDays {
  return (DATE_NOTICE_DAYS_OPTIONS as readonly number[]).includes(days);
}

/** How a date repeats, as shown to the user. */
export function repeatLabel(repeat: RepeatKind, months: number | null): string {
  switch (repeat) {
    case 'none':
      return 'Una vez';
    case 'yearly':
      return 'Cada año';
    case 'months':
      return months === 1 ? 'Cada mes' : `Cada ${months} meses`;
  }
}

/** How far ahead a date announces itself, as shown to the user. */
export function noticeLabel(days: number): string {
  return isNoticeOption(days) ? NOTICE_LABELS[days] : `${days} días antes`;
}
