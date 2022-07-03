import { visit } from 'unist-util-visit';
import { HtmlNode } from './interfaces';

const levels = {
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

const findHeadings = (ast) => {
  const headings = [];

  visit(
    ast,
    (node: HtmlNode) => ['h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName),
    (node) => {
      const heading = {
        depth: levels[node.tagName] || 1,
        value: '',
        anchor: '',
      };
      const children = node.children || [];

      for (let i = 0, l = children.length; i < l; i++) {
        const el = children[i];

        if (el.tagName === 'a') {
          heading.anchor = el.properties.href;
        } else if (el.value) {
          heading.value += el.value;
        }
      }

      headings.push(heading);
    },
  );

  return headings;
};

export default findHeadings;
