import type { ReactNode } from 'react';
import ErrorLine from './ErrorLine';
import OfflineBanner from './OfflineBanner';
import SkeletonRows from './SkeletonRows';

interface ListPageProps {
  /** While the local store is still being read: the skeleton holds the list's
   *  place instead of the rows. */
  loading: boolean;
  error?: string | null;
  /** Rows in the shape of the list, unless the plain ones will do. */
  skeleton?: ReactNode;
  /** What is pinned to the bottom of the screen: an add bar, or the one
   *  action the list offers. */
  bar?: ReactNode;
  children: ReactNode;
}

/** What every list in the app is built on: the offline notice, whatever went
 *  wrong, the list itself (or its skeleton), and the bar pinned at the bottom
 *  within thumb reach. */
export default function ListPage({ loading, error, skeleton, bar, children }: ListPageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />
        <ErrorLine error={error} className="mb-4" />
        {loading ? (skeleton ?? <SkeletonRows />) : children}
      </div>
      {bar}
    </div>
  );
}
