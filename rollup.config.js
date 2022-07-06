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
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    json(),
  ]
};
