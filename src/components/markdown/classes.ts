// =============================================================================
// How each element of a body is drawn, in one place: the renderer reads these
// and so does the editor, which is what makes a body look the same whether it
// is being read or written.
// =============================================================================

export const MARKDOWN_CLASS = {
  h1: 'mt-8 mb-3 font-display text-2xl font-black',
  h2: 'mt-6 mb-2 font-display text-xl font-black',
  h3: 'mt-5 mb-2 text-lg font-semibold',
  p: 'my-3 leading-relaxed',
  ul: 'my-3 list-disc pl-5',
  ol: 'my-3 list-decimal pl-5',
  // The editor keeps an item's text in a paragraph of its own; the margins
  // around it are the item's, so that paragraph has none of its own.
  li: 'my-1 leading-relaxed [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
  // A ticked list is a list without bullets, each row a box and its text.
  taskList: 'my-3 list-none pl-0',
  taskItem:
    'my-1 flex items-start gap-2 leading-relaxed [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
  blockquote: 'my-3 border-l-4 border-primary pl-3 text-muted-strong',
  hr: 'my-6 border-border',
  code: 'bg-border-subtle px-1 font-mono text-sm',
  codeBlock: 'my-4 overflow-x-auto bg-border-subtle px-1 font-mono text-sm',
  a: 'text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary',
} as const;
