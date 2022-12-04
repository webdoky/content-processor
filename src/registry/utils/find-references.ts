import { visit } from 'unist-util-visit';
import { HtmlNode } from './interfaces';

const findReferences = (ast) => {
  const references = [];

  visit(
    ast,
    (node: HtmlNode) => node.tagName === 'a',
    (node) => {
      if (node.properties && node.properties.href) {
        references.push(node.properties.href);
      }
    },
  );

  return references;
};

export default findReferences;
