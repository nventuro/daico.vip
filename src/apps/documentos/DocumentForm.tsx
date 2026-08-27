import { type FormEvent, useState } from 'react';
import { DOCUMENT_NOTICE_DAYS_OPTIONS, type DocumentEntry } from '../../types';
import { noticeLabel } from '../../utils/dateUtils';
import { hasChanges } from '../../utils/formUtils';
import { lowercaseTrimmed } from '../../utils/textUtils';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import FormFooter from '../../components/FormFooter';
import AttachmentGrid from '../../components/AttachmentGrid';
import { CONTROL_CLASS } from '../../components/controlClasses';
import type { DocumentInput } from './useDocuments';

interface DocumentFormProps {
  entry: DocumentEntry;
  onSave: (input: DocumentInput) => void;
  onRemove: () => void;
}

/** Edits every field of one document. Keyed by the entry's id by its caller,
 *  so the local draft starts from the entry once and never chases it afterwards. */
export default function DocumentForm({ entry, onSave, onRemove }: DocumentFormProps) {
  const [title, setTitle] = useState(entry.title);
  const [expiresOn, setExpiresOn] = useState<string | null>(entry.expires_on);
  const [noticeDays, setNoticeDays] = useState(entry.notice_days);

  const input: DocumentInput = {
    title: lowercaseTrimmed(title),
    expires_on: expiresOn,
    notice_days: noticeDays,
  };
  const canSave = input.title !== '' && hasChanges(input, entry);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Título">
        <TextInput
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título"
          autoCapitalize="none"
          required
        />
      </FormField>

      <FormField label="Vence">
        <input
          type="date"
          value={expiresOn ?? ''}
          onChange={(e) => setExpiresOn(e.target.value || null)}
          aria-label="Vence"
          className={CONTROL_CLASS}
        />
      </FormField>

      {expiresOn && (
        <FormField label="Aviso">
          <select
            value={noticeDays}
            onChange={(e) => setNoticeDays(Number(e.target.value))}
            aria-label="Aviso"
            className={CONTROL_CLASS}
          >
            {DOCUMENT_NOTICE_DAYS_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {noticeLabel(days)}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Adjuntos" group>
        <AttachmentGrid
          owner={{ kind: 'document', id: entry.id }}
          ownerPath={`/documentos/${entry.id}`}
        />
      </FormField>

      <FormFooter
        removeLabel="Eliminar documento"
        confirmQuestion="¿Eliminar el documento?"
        onRemove={onRemove}
        submitDisabled={!canSave}
      />
    </form>
  );
}
