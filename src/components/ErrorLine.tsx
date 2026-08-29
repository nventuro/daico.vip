interface ErrorLineProps {
  /** A failure of the store or the server, quoted after "Error:" since the
   *  words are theirs. */
  error?: string | null;
  /** Something the user can do about, in the app's own words. */
  problem?: string | null;
  className?: string;
}

/** The one way a screen says something is wrong; nothing is drawn when
 *  nothing is. */
export default function ErrorLine({ error, problem, className = '' }: ErrorLineProps) {
  const message = error ? `Error: ${error}` : problem;
  if (!message) return null;
  return <p className={`text-sm text-error ${className}`}>{message}</p>;
}
