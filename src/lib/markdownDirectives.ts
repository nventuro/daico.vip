import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

/**
 * remark plugin: renders each directive as an element named after it
 * (`::image{…}` → `<image …>`, `:spoiler[…]` → `<spoiler>`), with the
 * directive's attributes as props, so a markdown renderer can map them to
 * components. `key` is renamed to `imageKey` because React reserves `key`.
 */
export function directivesToElements() {
  return (tree: Root) => {
    visit(tree, (node) => {
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
