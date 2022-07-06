import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: './build/src/main.js',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
      preferBuiltins: true,
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    json(),
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
  ],
};
