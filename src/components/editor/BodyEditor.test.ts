import { describe, it, expect } from 'vitest';
import { MarkdownManager } from '@tiptap/markdown';
import { bodyExtensions } from './extensions';

// The parser and serialiser the editor is made with, run without an editor:
// what a body is opened from and saved back as, and nothing in between.
const manager = new MarkdownManager({ extensions: bodyExtensions('') });

const roundTrip = (markdown: string) => manager.serialize(manager.parse(markdown));

/** What the dialect is written in, as the household would type it. */
const KEPT = [
  '# Título\n\nUn párrafo con **negrita**, *cursiva* y `código`.',
  '## Segundo\n\n### Tercero\n\nTexto.',
  '- uno\n- dos\n  - anidado\n- tres',
  '1. primero\n2. segundo',
  '- [ ] por hacer\n- [x] hecho',
  '> una cita\n> de dos líneas',
  '```\ncódigo\n  con sangría\n```',
  '---',
  'Un [enlace](https://ejemplo.test/ruta) y otro [interno](/guias/g/c).',
  'línea uno\nlínea dos',
  'línea uno  \nlínea dos',
  'Párrafo uno\n\nPárrafo dos',
  '~~tachado~~',
  '',
];

/** Written one way, kept another that reads the same. */
const NORMALISED: [string, string][] = [
  ['_cursiva_ y __negrita__', '*cursiva* y **negrita**'],
  ['* con asterisco\n* otro', '- con asterisco\n- otro'],
  ['   \n\n  ', ''],
];

describe('the body round trip', () => {
  it.each(KEPT)('keeps %j', (markdown) => {
    expect(roundTrip(markdown)).toBe(markdown);
  });

  it.each(NORMALISED)('writes %j as %j', (written, kept) => {
    expect(roundTrip(written)).toBe(kept);
    expect(roundTrip(kept)).toBe(kept);
  });

  it('keeps a table as the text it is, whatever it holds', () => {
    const table = 'Antes\n\n| a | b |\n| --- | --- |\n| x_y | *z* |\n\nDespués';
    expect(roundTrip(table)).toBe(table);
    expect(roundTrip(roundTrip(table))).toBe(table);
  });

  it('keeps the block directives as the text they are', () => {
    const directives =
      '::youtube{id="abc" start="0"}\n\n:::spoiler\nescondido\n:::\n\n::image{key="k" width="60"}';
    expect(roundTrip(directives)).toBe(directives);
  });

  it('keeps a literal that would otherwise read as markup', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'a*b*c, snake_case y > no cita' }] },
      ],
    };
    const markdown = manager.serialize(doc);
    expect(manager.parse(markdown)).toEqual(doc);
  });
});
