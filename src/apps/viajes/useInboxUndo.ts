import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAttachments } from '../../hooks/useAttachments';
import { useLeave } from '../../hooks/useLeave';
import { endUndo, offerUndo, type UndoOffer } from '../../lib/undo';
import { deleteInboxFiles } from './inboxFiles';
import { inboxRowInput, inboxUndoOf, settleInboxUndo, type InboxUndo } from './inboxUndo';
import { useTripInbox } from './useTripInbox';
import { useTripItems } from './useTripItems';
import { useTrips } from './useTrips';

/**
 * What the review just put in, offered to be undone on the screen it led to.
 * The offer arrives with the navigation and is made once; the navigation is
 * then replaced without it, so coming back to the screen later does not
 * offer it again. Undoing takes the rows and attachments out, puts the
 * suggestions back as they were and removes a trip created for them, then
 * goes where `leaveAfter` says when what the screen showed is gone (null to
 * stay). The staged files outlive the offer, so an undo finds them where
 * they were; once the offer is over any other way, they are let go of. The
 * undo needs this screen, so leaving it ends the offer. `leaveAfter` must be
 * stable across renders, or the offer is made again with each.
 */
export function useInboxUndoArrival(leaveAfter: (undo: InboxUndo) => string | null): void {
  const { insert: restage } = useTripInbox();
  const { removeByIds: removeAttachments } = useAttachments();
  const { remove: removeItem } = useTripItems();
  const { remove: removeTrip } = useTrips();
  const navigate = useNavigate();
  const leave = useLeave();
  const location = useLocation();
  const { pathname } = location;
  const state: unknown = location.state;
  const offer = useRef<UndoOffer | null>(null);

  const undoInbox = useCallback(
    async (added: InboxUndo) => {
      // By id: the offer is made as the screen opens, before the attachments
      // have been read, and its undo is the closure made then.
      await removeAttachments(added.attachmentIds);
      for (const id of added.itemIds) await removeItem(id);
      for (const row of added.staged) await restage(inboxRowInput(row));
      if (added.tripCreated) await removeTrip(added.tripId);
      const to = leaveAfter(added);
      if (to !== null) leave(to);
    },
    [removeAttachments, removeItem, restage, removeTrip, leaveAfter, leave],
  );

  const arrived = inboxUndoOf(state);
  useEffect(() => {
    if (!arrived) return;
    const made: UndoOffer = {
      message: arrived.label,
      undo: () => undoInbox(arrived),
      onEnd: (taken) => settleInboxUndo(arrived, taken, (ids) => void deleteInboxFiles(ids)),
    };
    offer.current = made;
    offerUndo(made);
    void navigate(pathname, { replace: true, state: null });
  }, [arrived, undoInbox, navigate, pathname]);

  useEffect(
    () => () => {
      if (offer.current) endUndo(offer.current);
    },
    [],
  );
}
