/**
 * Playwright Configuration for Electron E2E Tests
 */

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  workers: 1, // Electron テストは並列実行しない

  use: {
    headless: false,
    viewport: { width: 1200, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'electron',
      testMatch: /.*\.e2e\.test\.js$/,
    },
  ],

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],

  outputDir: 'test-results/',
});
