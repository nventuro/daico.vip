import type { ReactNode } from 'react';

/** What the two shades of a spending bar mean, and — where there is room for
 *  it — what each comes to. */
export default function SpendLegend({
  usual,
  oneOff,
  className = 'flex gap-4',
}: {
  usual?: ReactNode;
  oneOff?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${className} text-sm`}>
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-2.5 bg-(--app)" />
        Base {usual !== undefined && <span className="tabular-nums">{usual}</span>}
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-2.5 bg-(--app) opacity-40" />
        Puntual {oneOff !== undefined && <span className="tabular-nums">{oneOff}</span>}
      </span>
    </div>
  );
}
