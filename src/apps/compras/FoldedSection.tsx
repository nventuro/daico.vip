import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShoppingSection } from '../../lib/offline/specs';
import SectionLabel from '../../components/SectionLabel';
import { headingId } from './listing';
import SectionHandle from './SectionHandle';

interface FoldedSectionProps {
  section: ShoppingSection;
  /** How many items it holds. */
  count: number;
}

/** A section folded to its heading while the sections are put in order: its
 *  name, how many items it holds, and the handle it is dragged by. */
export default function FoldedSection({ section, count }: FoldedSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: headingId(section),
    data: { section },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`py-1 ${isDragging ? 'relative z-10 bg-surface shadow-lg' : ''}`}
    >
      <SectionLabel
        detail={count}
        aside={<SectionHandle attributes={attributes} listeners={listeners} />}
        className={isDragging ? 'text-on-surface' : 'text-muted'}
      >
        {section.name}
      </SectionLabel>
    </div>
  );
}
