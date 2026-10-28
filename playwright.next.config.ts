import { defineConfig } from '@playwright/test';
const url = new URL(process.env.NEXT_WIDGET_QA_URL ?? 'http://127.0.0.1:4340');
if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
  throw Error('Next.js QA must use a task-local loopback server.');
export default defineConfig({
  testDir: 'tests/next',
  outputDir: 'test-results-next',
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  use: { baseURL: url.origin, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'next-chromium',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'next-mobile-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
