// =============================================================================
// What the editor is made of: the nodes and marks of the app's markdown
// dialect, each drawn with the class the renderer draws it with; the parser
// and serialiser between them and the text; the placeholder. No React and no
// DOM at import, so the round trip can be run headlessly.
// =============================================================================
import {
  Extension,
  Node,
  mergeAttributes,
  type AnyExtension,
  type MarkdownTokenizer,
} from '@tiptap/core';
import Heading, { type Level } from '@tiptap/extension-heading';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import { MARKDOWN_CLASS } from '../markdown/classes';

/** The heading levels the dialect tells apart; a deeper one reads as the last. */
const HEADING_CLASS: Partial<Record<Level, string>> = {
  1: MARKDOWN_CLASS.h1,
  2: MARKDOWN_CLASS.h2,
  3: MARKDOWN_CLASS.h3,
};
const HEADING_LEVELS = Object.keys(HEADING_CLASS).map(Number) as Level[];

/** A heading drawn at its own size: `#` is the largest, as the renderer has it. */
const BodyHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = Math.min(
      Math.max(Number(node.attrs.level) || 1, 1),
      HEADING_LEVELS.length,
    ) as Level;
    return [`h${level}`, mergeAttributes(HTMLAttributes, { class: HEADING_CLASS[level] }), 0];
  },
}).configure({ levels: HEADING_LEVELS });

/**
 * A block the editor does not model, kept as the markdown text it is: a block
 * of its own whose text is never escaped on the way out, so it survives every
 * open untouched unless it is written on. It is drawn as code, which is what
 * it reads as here. `tokenName` is the marked token it is made from — one of
 * marked's own, or the one `tokenizer` cuts out of the text.
 */
function keptAsText(name: string, tokenName: string, tokenizer?: MarkdownTokenizer) {
  const attribute = `data-${name}`;
  return Node.create({
    name,
    group: 'block',
    content: 'text*',
    marks: '',
    code: true,
    defining: true,
    parseHTML() {
      return [{ tag: `p[${attribute}]`, preserveWhitespace: 'full' }];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        'p',
        mergeAttributes(HTMLAttributes, {
          [attribute]: '',
          class: `${MARKDOWN_CLASS.p} ${MARKDOWN_CLASS.code} whitespace-pre-wrap`,
        }),
        0,
      ];
    },
    markdownTokenName: tokenName,
    markdownTokenizer: tokenizer,
    parseMarkdown: (token, helpers) =>
      helpers.createNode(name, {}, [{ type: 'text', text: (token.raw ?? '').trim() }]),
    renderMarkdown: (node, helpers) => helpers.renderChildren(node),
  });
}

/** A GFM table, from marked's own token. */
const MarkdownTable = keptAsText('markdownTable', 'table');

/**
 * A container directive (`:::name` … `:::`), which marked would read as a
 * paragraph and the soft-break rule below would then fold onto one line.
 * Cut out whole, from the opening line to the first closing one.
 */
const CONTAINER_DIRECTIVE = /^:::[^\n]*\n[\s\S]*?\n:::[ \t]*(?=\n|$)/;
const MarkdownDirective = keptAsText('markdownDirective', 'markdownDirective', {
  name: 'markdownDirective',
  level: 'block',
  start: (src) => src.search(/^:::/m),
  tokenize: (src) => {
    const match = CONTAINER_DIRECTIVE.exec(src);
    return match ? { type: 'markdownDirective', raw: match[0] } : undefined;
  },
});

/**
 * A newline on its own inside a paragraph: the dialect reads it as a space,
 * so the editor does too, or it would draw a line break the renderer does
 * not. A hard break — two spaces or a backslash before the newline — is left
 * to the rule that reads it. Marked cuts a run of text short at `start`, so
 * the newline is met on its own and read here.
 */
const SOFT_BREAK = /(?<! {2}|\\)\n/;
const SoftBreak = Extension.create({
  name: 'softBreak',
  markdownTokenizer: {
    name: 'softBreak',
    level: 'inline',
    start: (src) => src.search(SOFT_BREAK),
    tokenize: (src) => (src.startsWith('\n') ? { type: 'text', raw: '\n', text: ' ' } : undefined),
  },
});

/** The editor's extensions, with `placeholder` shown while the body is empty. */
export function bodyExtensions(placeholder: string): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: false,
      // Has no form in the dialect: the renderer would show its marks.
      underline: false,
      link: {
        autolink: true,
        linkOnPaste: true,
        // A tap on a link places the caret; the bubble is where it is opened.
        openOnClick: false,
        HTMLAttributes: { class: MARKDOWN_CLASS.a },
      },
      paragraph: { HTMLAttributes: { class: MARKDOWN_CLASS.p } },
      bulletList: { HTMLAttributes: { class: MARKDOWN_CLASS.ul } },
      orderedList: { HTMLAttributes: { class: MARKDOWN_CLASS.ol } },
      listItem: { HTMLAttributes: { class: MARKDOWN_CLASS.li } },
      blockquote: { HTMLAttributes: { class: MARKDOWN_CLASS.blockquote } },
      horizontalRule: { HTMLAttributes: { class: MARKDOWN_CLASS.hr } },
      code: { HTMLAttributes: { class: MARKDOWN_CLASS.code } },
      codeBlock: { HTMLAttributes: { class: MARKDOWN_CLASS.codeBlock } },
    }),
    BodyHeading,
    TaskList.configure({ HTMLAttributes: { class: MARKDOWN_CLASS.taskList } }),
    TaskItem.configure({ nested: true, HTMLAttributes: { class: MARKDOWN_CLASS.taskItem } }),
    MarkdownTable,
    MarkdownDirective,
    SoftBreak,
    Placeholder.configure({ placeholder }),
    Markdown,
  ];
}
