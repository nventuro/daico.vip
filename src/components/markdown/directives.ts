import { SKIP, visit } from 'unist-util-visit';
import type { ListItem, Root } from 'mdast';

/** Name of the container directive whose list becomes a tickable ingredient list. */
const INGREDIENTS_DIRECTIVE = 'ingredients';

/** The plain text of a node — every text-bearing descendant concatenated, with
 *  inline markup dropped and whitespace collapsed. */
function textOf(node: ListItem): string {
  const parts: string[] = [];
  visit(node, (child) => {
    if ('value' in child && typeof child.value === 'string') parts.push(child.value);
  });
  return parts.join('').replace(/\s+/g, ' ').trim();
}

/**
 * remark plugin: renders each directive as an element named after it
 * (`::image{…}` → `<image …>`, `:spoiler[…]` → `<spoiler>`), with the
 * directive's attributes as props, so a markdown renderer can map them to
 * components. `key` is renamed to `imageKey` because React reserves `key`.
 *
 * `:::ingredients` is special: its list items are flattened to plain text and
 * handed over as one newline-separated `items` prop (an item can't contain a
 * newline once collapsed, and a string prop survives the hast→JSX bridge
 * intact, unlike an array), with no children. Anything in the block that isn't
 * a list item — the optional label, stray paragraphs — is ignored.
 */
export function directivesToElements() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective' && node.name === INGREDIENTS_DIRECTIVE) {
        const items: string[] = [];
        visit(node, 'listItem', (item) => {
          const text = textOf(item);
          if (text) items.push(text);
          // A nested list is part of its parent item's text, not more items.
          return SKIP;
        });
        node.data = {
          hName: INGREDIENTS_DIRECTIVE,
          hProperties: { items: items.join('\n') },
          hChildren: [],
        };
        return SKIP;
      }
      if (
        node.type !== 'leafDirective' &&
        node.type !== 'textDirective' &&
        node.type !== 'containerDirective'
      ) {
        return;
      }
      const { key, ...rest } = node.attributes ?? {};
      node.data = {
        ...node.data,
        hName: node.name,
        hProperties: key === undefined ? rest : { ...rest, imageKey: key },
      };
    });
  };
}
