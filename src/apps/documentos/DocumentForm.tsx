import { useState } from 'react';
import type { DocumentEntry } from '../../lib/offline/specs';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryForm } from '../../utils/formUtils';
import FormField from '../../components/FormField';
import TitleField from '../../components/TitleField';
import DatePicker from '../../components/DatePicker';
import NoticeDaysSelect from '../../components/NoticeDaysSelect';
import FormFooter from '../../components/FormFooter';
import AttachmentGrid from '../../components/AttachmentGrid';
import { entryPath } from '../types';
import type { DocumentInput } from './useDocuments';

/** Notice windows offered for a document's expiry — up to six months, the
 *  margin a passport is often required to have left. */
const DOCUMENT_NOTICE_DAYS_OPTIONS = [7, 30, 90, 180];

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
  const { canSave, onSubmit } = entryForm(input, entry, onSave, input.title !== '');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TitleField value={title} onChange={setTitle} />

      <FormField label="Vence">
        <DatePicker value={expiresOn} onChange={setExpiresOn} label="Vence" />
      </FormField>

      {expiresOn && (
        <FormField label="Aviso">
          <NoticeDaysSelect
            value={noticeDays}
            onChange={setNoticeDays}
            options={DOCUMENT_NOTICE_DAYS_OPTIONS}
          />
        </FormField>
      )}

      <FormField label="Adjuntos" group>
        <AttachmentGrid
          owner={{ kind: 'document', id: entry.id }}
          ownerPath={entryPath('documentos', entry.id)}
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
