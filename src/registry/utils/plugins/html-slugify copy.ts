'use strict';

import { toString } from 'mdast-util-to-string';
import slugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import cyrillicToTranslit from 'cyrillic-to-translit-js';
import { HtmlNode } from '../interfaces';
import getNodeContent from '../getNodeContent';

const slugs = slugger();

const transformer = (ast) => {
  slugs.reset();
  const documentIds = {};

  // Process headers
  visit(
    ast,
    (node: HtmlNode) => ['h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName),
    function (node) {
      let nodeContent = toString(node);
      if (/[а-яА-ЯіїІЇ]/.test(nodeContent)) {
        nodeContent = cyrillicToTranslit({ preset: 'uk' }).transform(
          nodeContent,
        );
      }
      let anchorValue = slugs.slug(nodeContent);

      if (documentIds[anchorValue]) {
        let index = 1;
        while (documentIds[`${anchorValue}-${index}`]) {
          index += 1;
        }
        anchorValue = `${anchorValue}-${index}`;
      }

      node.properties.id = anchorValue;
    },
  );

  // Process definition lists

  visit(
    ast,
    (node: HtmlNode) => node.tagName === 'dt',
    function (node) {
      let nodeContent = getNodeContent(node);
      if (/[а-яА-ЯіїІЇ]/.test(nodeContent)) {
        nodeContent = cyrillicToTranslit({ preset: 'uk' }).transform(
          nodeContent,
        );
      }
      let anchorValue = slugs.slug(nodeContent);

      if (documentIds[anchorValue]) {
        let index = 1;
        while (documentIds[`${anchorValue}-${index}`]) {
          index += 1;
        }
        anchorValue = `${anchorValue}-${index}`;
      }

      node.properties.id = anchorValue;
    },
  );
};

const htmlSlugify = () => {
  return transformer;
};

export default htmlSlugify;
