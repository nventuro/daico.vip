import { Children, createContext, isValidElement, useContext, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { Link } from 'react-router-dom';
import { MARKDOWN_CLASS } from './classes';
import { directivesToElements } from './directives';
import Video from './Video';
import Spoiler from './Spoiler';

const remarkPlugins = [remarkGfm, remarkDirective, directivesToElements];

// The editor draws the same text once it takes over from this renderer, so
// wherever the two would draw a block differently, this side draws it the
// editor's way: a task item as a labelled box and then its text in a block of
// its own, a fenced block as one styled `pre`, a heading deeper than the
// dialect tells apart as the last one it does.

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
      <input type="checkbox" checked={checked} onChange={() => {}} />
      <span />
    </label>
  );
}

function ListItem({ className, children }: { className?: string; children?: ReactNode }) {
  if (!className?.includes('task-list-item')) {
    return <li className={MARKDOWN_CLASS.li}>{children}</li>;
  }
  const parts = Children.toArray(children);
  const box = parts.findIndex((part) => isValidElement(part) && part.type === TaskCheckbox);
  return (
    <li className={MARKDOWN_CLASS.taskItem}>
      {parts[box]}
      <div>{parts.filter((_, i) => i !== box)}</div>
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
  a: ({ href = '', children }: { href?: string; children?: ReactNode }) =>
    href.startsWith('/') && !href.startsWith('//') ? (
      <Link to={href} className={MARKDOWN_CLASS.a}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className={MARKDOWN_CLASS.a}>
        {children}
      </a>
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
  h1: ({ children }: { children?: ReactNode }) => <h2 className={MARKDOWN_CLASS.h1}>{children}</h2>,
  h2: ({ children }: { children?: ReactNode }) => <h3 className={MARKDOWN_CLASS.h2}>{children}</h3>,
  h3: ({ children }: { children?: ReactNode }) => <h4 className={MARKDOWN_CLASS.h3}>{children}</h4>,
  h4: ({ children }: { children?: ReactNode }) => <h4 className={MARKDOWN_CLASS.h3}>{children}</h4>,
  h5: ({ children }: { children?: ReactNode }) => <h4 className={MARKDOWN_CLASS.h3}>{children}</h4>,
  h6: ({ children }: { children?: ReactNode }) => <h4 className={MARKDOWN_CLASS.h3}>{children}</h4>,
  p: ({ children }: { children?: ReactNode }) => <p className={MARKDOWN_CLASS.p}>{children}</p>,
  ul: List,
  ol: ({ children }: { children?: ReactNode }) => <ol className={MARKDOWN_CLASS.ol}>{children}</ol>,
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

interface MarkdownProps {
  body: string;
  /** Element overrides layered over the base map (e.g. a real `image`). */
  components?: Components;
}

/** Renders a body in the app's markdown dialect: CommonMark + GFM tables plus
 *  the directives (`::youtube`, `:spoiler`, `:::ingredients`, `::image`). */
export default function Markdown({ body, components }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      components={components ? { ...baseComponents, ...components } : baseComponents}
    >
      {body}
    </ReactMarkdown>
  );
}
