import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { getSchema } from '@tiptap/core';
import { Node as ProseMirrorNode, type DOMOutputSpec } from '@tiptap/pm/model';
import { MarkdownManager } from '@tiptap/markdown';
import { bodyExtensions } from '../editor/extensions';
import Markdown from './Markdown';

// The reader and the editor draw a body from the same classes; this is what
// keeps them drawing the same elements in the same order, so nothing jumps
// on screen when the editor takes over from the reader.

const extensions = bodyExtensions('');
const schema = getSchema(extensions);
const manager = new MarkdownManager({ extensions });

/** An element as either side draws it: its tag and its classes. */
type Drawn = string;

const drawn = (tag: string, className: string | undefined): Drawn =>
  className ? `${tag}.${className.split(/\s+/).sort().join('.')}` : tag;

/** The elements of a rendering, in document order, the wrapper left out. */
function readerElements(markdown: string): Drawn[] {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <Markdown body={markdown} />
    </MemoryRouter>,
  );
  const elements: Drawn[] = [];
  for (const match of html.matchAll(/<([a-z0-9]+)((?:\s[^>]*?)?)\/?>/g)) {
    // As the attribute is written into HTML; the editor's spec has it raw.
    const className = /\sclass="([^"]*)"/.exec(match[2])?.[1]?.replace(/&amp;/g, '&');
    elements.push(drawn(match[1], className));
  }
  // The outer div is the reader's own; the editor's root is its counterpart.
  return elements.slice(1);
}

/** The elements a spec draws, with `content` where the hole is. */
function specElements(spec: DOMOutputSpec, content: () => Drawn[]): Drawn[] {
  if (typeof spec === 'string') return [];
  if (!Array.isArray(spec)) return [];
  const [tag, second, ...rest] = spec as [string, ...unknown[]];
  const hasAttrs = second !== null && typeof second === 'object' && !Array.isArray(second);
  const attrs = hasAttrs ? (second as Record<string, string>) : {};
  const children = hasAttrs ? rest : second === undefined ? [] : [second, ...rest];
  const out: Drawn[] = [drawn(tag, attrs.class)];
  for (const child of children) {
    if (child === 0) out.push(...content());
    else out.push(...specElements(child as DOMOutputSpec, content));
  }
  return out;
}

function nodeElements(node: ProseMirrorNode): Drawn[] {
  if (node.isText) {
    return node.marks.flatMap((mark) => {
      const spec = mark.type.spec.toDOM?.(mark, true);
      return spec ? specElements(spec, () => []) : [];
    });
  }
  const content = () => {
    const inner: Drawn[] = [];
    node.forEach((child) => inner.push(...nodeElements(child)));
    return inner;
  };
  const spec = node.type.spec.toDOM?.(node);
  return spec ? specElements(spec, content) : content();
}

function editorElements(markdown: string): Drawn[] {
  const doc = ProseMirrorNode.fromJSON(schema, manager.parse(markdown));
  return nodeElements(doc);
}

/** What the household writes, as both sides must draw it alike. What the
 *  editor keeps as the text it is — a table, a directive, a spoiler — is
 *  drawn by the reader and not by the editor, on purpose, and is not here. */
const BODIES = [
  '# Título\n\nUn párrafo con **negrita**, *cursiva* y `código`.',
  '## Segundo\n\n### Tercero\n\n#### Cuarto',
  '- uno\n- dos\n  - anidado\n- tres',
  '1. primero\n2. segundo',
  '3. tres\n4. cuatro',
  '- [ ] por hacer\n- [x] hecho',
  '```\ncódigo\n  con sangría\n```',
  '---',
  'Un [enlace](https://ejemplo.test/ruta) y otro [interno](/guias/g/c).',
  '> una cita',
  'línea uno  \nlínea dos',
  '~~tachado~~',
  '![foto](https://ejemplo.test/a.png)',
  '- uno\n\n- dos suelto',
];

describe('the reader and the editor', () => {
  it.each(BODIES)('draw %j as the same elements', (markdown) => {
    expect(readerElements(markdown)).toEqual(editorElements(markdown));
  });
});
