import type { ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { Link } from 'react-router-dom';
import { MARKDOWN_CLASS } from './classes';
import { directivesToElements } from './directives';
import Video from './Video';
import Spoiler from './Spoiler';

const remarkPlugins = [remarkGfm, remarkDirective, directivesToElements];

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
  p: ({ children }: { children?: ReactNode }) => <p className={MARKDOWN_CLASS.p}>{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className={MARKDOWN_CLASS.ul}>{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className={MARKDOWN_CLASS.ol}>{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className={MARKDOWN_CLASS.li}>{children}</li>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className={MARKDOWN_CLASS.blockquote}>{children}</blockquote>
  ),
  hr: () => <hr className={MARKDOWN_CLASS.hr} />,
  code: ({ children }: { children?: ReactNode }) => (
    <code className={MARKDOWN_CLASS.code}>{children}</code>
  ),
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
