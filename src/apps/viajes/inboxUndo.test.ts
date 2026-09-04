import { describe, it, expect, vi } from 'vitest';
import { settleInboxUndo, type InboxUndo } from './inboxUndo';

const OFFER: InboxUndo = {
  label: 'Se agregó 1 ítem',
  tripCreated: false,
  tripId: 'v1',
  itemIds: ['i1'],
  attachmentIds: ['a1'],
  staged: [],
  fileIds: ['f1', 'f2'],
};

describe('settleInboxUndo', () => {
  it('lets the staged files go once the offer is over without being taken', () => {
    const release = vi.fn();
    settleInboxUndo(OFFER, false, release);
    expect(release).toHaveBeenCalledWith(['f1', 'f2']);
  });

  it('keeps them when the undo was taken: the rows are back beside them', () => {
    const release = vi.fn();
    settleInboxUndo(OFFER, true, release);
    expect(release).not.toHaveBeenCalled();
  });
});
