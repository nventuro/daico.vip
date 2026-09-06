import { Children, createContext, isValidElement, useContext, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { Link } from 'react-router-dom';
import { MARKDOWN_CLASS } from './classes';
import { directivesToElements } from './directives';
import { softBreaksAsSpaces } from './softBreaks';
import Video from './Video';
import Spoiler from './Spoiler';

const remarkPlugins = [remarkGfm, remarkDirective, directivesToElements, softBreaksAsSpaces];

// The editor draws the same text once it takes over from this renderer, so
// wherever the two would draw a block differently, this side draws it the
// editor's way: a list item's text in a paragraph of its own, a task item as
// a labelled box and then that paragraph in a block of its own, a fenced
// block as one styled `pre`, a heading deeper than the dialect tells apart as
// the last one it does, an image by address as the text it is.

/** Whether a `code` is the one inside a fenced block, drawn by its `pre`. */
const InCodeBlock = createContext(false);

function Code({ children }: { children?: ReactNode }) {
  const inBlock = useContext(InCodeBlock);
  return <code className={inBlock ? undefined : MARKDOWN_CLASS.code}>{children}</code>;
}

function Pre({ children }: { children?: ReactNode }) {
  return (
    <InCodeBlock.Provider value={true}>
      <pre className={MARKDOWN_CLASS.codeBlock}>{children}</pre>
    </InCodeBlock.Provider>
  );
}

/** A task item's box. It is read, not ticked: the text is the editor's to change. */
function TaskCheckbox({ checked = false }: { checked?: boolean }) {
  return (
    <label>
      <input type="checkbox" checked={checked} onChange={() => {}} tabIndex={-1} />
      <span />
    </label>
  );
}

function Paragraph({ children }: { children?: ReactNode }) {
  return <p className={MARKDOWN_CLASS.p}>{children}</p>;
}

/** Whether a part of an item is a block of its own rather than its text. */
function isBlock(part: ReactNode): boolean {
  return isValidElement(part) && BLOCKS.has(part.type);
}

/** An item's parts with its text in a paragraph, as the editor keeps it: a
 *  tight list comes with the text bare, a loose one with it in paragraphs
 *  already, and the two must draw alike. A newline between blocks is only
 *  the markup's own. */
function inParagraphs(parts: ReactNode[]): ReactNode[] {
  const out: ReactNode[] = [];
  let text: ReactNode[] = [];
  const flush = () => {
    if (text.some((part) => typeof part !== 'string' || part.trim() !== '')) {
      out.push(<Paragraph key={out.length}>{text}</Paragraph>);
    }
    text = [];
  };
  for (const part of parts) {
    if (isBlock(part)) {
      flush();
      out.push(part);
    } else {
      text.push(part);
    }
  }
  flush();
  return out;
}

function ListItem({ className, children }: { className?: string; children?: ReactNode }) {
  const parts = Children.toArray(children);
  if (!className?.includes('task-list-item')) {
    return <li className={MARKDOWN_CLASS.li}>{inParagraphs(parts)}</li>;
  }
  const box = parts.findIndex((part) => isValidElement(part) && part.type === TaskCheckbox);
  const rest = parts.filter((_, i) => i !== box);
  // The box's own space, which the editor does not draw.
  if (typeof rest[0] === 'string') rest[0] = rest[0].trimStart();
  return (
    <li className={MARKDOWN_CLASS.taskItem}>
      {parts[box]}
      <div>{inParagraphs(rest)}</div>
    </li>
  );
}

function List({ className, children }: { className?: string; children?: ReactNode }) {
  const task = className?.includes('contains-task-list');
  return <ul className={task ? MARKDOWN_CLASS.taskList : MARKDOWN_CLASS.ul}>{children}</ul>;
}

// Custom element names come from the directive plugin; react-markdown's
// `Components` type only knows HTML tags, hence the cast.
const baseComponents = {
  // A path is ours; everything else opens away from the app, `//host` included
  // — that is another origin, however much it reads like a path.
  a: ({ href = '', title, children }: { href?: string; title?: string; children?: ReactNode }) =>
    href.startsWith('/') && !href.startsWith('//') ? (
      <Link to={href} title={title} className={MARKDOWN_CLASS.a}>
        {children}
      </Link>
    ) : (
      <a
        href={href}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        className={MARKDOWN_CLASS.a}
      >
        {children}
      </a>
    ),
  // Nothing draws an image by address — the page may load no picture from
  // outside — so it is shown as what was written, one piece.
  img: ({ src = '', alt = '', title }: { src?: string; alt?: string; title?: string }) => (
    <code className={MARKDOWN_CLASS.code}>{`![${alt}](${src}${title ? ` "${title}"` : ''})`}</code>
  ),
  // Only content that comes with its own image store can resolve one; anywhere
  // else the directive renders nothing rather than a broken figure.
  image: () => null,
  youtube: ({ id, start }: { id: string; start?: string }) => (
    <Video id={id} start={Number(start) || 0} />
  ),
  spoiler: ({ children }: { children?: ReactNode }) => <Spoiler>{children}</Spoiler>,
  // Only a screen that can offer to add what is missing renders the list;
  // anywhere else the directive renders nothing rather than a dead checklist.
  ingredients: () => null,
  h1: ({ children }: { children?: ReactNode }) => <h1 className={MARKDOWN_CLASS.h1}>{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <h2 className={MARKDOWN_CLASS.h2}>{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 className={MARKDOWN_CLASS.h3}>{children}</h3>,
  h4: ({ children }: { children?: ReactNode }) => <h3 className={MARKDOWN_CLASS.h3}>{children}</h3>,
  h5: ({ children }: { children?: ReactNode }) => <h3 className={MARKDOWN_CLASS.h3}>{children}</h3>,
  h6: ({ children }: { children?: ReactNode }) => <h3 className={MARKDOWN_CLASS.h3}>{children}</h3>,
  p: Paragraph,
  del: ({ children }: { children?: ReactNode }) => <s>{children}</s>,
  ul: List,
  ol: ({ start, children }: { start?: number; children?: ReactNode }) => (
    <ol start={start} className={MARKDOWN_CLASS.ol}>
      {children}
    </ol>
  ),
  li: ListItem,
  input: TaskCheckbox,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className={MARKDOWN_CLASS.blockquote}>{children}</blockquote>
  ),
  hr: () => <hr className={MARKDOWN_CLASS.hr} />,
  code: Code,
  pre: Pre,
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border border-border bg-border-subtle px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border border-border px-2 py-1 align-top">{children}</td>
  ),
} as unknown as Components;

/** What an item of a list holds beside its text: another block. */
const BLOCKS = new Set<unknown>([
  List,
  Pre,
  Paragraph,
  baseComponents.ol,
  baseComponents.blockquote,
  baseComponents.hr,
  baseComponents.table,
]);

interface MarkdownProps {
  body: string;
  /** Element overrides layered over the base map (e.g. a real `image`). */
  components?: Components;
}

/** Renders a body in the app's markdown dialect: CommonMark + GFM tables plus
 *  the directives (`::youtube`, `:spoiler`, `:::ingredients`, `::image`). */
export default function Markdown({ body, components }: MarkdownProps) {
  return (
    <div className={MARKDOWN_CLASS.body}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={components ? { ...baseComponents, ...components } : baseComponents}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
