import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3200);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './e2e',
  testMatch: 'svelte.spec.ts',
  workers: 1,
  timeout: 30000,
  outputDir: 'test-results/svelte',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'Chrome', use: devices['Desktop Chrome'] }],
  webServer: {
    command: `E2E_TEST=true npm run build && PORT=${port} HOST=127.0.0.1 E2E_TEST=true npm run start`,
    url: baseURL,
    timeout: 180000,
    reuseExistingServer: false,
  },
});
