import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Checkup } from '../../lib/offline/specs';
import { UNDO_MS, useUndo } from '../../hooks/useUndo';
import {
  formatDateShort,
  formatDayMonth,
  isPast,
  relativeDay,
  todayIso,
} from '../../utils/dateUtils';
import AddBar from '../../components/AddBar';
import ChecklistItem from '../../components/ChecklistItem';
import CompletedSection from '../../components/CompletedSection';
import EmptyState from '../../components/EmptyState';
import EntryMarks from '../../components/EntryMarks';
import KindPickDialog from '../../components/KindPickDialog';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import UndoBar from '../../components/UndoBar';
import { entryPath } from '../types';
import { SALUD_KINDS, SALUD_KIND_LABELS, type SaludKind } from './kinds';
import { checkupMarks } from './marks';
import { dueAfterMarking, groupCheckups, isDone } from './recurrence';
import { useCheckups } from './useCheckups';
import { useHealthRecords } from './useHealthRecords';

/** The signed-in member's health, in two fixed sections: the checkups still
 *  to have done, then the studies kept, newest first. An empty section is not
 *  drawn; a checkup done for good folds into «Hechos» at the end. */
/** The two kinds an entry can be born as. */
const KIND_OPTIONS = SALUD_KINDS.map((kind) => ({ kind, label: SALUD_KIND_LABELS[kind].one }));

export default function SaludPage() {
  const checkups = useCheckups();
  const records = useHealthRecords();
  const undo = useUndo<Checkup>(UNDO_MS);
  const navigate = useNavigate();
  // The title typed into the bar, while its kind is being asked.
  const [naming, setNaming] = useState<string | null>(null);

  const today = todayIso();
  const { pending, done } = useMemo(() => groupCheckups(checkups.items), [checkups.items]);

  function toggle(checkup: Checkup) {
    if (isDone(checkup)) {
      void checkups.unmark(checkup.id);
      return;
    }
    void checkups.mark(checkup);
    // The copy is taken before the mark, so undoing puts back both the day it
    // was last marked and the day it was due.
    undo.offer(checkup);
  }

  function undoMark(checkup: Checkup) {
    undo.clear();
    void checkups.restore(checkup);
  }

  /** What the undo bar says: for a checkup that comes back, where it went. */
  function markMessage(checkup: Checkup): string {
    const next = checkup.repeat_every === null ? null : dueAfterMarking(checkup, today);
    return next ? `Hecho · vuelve el ${formatDayMonth(next)}` : 'Control hecho';
  }

  const justDone = undo.value;

  function renderCheckup(checkup: Checkup) {
    const finished = isDone(checkup);
    const overdue = !finished && checkup.due_on != null && isPast(checkup.due_on, today);
    return (
      <ChecklistItem
        key={checkup.id}
        checked={finished}
        label={checkup.title}
        to={entryPath('salud', checkup.id)}
        subtitle={checkup.due_on ? relativeDay(today, checkup.due_on) : undefined}
        overdue={overdue}
        trailing={<EntryMarks marks={checkupMarks(checkup)} />}
        onToggle={() => toggle(checkup)}
        toggleLabel={finished ? 'Marcar como pendiente' : 'Marcar como hecho'}
      />
    );
  }

  const empty = pending.length === 0 && done.length === 0 && records.items.length === 0;

  /** An entry is born from its title and its kind, chosen now and never
   *  again: a checkup undated and done once, a study on today. Either is
   *  opened to have the rest said about it. */
  async function addEntry(title: string, kind: SaludKind) {
    setNaming(null);
    const id =
      kind === 'checkup'
        ? await checkups.add({
            title,
            due_on: null,
            comments: null,
            repeat_every: null,
            repeat_unit: null,
          })
        : await records.add({ title, on_date: today });
    if (id) navigate(entryPath('salud', id));
  }

  return (
    <ListPage
      loading={checkups.loading || records.loading}
      error={checkups.error ?? records.error}
      skeleton={<SkeletonRows leading="check" subtitle />}
      bar={
        <AddBar
          // The kind is asked first, and the bar keeps the title while it is.
          onAdd={(title) => {
            setNaming(title);
            return false;
          }}
          placeholder="Agregar un control o estudio..."
          inputLabel="Nuevo control o estudio"
          notice={
            justDone && (
              <UndoBar message={markMessage(justDone)} onAction={() => undoMark(justDone)} />
            )
          }
        />
      }
    >
      {empty && <EmptyState>Todavía no hay controles ni estudios.</EmptyState>}
      {pending.length > 0 && (
        <section className="mb-6">
          <SectionLabel>{SALUD_KIND_LABELS.checkup.many}</SectionLabel>
          <ul>{pending.map(renderCheckup)}</ul>
        </section>
      )}
      {records.items.length > 0 && (
        <section className="mb-6">
          <SectionLabel>{SALUD_KIND_LABELS.record.many}</SectionLabel>
          <ul>
            {records.items.map((record) => (
              <LinkRow
                key={record.id}
                to={entryPath('salud', record.id)}
                title={record.title}
                subtitle={formatDateShort(record.on_date)}
              />
            ))}
          </ul>
        </section>
      )}
      <CompletedSection label="Hechos" count={done.length}>
        <ul>{done.map(renderCheckup)}</ul>
      </CompletedSection>
      {naming !== null && (
        <KindPickDialog
          title={naming}
          options={KIND_OPTIONS}
          onPick={(kind) => void addEntry(naming, kind)}
          onClose={() => setNaming(null)}
        />
      )}
    </ListPage>
  );
}
