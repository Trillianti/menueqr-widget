import { defineConfig } from '@playwright/test';
const port = Number(process.env.WIDGET_PLAYGROUND_PORT ?? 4320);
export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: `http://127.0.0.1:${port}/harness.html`,
    reuseExistingServer: false,
    timeout: 30000,
    env: { WIDGET_PLAYGROUND_PORT: String(port), WIDGET_FIXTURE_PORT: String(port + 1) },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'firefox', use: { browserName: 'firefox', viewport: { width: 1280, height: 800 } } },
    { name: 'webkit', use: { browserName: 'webkit', viewport: { width: 1280, height: 800 } } },
    {
      name: 'mobile-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
