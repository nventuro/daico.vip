import { useEffect, useState } from 'react';

/** A URL the page can show `blob` at, revoked when it changes or on unmount;
 *  null while there is no blob, and for the render before it is made. */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  // Made in the effect and nowhere sooner: a render that is thrown away —
  // which the development build does on purpose — must make no URL, since
  // nothing would ever revoke it. The render after is the one the page shows.
  /* eslint-disable react-hooks/set-state-in-effect -- the URL exists only once the effect has run */
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return url;
}
