import { visit } from 'unist-util-visit';
import { HtmlNode } from './interfaces';
import getNodeContent from './getNodeContent';

const extractDescription = (ast) => {
  let description = '';

  visit(
    ast,
    (node: HtmlNode) => {
      return !description && node.tagName === 'p';
    },
    (node) => {
      const nodeText = getNodeContent(node);
      if (!nodeText.startsWith('{{')) {
        // Omit macros
        description = nodeText;
      }
    },
  );

  return description;
};

export default extractDescription;
