import { useState } from 'react';
import { PANTRY_PLACES, type PantryItem } from '../../lib/offline/specs';
import AttachmentGrid from '../../components/AttachmentGrid';
import CheckRow from '../../components/CheckRow';
import Chip from '../../components/Chip';
import Comments from '../../components/Comments';
import DatePicker from '../../components/DatePicker';
import DeleteDialog from '../../components/DeleteDialog';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import FormField from '../../components/FormField';
import SectionLabel from '../../components/SectionLabel';
import { CONTROL_CLASS } from '../../components/controlClasses';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { useLeave, useLeaveBack } from '../../hooks/useLeave';
import { useTextSave } from '../../hooks/useTextSave';
import { offerUndo } from '../../lib/undo';
import { formatMonthYear } from '../../utils/dateUtils';
import { appPath, entryPath } from '../types';
import { PANTRY_PLACE_LABELS, USED_LABEL } from './labels';
import { isUsed } from './pantry';
import { usePantry } from './usePantry';

/** The date takes the row's width, and the chip beside it what it needs. */
const DAY_CLASS = `${CONTROL_CLASS} flex-1`;

/** An item, read and written on the same page: the title on blur, each
 *  control as it changes, the comments a moment after typing stops and on
 *  leaving. The one control that leaves the page is the square that marks
 *  it. */
export default function PantryItemPage() {
  const { items, loading, error, save, setExpiry, setMonthOnly, mark, unmark, remove } =
    usePantry();
  const item = useEntry(items);
  const attachments = useAttachments({ kind: 'pantry_item', id: item?.id ?? '' });
  const leave = useLeave();
  const leaveBack = useLeaveBack();
  const [deleting, setDeleting] = useState(false);

  const commentsSave = useTextSave(async (text) => {
    if (item) await save(item.id, { comments: text || null });
  }, item?.id);

  /** Marks the item as the list does, or takes its mark off, and leaves the
   *  page: the list — or Próximo, or wherever the page was opened from — is
   *  where the item's new place and the undo are shown. */
  function toggleUsed(item: PantryItem) {
    if (isUsed(item)) {
      void unmark(item.id);
    } else {
      void mark(item.id);
      offerUndo({ message: USED_LABEL, undo: () => unmark(item.id) });
    }
    leaveBack(appPath('despensa'));
  }

  async function removeItem(id: string) {
    // The item's pictures go with it; nothing else would ever list them.
    await attachments.removeAll();
    await remove(id);
    leave(appPath('despensa'));
  }

  return (
    <EntryPage entry={item} loading={loading} error={error} missing="No está en la despensa.">
      {(item) => (
        <article key={item.id} className="flex flex-col gap-4">
          <EntryHead
            title={item.title}
            onTitle={(title) => void save(item.id, { title })}
            onDelete={() => setDeleting(true)}
            deleteLabel="Eliminar de la despensa"
          />

          <CheckRow checked={isUsed(item)} onToggle={() => toggleUsed(item)} className="py-2">
            {isUsed(item) ? USED_LABEL : 'Marcar como usado'}
          </CheckRow>

          <FormField label="Vence" group>
            <div className="flex items-center gap-2">
              <DatePicker
                value={item.expires_on}
                onChange={(expiresOn) => void setExpiry(item, expiresOn)}
                label="Vence"
                format={item.expires_month_only ? formatMonthYear : undefined}
                className={DAY_CLASS}
              />
              {/* Only a date can be only a month. */}
              {item.expires_on !== null && (
                <Chip
                  selected={item.expires_month_only}
                  onClick={() => void setMonthOnly(item, !item.expires_month_only)}
                >
                  Solo mes
                </Chip>
              )}
            </div>
          </FormField>

          <FormField label="Dónde" group>
            <div className="flex flex-wrap items-center gap-2">
              {PANTRY_PLACES.map((place) => (
                <Chip
                  key={place}
                  selected={place === item.place}
                  onClick={() => void save(item.id, { place })}
                >
                  {PANTRY_PLACE_LABELS[place]}
                </Chip>
              ))}
            </div>
          </FormField>

          <Comments value={item.comments ?? ''} onChange={commentsSave.onChange} />

          <div>
            <SectionLabel>Adjuntos</SectionLabel>
            <AttachmentGrid
              owner={{ kind: 'pantry_item', id: item.id }}
              ownerPath={entryPath('despensa', item.id)}
            />
          </div>

          <DeleteDialog
            open={deleting}
            question="¿Eliminar de la despensa?"
            onCancel={() => setDeleting(false)}
            onConfirm={() => void removeItem(item.id)}
          />
        </article>
      )}
    </EntryPage>
  );
}
