import { useMemo, useState } from 'react';
import { useEntry } from '../../hooks/useEntry';
import { useLeave } from '../../hooks/useLeave';
import AddBar from '../../components/AddBar';
import DeleteDialog from '../../components/DeleteDialog';
import EmptyState from '../../components/EmptyState';
import EntryHead from '../../components/EntryHead';
import EntryPage from '../../components/EntryPage';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import { appPath } from '../types';
import ClearStruckButton from './ClearStruckButton';
import ItemList from './ItemList';
import { useShoppingList } from './useShoppingList';
import { useShoppingSections } from './useShoppingSections';

/** What becomes of a deleted section's items, said before it is deleted. */
function itemsLeftBehind(count: number): string | undefined {
  if (count === 0) return undefined;
  if (count === 1) return 'Su producto pasa a «Sin sección».';
  return `Sus ${count} productos pasan a «Sin sección».`;
}

/** One section of the list, for filling it: what the bar adds goes straight
 *  into it. Deleted, its items stay on the list, in none. */
export default function SectionPage() {
  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
    rename,
    remove,
  } = useShoppingSections();
  const section = useEntry(sections);
  const { items, loading, error, add, toggle, removeChecked, restore, move } = useShoppingList();
  const leave = useLeave();
  const [deleting, setDeleting] = useState(false);

  const id = section?.id;
  const inSection = useMemo(() => items.filter((i) => i.section_id === id), [items, id]);
  const hasStruck = inSection.some((i) => i.checked);

  /** The section goes, and its items with nowhere to be are in none. */
  async function removeSection(id: string) {
    await remove(id);
    leave(appPath('compras'));
  }

  return (
    <ListPage
      loading={sectionsLoading || loading}
      error={sectionsError ?? error}
      skeleton={<SkeletonRows leading="check" />}
      bar={
        section && (
          <AddBar
            onAdd={(name) => void add(name, section.id)}
            placeholder={`Agregar a ${section.name}...`}
            inputLabel="Nuevo producto"
            notice={
              hasStruck ? (
                <ClearStruckButton clear={() => removeChecked(section.id)} restore={restore} />
              ) : undefined
            }
          />
        )
      }
    >
      {/* A section is both an entry and a list: the list's frame carries the
          offline notice and the add bar, and this says when it is not there. */}
      <EntryPage entry={section} loading={sectionsLoading} missing="Sección no encontrada.">
        {(section) => (
          <>
            <div key={section.id} className="mb-6">
              <EntryHead
                title={section.name}
                onTitle={(name) => void rename(section.id, name)}
                onDelete={() => setDeleting(true)}
                deleteLabel="Eliminar sección"
              />
            </div>
            {inSection.length === 0 ? (
              <EmptyState>Todavía no hay nada en esta sección.</EmptyState>
            ) : (
              <ItemList
                items={inSection}
                onToggle={(item) => void toggle(item)}
                onMove={(id, position) => void move(id, { position })}
              />
            )}
            <DeleteDialog
              open={deleting}
              question="¿Eliminar la sección?"
              detail={itemsLeftBehind(inSection.length)}
              onCancel={() => setDeleting(false)}
              onConfirm={() => void removeSection(section.id)}
            />
          </>
        )}
      </EntryPage>
    </ListPage>
  );
}
