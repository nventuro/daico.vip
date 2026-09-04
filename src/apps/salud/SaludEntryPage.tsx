import type { Checkup, HealthRecord } from '../../lib/offline/specs';
import EntryPage from '../../components/EntryPage';
import { useEntry } from '../../hooks/useEntry';
import CheckupPage from './CheckupPage';
import RecordPage from './RecordPage';
import { useCheckups } from './useCheckups';
import { useHealthRecords } from './useHealthRecords';

/** What the URL names, and which table it came out of. */
type Found = { kind: 'checkup'; checkup: Checkup } | { kind: 'record'; record: HealthRecord };

/** The entry `/salud/:id` names: a checkup or a study, told apart by which
 *  table holds the id. The one path is all Próximo and Buscar know how to
 *  write, so the two kinds share it. */
export default function SaludEntryPage() {
  const checkups = useCheckups();
  const records = useHealthRecords();
  const checkup = useEntry(checkups.items);
  const record = useEntry(records.items);
  const found: Found | undefined = checkup
    ? { kind: 'checkup', checkup }
    : record
      ? { kind: 'record', record }
      : undefined;

  return (
    <EntryPage
      entry={found}
      loading={checkups.loading || records.loading}
      error={checkups.error ?? records.error}
      missing="No se encontró."
    >
      {(entry) =>
        entry.kind === 'checkup' ? (
          <CheckupPage
            key={entry.checkup.id}
            checkup={entry.checkup}
            save={checkups.save}
            remove={checkups.remove}
            mark={checkups.mark}
            unmark={checkups.unmark}
            restore={checkups.restore}
          />
        ) : (
          <RecordPage
            key={entry.record.id}
            record={entry.record}
            save={records.save}
            remove={records.remove}
          />
        )
      }
    </EntryPage>
  );
}
