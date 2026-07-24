import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@t': resolve(__dirname, 'types'),
    },
  },
  test: {
    globals: true,
    include: ['src/**/__test__/**/*.spec.ts'],
  },
});
