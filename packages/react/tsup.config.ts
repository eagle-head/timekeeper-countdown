import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: true,
  splitting: false,
  treeshake: true,
  target: 'es2022',
})
