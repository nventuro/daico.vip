interface SkeletonRowsProps {
  rows?: number;
  /** What leads each row: the check square of a checklist, or the colour
   *  square of an upcoming entry. */
  leading?: 'check' | 'square';
  /** Whether rows carry a smaller line under the title, as a date would be. */
  subtitle?: boolean;
  /** Whether rows end in a short label, as a day would be. */
  trailing?: boolean;
}

/** The widths the title bars take in turn, so the rows read as different entries. */
const TITLE_WIDTHS = ['62%', '45%', '70%', '38%', '55%', '61%'];

/** Rows in the shape of a list that is still being read, holding its place
 *  so nothing moves when the entries arrive. Each row is the height of the
 *  entry it stands for. */
export default function SkeletonRows({
  rows = TITLE_WIDTHS.length,
  leading,
  subtitle = false,
  trailing = false,
}: SkeletonRowsProps) {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border py-3">
          {leading === 'check' && (
            <span className="size-5.5 shrink-0 border-2 border-border-subtle" />
          )}
          {leading === 'square' && <span className="size-3 shrink-0 bg-border" />}
          <span className="flex flex-1 flex-col">
            <span className="flex h-6 items-center">
              <span
                className="h-3.5 bg-border-subtle"
                style={{ width: TITLE_WIDTHS[i % TITLE_WIDTHS.length] }}
              />
            </span>
            {subtitle && i % 2 === 0 && (
              <span className="mt-0.5 flex h-4 items-center">
                <span className="h-2.5 w-16 bg-border-subtle" />
              </span>
            )}
          </span>
          {trailing && <span className="h-3 w-9 shrink-0 bg-border-subtle" />}
        </div>
      ))}
    </div>
  );
}
