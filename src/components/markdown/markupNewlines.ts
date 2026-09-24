import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

/**
 * rehype plugin: drops the newline the markup puts between two blocks and
 * after a hard break. The reader keeps every space it is given, so left in,
 * each would be a blank line on screen that the editor, which has no such
 * newline, does not draw. A soft break reads as a space and a code block's
 * text ends in its own newline, so a text that is one newline and nothing
 * else is always the markup's.
 */
export function withoutMarkupNewlines() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (node.value !== '\n' || !parent || index === undefined) return undefined;
      parent.children.splice(index, 1);
      return index;
    });
  };
}
