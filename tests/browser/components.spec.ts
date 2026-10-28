import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/harness.html');
  await page.waitForFunction(() => Boolean(window.harness));
});
test('four separate JS components share lifecycle rules but cannot change presentation through options', async ({
  page,
}) => {
  for (const component of ['button', 'floating', 'tab', 'inline'] as const) {
    await page.evaluate((component) => {
      window.harness.mountVariant(component, {
        restaurant: 'https://www.menueqr.de/menu/component-test/',
      });
      window.harness.open();
    }, component);
    await expect(page.locator('iframe')).toHaveAttribute('src', /\/component-test\//);
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => {
        try {
          window.harness.update({ mode: undefined } as never);
          return false;
        } catch {
          return true;
        }
      }),
    ).toBe(true);
    const rejected = await page.evaluate((component) => {
      try {
        window.harness.mountVariant(component === 'inline' ? 'button' : 'inline');
        return false;
      } catch {
        return true;
      }
    }, component);
    expect(rejected).toBe(true);
    await page.evaluate(() => window.harness.destroy());
    await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  }
});
test('four distinct custom elements register independently and ignore a mode attribute', async ({
  page,
}) => {
  await page.evaluate(() => window.harness.defineAll());
  for (const component of ['button', 'floating', 'tab', 'inline']) {
    await page.evaluate((component) => {
      const element = document.createElement(`menueqr-reservation-${component}`);
      element.id = 'component-element';
      element.setAttribute('restaurant', 'https://www.menueqr.de/menu/element-test/');
      element.setAttribute('language', 'en');
      element.setAttribute('mode', 'evil');
      element.setAttribute('base-url', `http://127.0.0.1:${Number(location.port) + 1}`);
      document.querySelector('#booking')!.append(element);
    }, component);
    if (component !== 'inline')
      await page
        .getByRole('button', {
          name: component === 'button' ? 'Reserve a table' : 'Reserve',
          exact: true,
        })
        .click();
    await expect(page.locator('iframe')).toHaveAttribute('src', /\/element-test\//);
    await page.evaluate(() => document.querySelector('#component-element')!.remove());
    await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  }
});
test('React components clean up on replacement and update the restaurant prop without duplicates', async ({
  page,
}) => {
  await page.goto('/frameworks.html');
  for (const component of ['button', 'floating', 'tab', 'inline']) {
    await page.selectOption('#react-component', component);
    await expect(page.locator('[data-framework=react] [data-menueqr-widget-host]')).toHaveCount(
      component === 'floating' || component === 'tab' ? 0 : 1,
    );
    if (component !== 'inline')
      await page
        .getByRole('button', {
          name: component === 'button' ? 'Reserve a table' : 'Reserve',
          exact: true,
        })
        .first()
        .click();
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
    ).toBeVisible();
    // A navigation/prop change can occur while an overlay is open.
    await page.locator('#update-react').evaluate((button: HTMLButtonElement) => button.click());
    if (component !== 'inline') {
      await expect(page.locator('dialog')).toHaveCount(0);
      await page
        .getByRole('button', {
          name: component === 'button' ? 'Reserve a table' : 'Reserve',
          exact: true,
        })
        .first()
        .click();
    }
    await expect(page.locator('iframe')).toHaveAttribute('src', /\/react-updated\//);
    if (component !== 'inline') await page.keyboard.press('Escape');
  }
  await page.locator('#remove-react').click();
  await expect(page.locator('iframe')).toHaveCount(0);
});
test('playground accepts menu links, generates separate imports and opts in to live preview explicitly', async ({
  page,
}) => {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') writes.push(request.url());
  });
  await page.route('https://www.menueqr.de/embed/**', (route) =>
    route.fulfill({ status: 404, body: 'Unavailable test fixture' }),
  );
  await page.goto('/');
  await page.selectOption('#integration', 'api');
  await page
    .getByLabel('Restaurant link or slug')
    .fill('https://www.menueqr.de/menu/my-bistro/items/?lang=de');
  await page.selectOption('#component', 'floating');
  await expect(page.locator('#code')).toContainText('mountReservationFloating');
  await expect(page.locator('#code')).toContainText('from "@menueqr/widget";');
  await expect(page.locator('#code')).toContainText('"restaurant": "my-bistro"');
  await expect(page.locator('#code')).not.toContainText('"mode"');
  if (process.env.WIDGET_CAPTURE_DOCS === '1' && test.info().project.name === 'chromium') {
    await page.screenshot({
      path: 'docs/screenshots/playground.jpg',
      type: 'jpeg',
      quality: 85,
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', /127\.0\.0\.1.*\/my-bistro\//);
  if (process.env.WIDGET_CAPTURE_DOCS === '1' && test.info().project.name === 'chromium') {
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
    ).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/modal.jpg', type: 'jpeg', quality: 85 });
  }
  await page.keyboard.press('Escape');
  await page.selectOption('#integration', 'element');
  await expect(page.locator('#code')).toContainText('<menueqr-reservation-floating');
  await page.getByLabel('Preview this restaurant live').check();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    /^https:\/\/www\.menueqr\.de\/embed\/reservations\/my-bistro\//,
  );
  await page.keyboard.press('Escape');
  await page.getByLabel('Restaurant link or slug').fill('https://evil.example/menu/bistro/');
  await page.getByLabel('Restaurant link or slug').press('Tab');
  await expect(page.getByRole('alert')).toContainText('MenüQR menu link');
  await expect(page.getByRole('button', { name: 'Copy code', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open', exact: true })).toBeDisabled();
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  expect(writes).toEqual([]);
});
