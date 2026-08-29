import type { ReactNode } from 'react';
import ErrorLine from './ErrorLine';
import SkeletonRows from './SkeletonRows';

interface EntryPageProps<Entry> {
  /** The entry the URL names, once the store has been read. */
  entry: Entry | undefined;
  loading: boolean;
  error?: string | null;
  /** What is said when there is no such entry, e.g. "Tarea no encontrada.". */
  missing: string;
  children: (entry: Entry) => ReactNode;
}

/** What every screen showing one entry is built on: it holds its place while
 *  the store is read, says so when the entry is not there, and otherwise hands
 *  the entry over. */
export default function EntryPage<Entry>({
  entry,
  loading,
  error,
  missing,
  children,
}: EntryPageProps<Entry>) {
  if (loading) return <SkeletonRows />;
  if (!entry) return <p className="text-muted">{missing}</p>;
  return (
    <>
      <ErrorLine error={error} className="mb-4" />
      {children(entry)}
    </>
  );
}
