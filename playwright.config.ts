import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  timeout: 30000,
  testDir: path.join(__dirname, 'e2e'),
  workers: 1,
  retries: 0,
  outputDir: 'test-results/',
  webServer: {
    command: `npm run build && E2E_TEST=true npm run start -- --port ${port}`,
    url: baseURL,
    timeout: 180000,
    reuseExistingServer: false,
  },
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } }],
});
