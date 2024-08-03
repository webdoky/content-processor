import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { importAssertionsPlugin } from 'rollup-plugin-import-assert';
import { importAssertions } from 'acorn-import-assertions';

export default {
  input: './build/src/main.js',
  output: {
    dir: 'dist',
    format: 'es',
  },
  acornInjectPlugins: [importAssertions],
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
      preferBuiltins: true,
    }),
    commonjs({
      include: ['node_modules/**', '../yari-ports/**'],
    }),
    json(),
    importAssertionsPlugin(),
  ],
  external: [
    'mdast-util-to-hast',
    'glob',
    'gray-matter',
    'unified',
    'rehype-prism',
    'rehype-parse',
    'rehype-autolink-headings',
    'rehype-raw',
    'lodash',
    'github-slugger',
    'cyrillic-to-translit-js',
    'rimraf',
    "mdast-util-to-string",
    "prism-themes",
    "rehype-external-links",
    "rehype-stringify",
    "remark-gfm",
    "remark-parse",
    "remark-rehype",
    "unist-util-visit",
    "unist-util-visit-parents",
    "sanitize-filename",
    'resolve-package-path',
  ],
};
