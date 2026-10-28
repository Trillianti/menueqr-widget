import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  // Fulfil every hosted-service request locally; this QA never contacts MenüQR.
  await page.route('https://www.menueqr.de/**', (route) => {
    const parentOrigin = new URL(route.request().url()).searchParams.get('parentOrigin');
    return route.fulfill({
      contentType: 'text/html',
      body: `<html><body><h1>Reservation QA fixture</h1><script>parent.postMessage({type:'menueqr:reservation:ready'},${JSON.stringify(parentOrigin)})</script></body></html>`,
    });
  });
});
test('copied Next.js layout keeps server metadata and one widget across navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('Next widget QA');
  await expect(page.getByRole('heading', { name: 'Next widget QA' })).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Reserve', exact: true });
  await expect(trigger).toBeVisible();
  const original = await trigger.elementHandle();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About QA' })).toBeVisible();
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(1);
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Next widget QA' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('installed package hydrates, opens, restores focus and survives page refresh', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Reserve', exact: true });
  await trigger.click();
  await expect(
    page.frameLocator('iframe').getByRole('heading', { name: 'Reservation QA fixture' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.reload();
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(1);
  await trigger.click();
  await expect(page.locator('iframe')).toHaveAttribute('src', /\/next-widget-qa\//);
});
