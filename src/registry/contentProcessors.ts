import rehypePrism from 'rehype-prism';
import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeParse from 'rehype-parse';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

import yariPorts from '@webdoky/yari-ports';
import { list as defaultListHandler } from 'mdast-util-to-hast/lib/handlers/list';
import externalLinks from './utils/plugins/external-links';
import htmlSlugify from './utils/plugins/html-slugify copy';
import checkLinksToMissingTranslations from './utils/plugins/missing-translations';
import addTableScroll from './utils/plugins/table-scroll';
import cleanupCodeSamples from './utils/plugins/cleanup-code-samples';

const { markdown: yariMarkdownUtils } = yariPorts;
// https://github.com/mdn/yari/blob/b0dbaed4bc4135b51217400f750179b4a3bebc28/markdown/m2h/handlers/dl.js
const { isDefinitionList, asDefinitionList } = yariMarkdownUtils;

export function createHtmlParser() {
  return unified().use(rehypeParse, { fragment: true });
}

export const htmlParseAndProcess = createHtmlParser()
  .use(rehypeAutolinkHeadings) // Wrap headings in links, so they became inteactive
  .use(externalLinks, {
    target: '_blank',
    rel: ['noopener', 'noreferrer'],
    className: 'wd-external',
  });

interface HtmlPostProcessorOptions {
  existingLinks: string[];
}

export const createHtmlPostProcessor = (options: HtmlPostProcessorOptions) => {
  return createHtmlParser()
    .use([[checkLinksToMissingTranslations, options]])
    .use(rehypeStringify, { allowDangerousHtml: true });
};

export const mdParseAndProcess = unified()
  .use(remarkParse)
  .use([remarkGfm, cleanupCodeSamples])
  .use(remarkRehype, {
    handlers: {
      list(h, node) {
        if (isDefinitionList(node)) {
          return asDefinitionList(h, node);
        }

        return defaultListHandler(h, node);
      },
    },
    allowDangerousHtml: true,
  })
  .use([
    htmlSlugify,
    [
      rehypeAutolinkHeadings,
      {
        content: {
          type: 'element',
          tagName: 'span',
          properties: {
            className: 'icon icon-link',
          },
        },
        linkProperties: {
          'aria-hidden': 'true',
        },
      },
    ],
    [
      externalLinks,
      {
        target: '_blank',
        rel: ['noopener', 'noreferrer'],
        className: 'wd-external',
      },
    ],
  ]);

export const mdToRehype = unified()
  .use(remarkRehype, {
    handlers: {
      list(h, node) {
        if (isDefinitionList(node)) {
          return asDefinitionList(h, node);
        }

        return defaultListHandler(h, node);
      },
    },
    allowDangerousHtml: true,
  })
  .use(rehypeRaw);

export const htmlProcess = unified()
  .use([rehypePrism, addTableScroll])
  // TODO:
  // [
  //   remarkAutolinkHeadings,
  //   {
  //     content: {
  //       type: 'element',
  //       tagName: 'span',
  //       properties: {
  //         className: 'icon icon-link',
  //       },
  //     },
  //     linkProperties: {
  //       'aria-hidden': 'true',
  //     },
  //   },
  // ],
  .use(rehypeStringify, { allowDangerousHtml: true });
