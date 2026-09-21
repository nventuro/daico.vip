import type { TripInboxKind, TripKind, TripTransport } from '../../lib/offline/specs';
import { BOARDING_PASS_ICON, TRIP_KIND_SHAPES, TRIP_TRANSPORT_ICONS } from './kinds';

interface ItemIconProps {
  kind: TripKind | TripInboxKind;
  /** What a pasaje travels on; null for every other class. */
  transport: TripTransport | null;
}

/** What stands before a row wherever it is listed: its class's icon, for a
 *  pasaje that of what it travels on, and for a staged boarding pass — no
 *  class of row — the one of its own. */
export default function ItemIcon({ kind, transport }: ItemIconProps) {
  const Icon =
    kind === 'boarding_pass'
      ? BOARDING_PASS_ICON
      : kind === 'ticket' && transport !== null
        ? TRIP_TRANSPORT_ICONS[transport]
        : TRIP_KIND_SHAPES[kind].icon;
  return <Icon size={18} stroke={1.5} className="shrink-0 text-muted" />;
}
