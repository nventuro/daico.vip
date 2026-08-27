import { useEffect, useMemo } from 'react';

/** A URL the page can show `blob` at, revoked when it changes or on unmount;
 *  null while there is no blob. */
export function useObjectUrl(blob: Blob | null): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
}
