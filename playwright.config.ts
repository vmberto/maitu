import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  timeout: 30000,
  testDir: path.join(__dirname, 'e2e'),
  workers: 1,
  retries: 0,
  outputDir: 'test-results/',
  webServer: {
    command: 'npm run build && E2E_TEST=true npm run start',
    url: 'http://localhost:3000',
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } }],
});
