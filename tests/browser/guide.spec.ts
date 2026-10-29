import { expect, test } from '@playwright/test';
declare global {
  interface Window {
    __widgetGuideClipboard: string[];
  }
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__widgetGuideClipboard = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          window.__widgetGuideClipboard.push(value);
        },
      },
    });
  });
  await page.goto('/');
});
test('React live toggle removes the local fixture baseUrl without requiring Remount', async ({
  page,
}) => {
  // Intercept production navigation; the test never contacts a live restaurant.
  await page.route('https://www.menueqr.de/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Hosted fixture</title>',
    }),
  );
  await page.getByLabel('Component', { exact: true }).selectOption('inline');
  await expect(page.locator('iframe')).toHaveAttribute('src', /127\.0\.0\.1/);
  await page.getByLabel('Restaurant link or slug', { exact: true }).fill('demo');
  await page.getByLabel('Preview this restaurant live', { exact: true }).check();
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    /^https:\/\/www\.menueqr\.de\/embed\/reservations\/demo\//,
  );
  await page.getByLabel('Preview this restaurant live', { exact: true }).uncheck();
  await expect(page.locator('iframe')).toHaveAttribute('src', /http:\/\/127\.0\.0\.1/);
});
test('React onboarding renders all four real components, preserves Next preview and cleans up', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await expect(page.locator('#integration')).toHaveValue('react');
  await expect(page.locator('#guide-title')).toHaveText('Add it to your React layout');
  await expect(page.locator('#code')).toContainText('ReservationButton');
  await expect(page.locator('#code')).not.toContainText('mountReservation');
  await expect(page.locator('#open')).toBeHidden();
  await page.getByRole('link', { name: 'Get integration code' }).click();
  await expect(page.locator('#guide-title')).toBeInViewport();
  for (const component of ['button', 'floating', 'tab', 'inline']) {
    await page.selectOption('#component', component);
    if (component !== 'inline')
      await page
        .getByRole('button', {
          name: component === 'button' ? 'Reserve a table' : 'Reserve',
          exact: true,
        })
        .click();
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
    ).toBeVisible();
    if (component !== 'inline') await page.keyboard.press('Escape');
  }
  const oldFrame = await page.locator('iframe').elementHandle();
  await page.selectOption('#integration', 'next');
  await expect(page.locator('#code-language')).toContainText('app/layout.tsx');
  await expect(page.locator('#code')).toContainText('<html lang="en">');
  await expect(page.locator('#code')).toContainText('{children}');
  expect(await oldFrame!.evaluate((frame) => frame.isConnected)).toBe(true);
  await page.selectOption('#code-syntax', 'javascript');
  await expect(page.locator('#code-language')).toContainText('app/layout.jsx');
  await expect(page.locator('#code')).not.toContainText('ReactNode');
  expect(await oldFrame!.evaluate((frame) => frame.isConnected)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Destroy', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Remount', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('install, JSX and AI copy actions use the selected framework and normalized restaurant', async ({
  page,
}) => {
  await page
    .getByLabel('Restaurant link or slug')
    .fill('https://www.menueqr.de/menu/my-cafe/items/?lang=de');
  await page.selectOption('#component', 'floating');
  await page.selectOption('#integration', 'next');
  await expect(page.locator('#code')).toContainText('restaurant="my-cafe"');
  await page.getByRole('button', { name: 'Copy install command' }).click();
  const install = await page.evaluate(() => window.__widgetGuideClipboard.slice(-1)[0]);
  expect(install).toContain(
    'npm install https://github.com/Trillianti/menueqr-widget/releases/download/',
  );
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  const code = await page.evaluate(() => window.__widgetGuideClipboard.slice(-1)[0]);
  expect(code).toContain('RootLayout');
  expect(code).toContain('ReservationFloating');
  expect(code).not.toContain('mountReservation');
  await page.getByRole('button', { name: 'Copy AI prompt' }).click();
  const prompt = await page.evaluate(() => window.__widgetGuideClipboard.slice(-1)[0]);
  expect(prompt).toContain('Next.js App Router');
  expect(prompt).toContain('restaurant="my-cafe"');
  expect(prompt).not.toContain('127.0.0.1');
  await expect(page.locator('#copy-state')).toHaveText('Copied.');
  if (process.env.WIDGET_CAPTURE_GUIDE === '1' && test.info().project.name === 'chromium') {
    await page
      .locator('section.guide-step')
      .nth(1)
      .screenshot({ path: 'docs/screenshots/react-guide.jpg', type: 'jpeg', quality: 85 });
  }
});
test('JavaScript and Web Component instructions provide separate copyable files', async ({
  page,
}) => {
  await page.selectOption('#integration', 'api');
  await expect(page.locator('#support-code')).toHaveText('<div id="booking"></div>');
  await expect(page.locator('#code')).toContainText('from "@menueqr/widget";');
  await page.selectOption('#integration', 'element');
  await expect(page.locator('#support-code')).toContainText('defineReservationButtonElement');
  await expect(page.locator('#support-code')).not.toContainText('<menueqr-');
  await expect(page.locator('#code')).toContainText('<menueqr-reservation-button');
  await expect(page.locator('#code')).not.toContainText('import ');
  await page.getByRole('button', { name: 'Copy registration' }).click();
  expect(await page.evaluate(() => window.__widgetGuideClipboard.slice(-1)[0])).toContain(
    'defineReservationButtonElement',
  );
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  expect(await page.evaluate(() => window.__widgetGuideClipboard.slice(-1)[0])).toContain(
    '<menueqr-reservation-button',
  );
});
