import { useState } from 'react';
import { TRIP_KINDS, type TripItem, type TripKind } from '../../lib/offline/specs';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryForm } from '../../utils/formUtils';
import AttachmentGrid from '../../components/AttachmentGrid';
import CommentsField from '../../components/CommentsField';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import Select from '../../components/Select';
import TitleField from '../../components/TitleField';
import { StaticChip } from '../../components/Chip';
import { entryPath } from '../types';
import ItemDateFields, { type ItemDatesValue } from './ItemDateFields';
import { TRIP_KIND_LABELS, removeItemLabel, removeItemQuestion } from './labels';
import { NEW_TRIP_ITEM, type TripItemFields } from './useTripItems';

interface ItemFormProps {
  /** The row being edited, or a new one carrying only what it starts from. A
   *  row is written on save, so one being created has no id yet — and with no
   *  id there is no class settled, nothing to delete, and nothing for a
   *  picture to belong to. */
  item: TripItem | TripItemFields;
  onSave: (input: TripItemFields) => void;
  /** The row's own delete; a row that does not exist yet has none. */
  onRemove?: () => void;
}

/**
 * The one form every class of row is edited on: it draws the fields of its
 * own class and nothing else. The class is chosen while the row is being
 * created and only stated afterwards — switching it would take the filled-in
 * fields off the screen, which is losing them.
 */
export default function ItemForm({ item, onSave, onRemove }: ItemFormProps) {
  const entry = 'id' in item ? item : null;
  const [kind, setKind] = useState<TripKind>(item.kind);
  const [title, setTitle] = useState(item.title);
  const [comments, setComments] = useState(item.comments ?? '');
  const [fields, setFields] = useState<ItemDatesValue>({
    on_date: item.on_date,
    at_time: item.at_time,
    ends_on: item.ends_on,
    ends_at: item.ends_at,
    from_code: item.from_code,
    to_code: item.to_code,
  });

  const input: TripItemFields = {
    kind,
    title: lowercaseTrimmed(title),
    ...fields,
    comments: comments.trim() || null,
  };
  // A row being created is compared against nothing stored, so any title at
  // all is worth saving.
  const { canSave, onSubmit } = entryForm(
    input,
    entry ?? NEW_TRIP_ITEM,
    onSave,
    input.title !== '',
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <FormField label="Clase" group={entry !== null}>
        {entry ? (
          <StaticChip>{TRIP_KIND_LABELS[entry.kind]}</StaticChip>
        ) : (
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value as TripKind)}
            aria-label="Clase"
          >
            {TRIP_KINDS.map((option) => (
              <option key={option} value={option}>
                {TRIP_KIND_LABELS[option]}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <ItemDateFields
        kind={kind}
        fields={fields}
        onChange={(patch) => setFields((current) => ({ ...current, ...patch }))}
      />

      <CommentsField value={comments} onChange={setComments} rows={4} />

      {entry && (
        <FormField label="Adjuntos" group>
          <AttachmentGrid
            owner={{ kind: 'trip_item', id: entry.id }}
            ownerPath={entryPath('viajes', entry.trip_id, entry.id)}
          />
        </FormField>
      )}

      <FormFooter
        removeLabel={entry ? removeItemLabel(entry.kind) : undefined}
        confirmQuestion={entry ? removeItemQuestion(entry.kind) : undefined}
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
