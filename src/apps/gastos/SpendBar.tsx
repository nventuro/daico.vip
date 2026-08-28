interface SpendBarProps {
  /** The usual spending, in the same unit as `max`. */
  usual: number;
  /** The one-off spending, drawn after it, lighter. */
  oneOff?: number;
  /** What a full-width bar stands for. */
  max: number;
  /** `sm` under a row's label; `md` on its own. */
  size?: 'sm' | 'md';
}

/** A bar proportional to an amount, in the app's colour, with the one-off
 *  part set apart by a lighter shade — the marks of every list in Gastos. */
export default function SpendBar({ usual, oneOff = 0, max, size = 'sm' }: SpendBarProps) {
  const width = (value: number) => `${max > 0 ? (Math.max(value, 0) / max) * 100 : 0}%`;
  return (
    <span aria-hidden className={`flex w-full gap-0.5 ${size === 'sm' ? 'h-1.5' : 'h-3'}`}>
      <span className="bg-(--app)" style={{ width: width(usual) }} />
      {oneOff > 0 && <span className="bg-(--app) opacity-40" style={{ width: width(oneOff) }} />}
    </span>
  );
}
