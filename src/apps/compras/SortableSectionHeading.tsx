import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShoppingSection } from '../../lib/offline/specs';
import SectionLabel from '../../components/SectionLabel';
import { entryPath } from '../types';
import { headingId } from './listing';
import SectionHandle from './SectionHandle';

interface SortableSectionHeadingProps {
  /** The section it heads; null for what is in none. */
  section: ShoppingSection | null;
}

/**
 * A group's heading on the list, sorted among the items so that one can be
 * dropped right under it. A section's leads to its page and is dragged by the
 * handle at the end of its hairline; the heading of what is in no section is
 * neither, and stays last.
 */
export default function SortableSectionHeading({ section }: SortableSectionHeadingProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: headingId(section),
    data: { section },
    disabled: section === null ? { draggable: true } : undefined,
  });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      {section === null ? (
        // As tall as a section's heading, whose name is padded to a target.
        <div className="py-2">
          <SectionLabel>Sin sección</SectionLabel>
        </div>
      ) : (
        <SectionLabel
          to={entryPath('compras', section.id)}
          aside={<SectionHandle attributes={attributes} listeners={listeners} />}
        >
          {section.name}
        </SectionLabel>
      )}
    </div>
  );
}
