interface LoadingLineProps {
  /** How much of the wait is behind, 0 to 1. Left out, the line sweeps: the
   *  wait can't be counted. */
  share?: number;
  /** Drawn for an inverse surface (the lightbox, the picture editor). */
  inverse?: boolean;
  /** Where the line sits; it is a block as wide as its parent. */
  className?: string;
}

/** The mark of something being waited for: a hairline track with a charcoal
 *  segment, sweeping along it or filled as far as the wait has gone. */
export default function LoadingLine({ share, inverse = false, className = '' }: LoadingLineProps) {
  const track = inverse ? 'bg-muted' : 'bg-border';
  const segment = inverse ? 'bg-on-surface-inverse' : 'bg-on-surface';
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`block h-0.5 overflow-hidden ${track} ${className}`}
    >
      {share === undefined ? (
        <span className={`block h-full w-1/3 animate-sweep ${segment}`} />
      ) : (
        <span className={`block h-full ${segment}`} style={{ width: `${share * 100}%` }} />
      )}
    </span>
  );
}
