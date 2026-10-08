import { defineConfig } from 'vitest/config';
export default defineConfig({
  resolve: { alias: { '$env/dynamic/private': '/Users/umbertobarros/Projects/maitu/src/lib/test-private-env.ts' } },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/lib/**/*.test.ts', 'src/routes/**/*.test.ts'],
  },
});
