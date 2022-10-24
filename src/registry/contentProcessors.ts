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
import { codes } from 'micromark-util-symbol/codes.js';
import { list } from './mdast/list';
import { code } from './mdast/code';

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

const macrosConstruct = { name: 'kumaMacro', tokenize: macroTokenize };

const macros = { text: { [codes.leftCurlyBrace]: macrosConstruct } };

function macroTokenize(effects, ok, nok) {
  let length = 0;
  let rightBracesCount = 0;
  return start;

  function start(code) {
    effects.enter('kumaMacro', { meta: 'macro' });
    effects.enter('kumaMacroMarker');
    return inside(code);
  }

  function inside(code) {
    length++;
    if (code === -5 || code === -4 || code === -3 || code === null) {
      return nok(code);
    }

    if (rightBracesCount === 2) {
      effects.exit('kumaMacroMarker');
      effects.exit('kumaMacro', { meta: 'macro' });
      console.log('finished macro with size', length);
      return ok(code);
    }

    if (length === 2) {
      if (code === codes.leftCurlyBrace) {
        effects.exit('kumaMacroMarker');
        effects.enter('kumaMacroBody');
      } else {
        return nok(code);
      }
    }

    if (code === codes.rightCurlyBrace) {
      rightBracesCount++;
      effects.exit('kumaMacroBody');
      effects.enter('kumaMacroMarker');
    } else {
      rightBracesCount = 0;
    }

    effects.consume(code);
    return inside;
  }
}

export const mdParseAndProcess = unified()
  // .use(remarkParse)
  .data('micromarkExtensions', [macros])
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
