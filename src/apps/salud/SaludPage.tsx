import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Checkup } from '../../lib/offline/specs';
import { offerUndo } from '../../lib/undo';
import { rememberViewed, rememberedViewed } from '../../lib/viewedMember';
import { formatDateShort, isPast, relativeDay } from '../../utils/dateUtils';
import AddBar from '../../components/AddBar';
import ChecklistItem from '../../components/ChecklistItem';
import CompletedSection from '../../components/CompletedSection';
import EmptyState from '../../components/EmptyState';
import EntryMarks from '../../components/EntryMarks';
import KindPickDialog from '../../components/KindPickDialog';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useMembers } from '../../hooks/useMembers';
import { useSession } from '../../hooks/useSession';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { viewableMembers } from './household';
import { SALUD_KINDS, SALUD_KIND_LABELS, type SaludKind } from './kinds';
import { checkupMarks } from './marks';
import MemberChips from './MemberChips';
import { groupCheckups, isDone, markMessage } from './recurrence';
import { useCheckups } from './useCheckups';
import { useHealthRecords } from './useHealthRecords';
import { useToday } from '../../hooks/useToday';

/** The two kinds an entry can be born as. */
const KIND_OPTIONS = SALUD_KINDS.map((kind) => ({ kind, label: SALUD_KIND_LABELS[kind].one }));

/** One member's health at a time — the signed-in member's or a pet's, chosen
 *  on the row of chips over the list and remembered on the device — in two
 *  fixed sections: the checkups still to have done, then the studies kept,
 *  newest first. An empty section is not drawn; a checkup done for good
 *  folds into «Hechos» at the end. */
export default function SaludPage() {
  const checkups = useCheckups();
  const records = useHealthRecords();
  const members = useMembers();
  const session = useSession();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'checkup'), [attachments]);
  const navigate = useNavigate();
  // The title typed into the bar, while its kind is being asked.
  const [naming, setNaming] = useState<string | null>(null);

  const viewable = useMemo(
    () => viewableMembers(members.items, session?.user.email ?? null),
    [members.items, session],
  );
  // The member last viewed, if this device still may show them; else the
  // first — the signed-in member, once the household has come down.
  const [viewed, setViewed] = useState<string | null>(rememberedViewed);
  const current = viewable.find((member) => member.id === viewed) ?? viewable[0] ?? null;
  const currentId = current?.id ?? null;
  useEffect(() => {
    if (currentId !== null) rememberViewed(currentId);
  }, [currentId]);

  const today = useToday();
  const { pending, done } = useMemo(
    () => groupCheckups(checkups.items.filter((checkup) => checkup.member_id === currentId)),
    [checkups.items, currentId],
  );
  const kept = useMemo(
    () => records.items.filter((record) => record.member_id === currentId),
    [records.items, currentId],
  );

  function toggle(checkup: Checkup) {
    if (isDone(checkup)) {
      void checkups.unmark(checkup.id);
      return;
    }
    void checkups.mark(checkup);
    // The copy is taken before the mark, so undoing puts back both the day it
    // was last marked and the day it was due.
    offerUndo({ message: markMessage(checkup, today), undo: () => checkups.restore(checkup) });
  }

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
        trailing={<EntryMarks marks={checkupMarks(checkup, attached.has(checkup.id))} />}
        onToggle={() => toggle(checkup)}
        toggleLabel={finished ? 'Marcar como pendiente' : 'Marcar como hecho'}
      />
    );
  }

  const empty = pending.length === 0 && done.length === 0 && kept.length === 0;

  /** An entry is born from its title and its kind, chosen now and never
   *  again, under the member being viewed, chosen once the same way: a
   *  checkup undated and done once, a study on today. Either is opened to
   *  have the rest said about it. */
  async function addEntry(title: string, kind: SaludKind, memberId: string) {
    setNaming(null);
    const id =
      kind === 'checkup'
        ? await checkups.add(
            { title, due_on: null, comments: null, repeat_every: null, repeat_unit: null },
            memberId,
          )
        : await records.add({ title, on_date: today }, memberId);
    if (id) void navigate(entryPath('salud', id));
  }

  return (
    <ListPage
      loading={checkups.loading || records.loading || members.loading}
      error={checkups.error ?? records.error}
      skeleton={<SkeletonRows leading="check" subtitle />}
      bar={
        // Nothing can be born before there is a member to be born under.
        current !== null && (
          <AddBar
            // The kind is asked first, and the bar keeps the title while it is.
            onAdd={(title) => {
              setNaming(title);
              return false;
            }}
            placeholder="Agregar un pendiente o resultado..."
            inputLabel="Nuevo pendiente o resultado"
          />
        )
      }
    >
      {current !== null && (
        // Drawn with one member as with three, so the page reads the same.
        <div className="mb-5">
          <MemberChips members={viewable} value={current.id} onChange={setViewed} />
        </div>
      )}
      {empty && <EmptyState>Todavía no hay pendientes ni resultados.</EmptyState>}
      {pending.length > 0 && (
        <section className="mb-6">
          <SectionLabel>{SALUD_KIND_LABELS.checkup.many}</SectionLabel>
          <ul>{pending.map(renderCheckup)}</ul>
        </section>
      )}
      {kept.length > 0 && (
        <section className="mb-6">
          <SectionLabel>{SALUD_KIND_LABELS.record.many}</SectionLabel>
          <ul>
            {kept.map((record) => (
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
      {naming !== null && current !== null && (
        <KindPickDialog
          title={naming}
          options={KIND_OPTIONS}
          onPick={(kind) => void addEntry(naming, kind, current.id)}
          onClose={() => setNaming(null)}
        />
      )}
    </ListPage>
  );
}
