import type { ReactNode } from 'react';

/** What the parts of a spending bar mean, and — where there is room for it —
 *  what each comes to. Three entries only fit a phone written short, so an
 *  amount comes in the compact form. */
export default function SpendLegend({
  usual,
  oneOff,
  installments,
  className = 'flex gap-4',
}: {
  usual?: ReactNode;
  oneOff?: ReactNode;
  installments?: ReactNode;
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
      {installments !== undefined && (
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 bg-disabled" />
          Cuotas <span className="tabular-nums">{installments}</span>
        </span>
      )}
    </div>
  );
}
