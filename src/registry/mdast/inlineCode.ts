import { u } from 'unist-builder';

/**
 * @type {Handler}
 * @param {InlineCode} node
 */
export function inlineCode(h, node) {
  // Some inline code nodes contain legit reference links
  //
  // By using the "raw" node type we make sure they won't be escaped
  return h(node, 'code', [u('raw', node.value.replace(/\r?\n|\r/g, ' '))]);
}
