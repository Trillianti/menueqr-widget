import { expect, test } from '@playwright/test';

test('a strict CSP nonce permits isolated styles and CSSOM positioning without unsafe-inline', async ({
  page,
}) => {
  const nonce = 'menueqr-local-csp-test';
  // Serve real response headers; interception changes Chromium's local address-space checks.
  await page.goto('/harness.html?csp=strict');
  await page.waitForFunction(() => Boolean(window.harness));
  await page.evaluate((nonce) => {
    document.addEventListener('securitypolicyviolation', (event) => {
      document.body.dataset.cspViolation = event.effectiveDirective;
    });
    window.harness.mountVariant('floating', { nonce, offsetX: 0, color: '#aa3300' });
    window.harness.open();
  }, nonce);
  await expect(
    page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
  ).toBeVisible();
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
  expect(
    await page
      .locator('[data-menueqr-widget-host]')
      .evaluate((host) => host.shadowRoot!.querySelector('style')!.nonce),
  ).toBe(nonce);
  expect(
    await page.locator('.trigger').evaluate((button) => getComputedStyle(button).backgroundColor),
  ).toBe('rgb(170, 51, 0)');
  expect(await page.evaluate(() => document.body.dataset.cspViolation)).toBeUndefined();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
});
