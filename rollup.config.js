import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: './build/src/main.js',
  output: {
      dir: 'dist',
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
  external: ['mdast-util-to-hast', 'glob', 'gray-matter'],
};
