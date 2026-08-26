import type { ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { Link } from 'react-router-dom';
import { directivesToElements } from '../../lib/markdownDirectives';
import GuideImage from './GuideImage';
import GuideVideo from '../../components/GuideVideo';
import Spoiler from '../../components/Spoiler';

const remarkPlugins = [remarkGfm, remarkDirective, directivesToElements];

const linkClass = 'text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary';

// Custom element names come from the directive plugin; react-markdown's
// `Components` type only knows HTML tags, hence the cast.
const components = {
  a: ({ href = '', children }: { href?: string; children?: ReactNode }) =>
    href.startsWith('/') ? (
      <Link to={href} className={linkClass}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    ),
  image: ({ imageKey, width, align }: { imageKey: string; width?: string; align?: string }) => (
    <GuideImage
      key={imageKey}
      imageKey={imageKey}
      width={Number(width) || 100}
      align={align === 'left' || align === 'right' ? align : 'center'}
    />
  ),
  youtube: ({ id, start }: { id: string; start?: string }) => <GuideVideo id={id} start={Number(start) || 0} />,
  spoiler: ({ children }: { children?: ReactNode }) => <Spoiler>{children}</Spoiler>,
  h1: ({ children }: { children?: ReactNode }) => <h2 className="mt-8 mb-3 font-display text-2xl font-bold">{children}</h2>,
  h2: ({ children }: { children?: ReactNode }) => <h3 className="mt-6 mb-2 font-display text-xl font-bold">{children}</h3>,
  h3: ({ children }: { children?: ReactNode }) => <h4 className="mt-5 mb-2 text-lg font-semibold">{children}</h4>,
  p: ({ children }: { children?: ReactNode }) => <p className="my-3 leading-relaxed">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="my-3 list-disc pl-5">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="my-3 list-decimal pl-5">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="my-1 leading-relaxed">{children}</li>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-3 border-l-4 border-primary pl-3 text-muted-strong">{children}</blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-border-subtle px-1 font-mono text-sm">{children}</code>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border border-border bg-border-subtle px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => <td className="border border-border px-2 py-1 align-top">{children}</td>,
} as unknown as Components;

/** Renders a chapter body: CommonMark + GFM tables plus the app's directives. */
export default function GuideMarkdown({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {body}
    </ReactMarkdown>
  );
}
