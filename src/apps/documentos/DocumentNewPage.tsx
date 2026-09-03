import { useState, type FormEvent } from 'react';
import DatePicker from '../../components/DatePicker';
import ErrorLine from '../../components/ErrorLine';
import FormField from '../../components/FormField';
import FormFooter from '../../components/FormFooter';
import TitleField from '../../components/TitleField';
import { useDraftTitle } from '../../hooks/useDraftTitle';
import { useLeave } from '../../hooks/useLeave';
import { lowercaseTrimmed } from '../../utils/textUtils';
import { entryPath } from '../types';
import { useDocuments } from './useDocuments';

/** Where a document is born: its title and when it expires, written nowhere
 *  until Guardar — which opens the document, since its pictures are added
 *  there. */
export default function DocumentNewPage() {
  const { error, add } = useDocuments();
  const leave = useLeave();
  const draft = useDraftTitle();
  const [title, setTitle] = useState(draft);
  const [expiresOn, setExpiresOn] = useState<string | null>(null);
  const name = lowercaseTrimmed(title);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    const id = await add({ title: name, expires_on: expiresOn });
    if (id) leave(entryPath('documentos', id));
  }

  return (
    <>
      <ErrorLine error={error} className="mb-4" />
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <TitleField value={title} onChange={setTitle} />

        <FormField label="Vence">
          <DatePicker value={expiresOn} onChange={setExpiresOn} label="Vence" />
        </FormField>

        <FormFooter submitDisabled={!name} />
      </form>
    </>
  );
}
