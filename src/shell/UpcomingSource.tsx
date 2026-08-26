import { useEffect } from 'react';
import type { AppId, Upcoming } from '../apps/types';

interface UpcomingSourceProps {
  appId: AppId;
  useUpcoming: () => Upcoming[];
  onItems: (appId: AppId, items: Upcoming[]) => void;
}

/** Runs one app's `useUpcoming` and reports its entries upward; renders nothing.
 *  Every app gets its own keyed instance so the hook is always exactly one fixed
 *  call at the top of a component: the registry may grow or an app may have no
 *  adapter, but no component's hook order ever changes. */
export default function UpcomingSource({ appId, useUpcoming, onItems }: UpcomingSourceProps) {
  const items = useUpcoming();

  useEffect(() => {
    onItems(appId, items);
  }, [appId, items, onItems]);

  return null;
}
