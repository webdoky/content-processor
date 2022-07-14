import { visit } from 'unist-util-visit';
import lodash from 'lodash';
import { HtmlNode } from '../interfaces';
import { BrokenNavLink } from '../../../components/index';

interface Options {
  existingLinks?: string[];
}

const UK_LOCALE_LINK_START = '/uk/';
const US_LOCALE_LINK_START = '/en-US/';

const dropHash = (url: string) => url.split('#')[0];
const dropLocale = (url: string) => {
  if (url.startsWith(UK_LOCALE_LINK_START)) {
    return url.slice(UK_LOCALE_LINK_START.length - 1);
  }

  if (url.startsWith(US_LOCALE_LINK_START)) {
    return url.slice(US_LOCALE_LINK_START.length - 1);
  }

  return url;
};

/**
 * Plugin to automatically add `target` and `rel` attributes to external links.
 *
 */
const checkLinksToMissingTranslations = (options: Options = {}) => {
  const { existingLinks = [] } = options;

  const uniqExistingLinks = lodash.uniq(
    existingLinks.map(dropHash).map(dropLocale),
  );

  return (tree) => {
    visit(tree, 'element', (node: HtmlNode) => {
      if (
        node.tagName === 'a' &&
        node.properties &&
        typeof node.properties.href === 'string'
      ) {
        const url = node.properties.href;
        if (
          url.startsWith('#') || // omit local anchors
          url.startsWith('https://') || // omit external links
          url.startsWith('http://')
        ) {
          return;
        }

        const normalizedUrl = dropLocale(dropHash(url));

        if (!uniqExistingLinks.includes(normalizedUrl)) {
          if (!node.properties.className) {
            node.properties.className = [];
          }
          for (const cls of (BrokenNavLink.className || '').split(' ')) {
            node.properties.className.push(cls);
          }

          node.properties.title = BrokenNavLink.title;
        }
      }
    });
  };
};

export default checkLinksToMissingTranslations;
