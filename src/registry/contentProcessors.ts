import rehypePrism from 'rehype-prism';
import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeParse from 'rehype-parse';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

import externalLinks from './utils/plugins/external-links';
import htmlSlugify from './utils/plugins/html-slugify copy';
import checkLinksToMissingTranslations from './utils/plugins/missing-translations';
import addTableScroll from './utils/plugins/table-scroll';
import cleanupCodeSamples from './utils/plugins/cleanup-code-samples';
import { list } from './mdast/list';
import { code } from './mdast/code';
import rewriteRedirects from './utils/plugins/rewrite-redirects';

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
  redirectMap: Record<string, string>;
}

export const createHtmlPostProcessor = (options: HtmlPostProcessorOptions) => {
  return createHtmlParser()
    .use([[rewriteRedirects, options]])
    .use([[checkLinksToMissingTranslations, options]])
    .use(rehypeStringify, { allowDangerousHtml: true });
};

export const mdParseAndProcess = unified()
  .use(remarkParse)
  .use([remarkGfm, cleanupCodeSamples])
  .use(remarkRehype, {
    handlers: {
      list,
      code,
    },
    allowDangerousHtml: true,
  })
  .use([
    htmlSlugify,
    [
      rehypeAutolinkHeadings,
      {
        behavior: 'append',
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
