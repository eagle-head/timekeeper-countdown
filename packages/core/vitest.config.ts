import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/.stryker-tmp/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'examples/',
        'e2e/',
        '**/*.d.ts',
        'src/index.ts',
        'src/format/index.ts',
        'testing-utils/index.ts',
      ],
    },
  },
});
