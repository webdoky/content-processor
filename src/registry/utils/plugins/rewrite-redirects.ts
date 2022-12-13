import { visit } from 'unist-util-visit';
import { HtmlNode } from '../interfaces';

interface Options {
  redirectMap?: Record<string, string>;
}

const rewriteRedirects = (options: Options) => {
  const { redirectMap = {} } = options;

  const references = Object.keys(redirectMap);

  return (tree) => {
    visit(
      tree,
      (node: HtmlNode) => !!(node.tagName === 'a' && node.properties?.href),
      (node: HtmlNode) => {
        const href = node.properties.href;
        const [path, hash] = href.split('#');

        if (references.length && path && redirectMap[path]) {
          node.properties.href = `${redirectMap[path]}${
            hash ? `#${hash}` : ''
          }`;
        }
      },
    );
  };
};

export default rewriteRedirects;
