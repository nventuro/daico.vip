/** The widths the category names take in turn, so the rows read as different
 *  categories. */
const CATEGORY_WIDTHS = ['38%', '52%', '30%', '45%', '34%'];

interface BreakdownSkeletonProps {
  /** Whether a row of its own stands between the total and the bar, as a
   *  statement's «Pagado» does. */
  check?: boolean;
}

/**
 * A month or a statement while it is still being read: its total, its bar and
 * a row per category, each the height of what is coming. Neither is drawn
 * until every statement is open and the rules are in — what a movement is
 * filed under decides both the category it lands in and whether it counts as
 * a one-off, so anything drawn before them would move under the reader.
 */
export default function BreakdownSkeleton({ check = false }: BreakdownSkeletonProps) {
  return (
    <div role="status" aria-label="Cargando" className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="block h-3.5 w-28 bg-border-subtle" />
        <span className="block h-9 w-56 bg-border-subtle" />
      </div>

      {check && (
        <div className="flex items-center gap-3 border-y border-border py-3">
          <span className="size-5.5 shrink-0 border-2 border-border-subtle" />
          <span className="flex flex-1 flex-col gap-1">
            <span className="block h-3.5 w-20 bg-border-subtle" />
            <span className="block h-2.5 w-40 bg-border-subtle" />
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="block h-3 w-full bg-border-subtle" />
        <span className="flex justify-between gap-3">
          <span className="block h-3.5 w-24 bg-border-subtle" />
          <span className="block h-3.5 w-24 bg-border-subtle" />
        </span>
      </div>

      <div>
        <span className="mb-1 flex h-4 items-center">
          <span className="block h-2.5 w-28 bg-border-subtle" />
        </span>
        <ul>
          {CATEGORY_WIDTHS.map((width, i) => (
            <li key={i} className="flex flex-col gap-1.5 border-b border-border py-2.5">
              <span className="flex items-center justify-between gap-3">
                <span className="block h-3.5 bg-border-subtle" style={{ width }} />
                <span className="block h-3.5 w-16 bg-border-subtle" />
              </span>
              <span className="flex items-center gap-3">
                <span className="block h-1.5 flex-1 bg-border-subtle" />
                <span className="block h-3 w-24 shrink-0 bg-border-subtle" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
