import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PantryItem } from '../../lib/offline/specs';
import { ownersWithAttachments, useAttachments } from '../../hooks/useAttachments';
import { useToday } from '../../hooks/useToday';
import { offerUndo } from '../../lib/undo';
import AddBar from '../../components/AddBar';
import ChecklistItem from '../../components/ChecklistItem';
import CompletedSection from '../../components/CompletedSection';
import EmptyState from '../../components/EmptyState';
import EntryMarks from '../../components/EntryMarks';
import ListPage from '../../components/ListPage';
import LaterSection from '../../components/LaterSection';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { USED_LABEL } from './labels';
import { pantryMarks } from './marks';
import { groupPantry, isGoneOff, isUsed, itemSubtitle } from './pantry';
import { usePantry } from './usePantry';

export default function PantryPage() {
  const { items, loading, error, add, mark, unmark } = usePantry();
  const { items: attachments } = useAttachments();
  const attached = useMemo(() => ownersWithAttachments(attachments, 'pantry_item'), [attachments]);
  const navigate = useNavigate();

  const today = useToday();
  const { soon, later, used } = useMemo(() => groupPantry(items, today), [items, today]);

  function toggle(item: PantryItem) {
    if (isUsed(item)) {
      void unmark(item.id);
      return;
    }
    void mark(item.id);
    offerUndo({ message: USED_LABEL, undo: () => unmark(item.id) });
  }

  /** An item is born from its title alone, undated and in the cupboard, and
   *  opened to have the rest said about it. */
  async function addItem(title: string) {
    const id = await add(title);
    if (id) void navigate(entryPath('despensa', id));
  }

  function renderItem(item: PantryItem) {
    const finished = isUsed(item);
    return (
      <ChecklistItem
        key={item.id}
        checked={finished}
        label={item.title}
        to={entryPath('despensa', item.id)}
        subtitle={itemSubtitle(item, today)}
        overdue={isGoneOff(item, today)}
        trailing={<EntryMarks marks={pantryMarks(item, attached.has(item.id))} />}
        onToggle={() => toggle(item)}
        toggleLabel={finished ? 'Marcar como no usado' : 'Marcar como usado'}
      />
    );
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows leading="check" subtitle />}
      bar={
        <AddBar
          onAdd={(title) => void addItem(title)}
          placeholder="Agregar a la despensa..."
          inputLabel="Nuevo en la despensa"
        />
      }
    >
      {soon.length === 0 && later.length === 0 && (
        <EmptyState>Todavía no hay nada en la despensa.</EmptyState>
      )}
      {soon.length > 0 && <ul>{soon.map(renderItem)}</ul>}
      <LaterSection count={later.length} headed={soon.length > 0}>
        <ul>{later.map(renderItem)}</ul>
      </LaterSection>
      <CompletedSection label="Usados" count={used.length}>
        <ul>{used.map(renderItem)}</ul>
      </CompletedSection>
    </ListPage>
  );
}
