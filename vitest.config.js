import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/js/**/*.js'],
      reporter: ['text', 'html'],
    },
  },
});
