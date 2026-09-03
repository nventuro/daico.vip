// =============================================================================
// What the editor is made of: the nodes and marks of the app's markdown
// dialect, each drawn with the class the renderer draws it with; the parser
// and serialiser between them and the text; the placeholder. No React and no
// DOM at import, so the round trip can be run headlessly.
// =============================================================================
import { Node, mergeAttributes, type AnyExtension } from '@tiptap/core';
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
 * A GFM table, which the editor does not model: it is kept as the markdown
 * text it is, in a block of its own whose text is never escaped on the way
 * out, so a table survives every open untouched unless it is written on. It
 * is drawn as code, which is what it reads as here.
 */
const MarkdownTable = Node.create({
  name: 'markdownTable',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  defining: true,
  parseHTML() {
    return [{ tag: 'p[data-markdown-table]', preserveWhitespace: 'full' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-markdown-table': '',
        class: `${MARKDOWN_CLASS.p} ${MARKDOWN_CLASS.code} whitespace-pre-wrap`,
      }),
      0,
    ];
  },
  markdownTokenName: 'table',
  parseMarkdown: (token, helpers) =>
    helpers.createNode('markdownTable', {}, [{ type: 'text', text: (token.raw ?? '').trim() }]),
  renderMarkdown: (node, helpers) => helpers.renderChildren(node),
});

/** A ticked list is a list without bullets, each row a box and its text. */
const TASK_LIST_CLASS = 'my-3 list-none pl-0';
const TASK_ITEM_CLASS = 'my-1 flex items-start gap-2 leading-relaxed';

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
      codeBlock: { HTMLAttributes: { class: `my-4 overflow-x-auto ${MARKDOWN_CLASS.code}` } },
    }),
    BodyHeading,
    TaskList.configure({ HTMLAttributes: { class: TASK_LIST_CLASS } }),
    TaskItem.configure({ nested: true, HTMLAttributes: { class: TASK_ITEM_CLASS } }),
    MarkdownTable,
    Placeholder.configure({ placeholder }),
    Markdown,
  ];
}
