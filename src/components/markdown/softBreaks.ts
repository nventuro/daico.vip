import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

/**
 * A soft line break — a newline inside a paragraph — read as the space it
 * stands for. The editor reads it so, and the reader keeps every space it is
 * given, so left in, a newline would read as a line of its own here and as a
 * space there.
 */
export function softBreaksAsSpaces() {
  return (tree: Root) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/\n/g, ' ');
    });
  };
}
