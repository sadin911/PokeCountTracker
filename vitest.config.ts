import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Store tests touch localStorage, so they need a DOM-ish environment.
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
