import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShoppingList } from './useShoppingList';
import { useShoppingSections } from './useShoppingSections';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import KindPickDialog from '../../components/KindPickDialog';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import ClearStruckButton from './ClearStruckButton';
import GroupedList from './GroupedList';

/** The answers that are not a section: filing under none, and making a
 *  section of what was typed. A section's own answer is its id, a uuid,
 *  which neither can be. */
const NO_SECTION = 'none';
const NEW_SECTION = 'new';

/** What was typed into the bar while where it goes is asked, and how the bar
 *  is told whether to clear. */
interface Filing {
  name: string;
  answer: (added: boolean) => void;
}

export default function ShoppingPage() {
  const { items, loading, error, add, toggle, removeChecked, restore, move } = useShoppingList();
  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
    add: addSection,
    move: moveSection,
  } = useShoppingSections();
  const navigate = useNavigate();
  const [filing, setFiling] = useState<Filing | null>(null);

  /** What was typed goes where it was told: into a section, into none, or —
   *  a new section — becomes one, whose page it opens to be filled. */
  async function file(choice: string) {
    if (!filing) return;
    const { name, answer } = filing;
    setFiling(null);
    if (choice === NEW_SECTION) {
      const id = await addSection(name);
      answer(id !== undefined);
      if (id) void navigate(entryPath('compras', id));
      return;
    }
    answer(true);
    await add(name, choice === NO_SECTION ? null : choice);
  }

  const hasStruck = items.some((i) => i.checked);

  return (
    <ListPage
      loading={loading || sectionsLoading}
      error={error ?? sectionsError}
      skeleton={<SkeletonRows leading="check" />}
      bar={
        <AddBar
          // Where it goes is asked first, and the bar keeps the text until
          // it is answered.
          onAdd={(name) => new Promise<boolean>((answer) => setFiling({ name, answer }))}
          placeholder="Agregar..."
          inputLabel="Nuevo producto o sección"
          notice={
            hasStruck ? <ClearStruckButton clear={removeChecked} restore={restore} /> : undefined
          }
        />
      }
    >
      {items.length === 0 ? (
        <EmptyState>La lista está vacía. Agregá lo que necesites comprar.</EmptyState>
      ) : (
        <GroupedList
          sections={sections}
          items={items}
          onToggle={(item) => void toggle(item)}
          onMoveItem={(id, place) => void move(id, place)}
          onMoveSection={(id, position) => void moveSection(id, position)}
        />
      )}
      {filing && (
        <KindPickDialog
          question="Sección"
          options={[
            ...sections.map((section) => ({ kind: section.id, label: section.name })),
            { kind: NO_SECTION, label: 'sin sección', muted: true },
            { kind: NEW_SECTION, label: 'nueva sección', muted: true },
          ]}
          onPick={(choice) => void file(choice)}
          onClose={() => {
            filing.answer(false);
            setFiling(null);
          }}
        />
      )}
    </ListPage>
  );
}
