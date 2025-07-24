import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true, // Enable minification for production
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    }
  },
  esbuildOptions(options) {
    options.banner = {
      js: '// timekeeper-countdown v2.0.0 - Framework-agnostic countdown timer',
    }
  },
})
