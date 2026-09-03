import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Checkup } from '../../lib/offline/specs';
import { draftTitleState } from '../../hooks/useDraftTitle';
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
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import UndoBar from '../../components/UndoBar';
import { entryPath } from '../types';
import { SALUD_KIND_LABELS } from './kinds';
import { checkupMarks } from './marks';
import { dueAfterMarking, groupCheckups, isDone } from './recurrence';
import { useCheckups } from './useCheckups';
import { useHealthRecords } from './useHealthRecords';

/** The signed-in member's health, in two fixed sections: the checkups still
 *  to have done, then the studies kept, newest first. An empty section is not
 *  drawn; a checkup done for good folds into «Hechos» at the end. */
export default function SaludPage() {
  const checkups = useCheckups();
  const records = useHealthRecords();
  const undo = useUndo<Checkup>(UNDO_MS);
  const navigate = useNavigate();

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

  return (
    <ListPage
      loading={checkups.loading || records.loading}
      error={checkups.error ?? records.error}
      skeleton={<SkeletonRows leading="check" subtitle />}
      bar={
        <AddBar
          // The row is written on save: the title goes on to the form, where
          // its kind is chosen, and nothing is written until it is saved there.
          onAdd={(title) =>
            navigate(entryPath('salud', 'nuevo'), { state: draftTitleState(title) })
          }
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
    </ListPage>
  );
}
