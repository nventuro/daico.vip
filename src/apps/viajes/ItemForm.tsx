import { useState } from 'react';
import { TRIP_KINDS, type TripKind } from '../../lib/offline/specs';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryForm } from '../../utils/formUtils';
import Body from '../../components/editor/Body';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import Select from '../../components/Select';
import TitleField from '../../components/TitleField';
import ItemDateFields, { type ItemDatesValue } from './ItemDateFields';
import { TRIP_KIND_LABELS } from './labels';
import { NEW_TRIP_ITEM, type TripItemFields } from './useTripItems';

interface ItemFormProps {
  /** What the row starts from: the title the add bar typed, and nothing
   *  settled about it yet. */
  item: TripItemFields;
  onSave: (input: TripItemFields) => void;
}

/**
 * Where a row of a trip is born, whatever its class: the class is chosen
 * here and never afterwards — switching it would take the filled-in fields
 * off the screen, which is losing them. Written nowhere until Guardar, so
 * backing out leaves nothing behind.
 */
export default function ItemForm({ item, onSave }: ItemFormProps) {
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
  const { canSave, onSubmit } = entryForm(input, NEW_TRIP_ITEM, onSave, input.title !== '');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <FormField label="Clase">
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
      </FormField>

      <ItemDateFields
        kind={kind}
        fields={fields}
        onChange={(patch) => setFields((current) => ({ ...current, ...patch }))}
      />

      <FormField label="Comentarios" group>
        <Body
          value={item.comments ?? ''}
          onChange={setComments}
          placeholder="Comentarios"
          ariaLabel="Comentarios"
        />
      </FormField>

      <FormFooter submitDisabled={!canSave} />
    </form>
  );
}
