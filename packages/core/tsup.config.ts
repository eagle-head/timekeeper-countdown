import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    format: 'src/format/index.ts',
    'testing-utils': 'testing-utils/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: true,
  splitting: false,
  treeshake: true,
  target: 'es2022',
  esbuildOptions(options) {
    options.mangleProps = /^_/;
    options.drop = ['console', 'debugger'];
  },
});
