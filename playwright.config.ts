import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT || 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  timeout: 30 * 1000,
  testDir: path.join(__dirname, 'e2e'),
  retries: 0,
  outputDir: 'test-results/',
  webServer: {
    // ✅ Set env var before starting Next.js
    command: `E2E_TEST=true npm run dev`,
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL,
    trace: 'retry-with-trace',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
