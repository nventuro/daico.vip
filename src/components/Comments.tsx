import Body from './editor/Body';
import SectionLabel from './SectionLabel';

interface CommentsProps {
  /** What is written about the entry, as stored. */
  value: string;
  /** Every change, as markdown; saving it is the page's. */
  onChange: (markdown: string) => void;
}

/** What is written about an entry, headed like the sections around it: the
 *  space says what it is before it says anything else, and while it is empty
 *  it says that it is written in. */
export default function Comments({ value, onChange }: CommentsProps) {
  return (
    <div>
      <SectionLabel>Comentarios</SectionLabel>
      <Body value={value} onChange={onChange} placeholder="Escribir algo" ariaLabel="Comentarios" />
    </div>
  );
}
