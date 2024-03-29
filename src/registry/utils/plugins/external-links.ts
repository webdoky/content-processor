import { visit } from 'unist-util-visit';
import { parse } from 'space-separated-tokens';
import isAbsoluteUrl from 'is-absolute-url';
import { extend } from 'lodash-es';

const defaultTarget = '_blank';
const defaultRel = ['nofollow', 'noopener', 'noreferrer'];
const defaultProtocols = ['http', 'https'];

interface Options {
  target?: string | boolean;
  rel?: string | string[] | boolean;
  className?: string;
  protocols?: string | string[];
  content?: unknown;
  contentProperties?: unknown;
}

/**
 * Plugin to automatically add `target` and `rel` attributes to external links.
 *
 */
const externalLinks = (options: Options = {}) => {
  const target = options.target;
  const rel =
    typeof options.rel === 'string' ? parse(options.rel) : options.rel;
  const protocols = options.protocols || defaultProtocols;
  const content =
    options.content && !Array.isArray(options.content)
      ? [options.content]
      : options.content;
  const contentProperties = options.contentProperties || {};
  const className = options.className;

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (
        node.tagName === 'a' &&
        node.properties &&
        typeof node.properties.href === 'string'
      ) {
        const url = node.properties.href;
        const protocol = url.slice(0, url.indexOf(':'));

        if (isAbsoluteUrl(url) && protocols.includes(protocol)) {
          if (target !== false) {
            node.properties.target = target || defaultTarget;
          }

          if (className) {
            node.properties.className =
              (node.properties.className
                ? `${node.properties.className} `
                : '') + className;
          }

          if (rel !== false) {
            node.properties.rel = (rel || defaultRel).toString().concat();
          }

          if (content) {
            node.children.push({
              type: 'element',
              tagName: 'span',
              properties: extend(true, contentProperties),
              children: extend(true, content),
            });
          }
        }
      }
    });
  };
};

export default externalLinks;
