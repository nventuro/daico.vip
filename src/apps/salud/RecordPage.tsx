import { useState } from 'react';
import type { HealthRecord } from '../../lib/offline/specs';
import AttachmentGrid from '../../components/AttachmentGrid';
import { StaticChip } from '../../components/Chip';
import DatePicker from '../../components/DatePicker';
import DeleteDialog from '../../components/DeleteDialog';
import EntryHead from '../../components/EntryHead';
import FormField from '../../components/FormField';
import SectionLabel from '../../components/SectionLabel';
import { useAttachments } from '../../hooks/useAttachments';
import { useLeave } from '../../hooks/useLeave';
import { appPath, entryPath } from '../types';
import { SALUD_KIND_LABELS } from './kinds';
import type { HealthRecordInput } from './useHealthRecords';

interface RecordPageProps {
  record: HealthRecord;
  save: (id: string, patch: Partial<HealthRecordInput>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}

/** A study, read and written on the same page: the title on blur, the day as
 *  it changes, and its pictures — which are what it says. */
export default function RecordPage({ record, save, remove }: RecordPageProps) {
  const attachments = useAttachments({ kind: 'health_record', id: record.id });
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);
  const labels = SALUD_KIND_LABELS.record;

  async function removeRecord() {
    // The study's pictures go with it; nothing else would ever list them.
    await attachments.removeAll();
    await remove(record.id);
    leave(appPath('salud'));
  }

  return (
    <article className="flex flex-col gap-4">
      <EntryHead
        title={record.title}
        onTitle={(title) => void save(record.id, { title })}
        chips={<StaticChip>{labels.one}</StaticChip>}
        onDelete={() => setDeleting(true)}
        deleteLabel={labels.remove}
      />

      <FormField label="Fecha">
        <DatePicker
          value={record.on_date}
          onChange={(day) => {
            if (day) void save(record.id, { on_date: day });
          }}
          label="Fecha"
          required
        />
      </FormField>

      <div>
        <SectionLabel>Adjuntos</SectionLabel>
        <AttachmentGrid
          owner={{ kind: 'health_record', id: record.id }}
          ownerPath={entryPath('salud', record.id)}
        />
      </div>

      <DeleteDialog
        open={deleting}
        question={labels.question}
        onCancel={() => setDeleting(false)}
        onConfirm={() => void removeRecord()}
      />
    </article>
  );
}
