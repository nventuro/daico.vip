import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Rows as a drag last left them. A drop is reflected here synchronously so
 * the dropped row stays in its new slot, instead of snapping back for a frame
 * until the async local-store write lands (which read as a jiggle). When the
 * store update arrives it carries the same order, so nothing moves — and it
 * is adopted while rendering, which is what keeps that frame from showing.
 */
export function useDropped<Row>(rows: Row[]): [Row[], Dispatch<SetStateAction<Row[]>>] {
  const [view, setView] = useState(rows);
  const [synced, setSynced] = useState(rows);
  if (synced !== rows) {
    setSynced(rows);
    setView(rows);
  }
  return [view, setView];
}
