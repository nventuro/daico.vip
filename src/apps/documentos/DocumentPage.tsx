import { useState } from 'react';
import AttachmentGrid from '../../components/AttachmentGrid';
import DatePicker from '../../components/DatePicker';
import DeleteDialog from '../../components/DeleteDialog';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import FormField from '../../components/FormField';
import NoticeDaysSelect from '../../components/NoticeDaysSelect';
import SectionLabel from '../../components/SectionLabel';
import { useAttachments } from '../../hooks/useAttachments';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import { appPath, entryPath } from '../types';
import { DOCUMENT_NOTICE_DAYS_OPTIONS, useDocuments } from './useDocuments';

/** A document, read and written on the same page: the title on blur, each
 *  control as it changes, and its pictures — which are what it says. */
export default function DocumentPage() {
  const { items, loading, error, save, remove } = useDocuments();
  const entry = useEntry(items);
  const attachments = useAttachments({ kind: 'document', id: entry?.id ?? '' });
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);

  async function removeDocument(id: string) {
    // The document's files go with it; nothing else would ever list them.
    await attachments.removeAll();
    await remove(id);
    leave(appPath('documentos'));
  }

  return (
    <EntryPage entry={entry} loading={loading} error={error} missing="Documento no encontrado.">
      {(entry) => (
        <article key={entry.id} className="flex flex-col gap-4">
          <EntryHead
            title={entry.title}
            onTitle={(title) => void save(entry.id, { title })}
            onDelete={() => setDeleting(true)}
            deleteLabel="Eliminar documento"
          />

          <FormField label="Vence">
            <DatePicker
              value={entry.expires_on}
              onChange={(expiresOn) => void save(entry.id, { expires_on: expiresOn })}
              label="Vence"
            />
          </FormField>

          {entry.expires_on && (
            <FormField label="Aviso">
              <NoticeDaysSelect
                value={entry.notice_days}
                onChange={(days) => void save(entry.id, { notice_days: days })}
                options={DOCUMENT_NOTICE_DAYS_OPTIONS}
              />
            </FormField>
          )}

          <div>
            <SectionLabel>Adjuntos</SectionLabel>
            <AttachmentGrid
              owner={{ kind: 'document', id: entry.id }}
              ownerPath={entryPath('documentos', entry.id)}
            />
          </div>

          <DeleteDialog
            open={deleting}
            question="¿Eliminar el documento?"
            onCancel={() => setDeleting(false)}
            onConfirm={() => void removeDocument(entry.id)}
          />
        </article>
      )}
    </EntryPage>
  );
}
