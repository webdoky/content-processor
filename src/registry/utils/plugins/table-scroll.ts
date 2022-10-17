import { visitParents } from 'unist-util-visit-parents';
import { HtmlNode } from '../interfaces';

const defaultWrapperClass = 'wd-table-scroll';

interface Options {
  class?: string;
}

/**
 * Plugin to wrap tables into a scrollable container div.
 *
 */
const addTableScroll = (options: Options = {}) => {
  const wrapperClass = options.class || defaultWrapperClass;

  return (tree) => {
    visitParents(
      tree,
      (node: HtmlNode) =>
        (node.type === 'raw' && node.value.startsWith('<table ')) ||
        (node.type === 'element' && node.tagName === 'table'),
      (node: HtmlNode, relatives: HtmlNode[]) => {
        const ancestor = relatives[relatives.length - 1];

        if (
          ancestor.properties?.className?.includes('bc__table-wrapper') ||
          ancestor.properties?.className?.includes(wrapperClass) // skip wrapped tables
        ) {
          return;
        }

        const wrappedNode = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: wrapperClass,
          },
          children: [
            {
              ...node,
            },
          ],
        };

        Object.assign(node, wrappedNode);
      },
    );
  };
};

export default addTableScroll;
