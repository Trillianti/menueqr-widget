import { expect, test } from '@playwright/test';
import { recoveryLabels } from '../../src/copy.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/harness.html');
  await page.waitForFunction(() => Boolean(window.harness));
});

for (const component of ['button', 'floating', 'tab', 'inline'] as const) {
  test(`${component}: a real frame-ancestors denial shows the exact site and settings destination`, async ({
    page,
  }) => {
    await page.evaluate((component) => {
      window.harness.mountVariant(component, { restaurant: 'blocked' });
      window.harness.open();
    }, component);
    await expect(page.getByRole('heading', { name: 'Website not approved yet' })).toBeVisible();
    await expect(page.locator('.frame-recovery code')).toHaveText(new URL(page.url()).origin);
    const base = await page.evaluate(() => window.harness.options()!.baseUrl);
    await expect(page.getByRole('link', { name: 'Open website settings' })).toHaveAttribute(
      'href',
      `${base}/en/dashboard/settings/profile/?setting=restaurant-website`,
    );
    await expect(page.getByRole('link', { name: 'Open reservation', exact: true })).toHaveAttribute(
      'href',
      `${base}/menu/blocked/reserve/`,
    );
    await expect(page.locator('iframe')).toBeHidden();
    expect(await page.evaluate(() => window.harness.events())).not.toContain('ready');
    if (component !== 'inline') {
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(page.locator('dialog')).toHaveCount(0);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    }
  });
}

for (const component of ['button', 'floating', 'tab', 'inline'] as const) {
  test(`${component}: retry replaces the failed frame and restores keyboard access`, async ({
    page,
  }) => {
    await page.evaluate((component) => {
      window.harness.mountVariant(component, { restaurant: 'unavailable' });
      window.harness.open();
    }, component);
    await expect(page.getByRole('heading', { name: 'Reservation could not load' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open website settings' })).toHaveCount(0);
    const oldFrame = await page.locator('iframe').elementHandle();
    await page.route('**/embed/reservations/unavailable/**', async (route) => {
      await route.fulfill({ path: 'scripts/fixture/preview.html', contentType: 'text/html' });
    });
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
    ).toBeVisible();
    await expect(page.locator('.frame-recovery')).toHaveCount(0);
    await expect(page.locator('iframe')).toBeVisible();
    await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
    expect(await oldFrame!.evaluate((frame) => frame.isConnected)).toBe(false);
    await expect
      .poll(() =>
        page.evaluate(() => window.harness.events().filter((event) => event === 'ready').length),
      )
      .toBe(1);
    if (component === 'inline') {
      await page.locator('#original').evaluate((node) => {
        node.tabIndex = 0;
        node.focus();
      });
    } else await page.locator('dialog').evaluate((dialog) => (dialog as HTMLElement).focus());
    let entered = false;
    for (let index = 0; index < 8 && !entered; index++) {
      await page.keyboard.press('Tab');
      entered = await page.evaluate(() => {
        const host = document.querySelector('[data-menueqr-widget-host]');
        return host?.shadowRoot?.activeElement?.tagName === 'IFRAME';
      });
    }
    expect(entered).toBe(true);
    await page.frameLocator('iframe').getByRole('button', { name: '18:00', exact: true }).click();
    await page
      .frameLocator('iframe')
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Contact details', exact: true }),
    ).toBeVisible();
    if (component !== 'inline') {
      await page.keyboard.press('Escape');
      await expect(page.locator('dialog')).toHaveCount(0);
      await expect(
        page.getByRole('button', {
          name: component === 'button' ? 'Reserve a table' : 'Reserve',
          exact: true,
        }),
      ).toBeFocused();
    }
  });
}

for (const [restaurant, code] of [
  ['blocked', 'origin_not_allowed'],
  ['unavailable', 'unavailable'],
  ['sandbox-bistro', 'timeout'],
] as const) {
  test(`load errors report ${code} exactly once without guest data`, async ({ page }) => {
    if (code === 'timeout') await page.route('**/fixture/preview.js', (route) => route.abort());
    await page.clock.install();
    await page.evaluate(
      (restaurant) => window.harness.mountVariant('inline', { restaurant }),
      restaurant,
    );
    if (code === 'timeout') await page.clock.fastForward(8000);
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.harness.events().filter((event) => event.startsWith('loaderror:')),
        ),
      )
      .toEqual([`loaderror:${code}`]);
    await page.clock.fastForward(20000);
    expect(
      await page.evaluate(() =>
        window.harness.events().filter((event) => event.startsWith('loaderror:')),
      ),
    ).toEqual([`loaderror:${code}`]);
  });
}

test('replacing an error callback preserves the frame and invokes the new callback', async ({
  page,
}) => {
  await page.evaluate(() => window.harness.mountVariant('inline', { restaurant: 'blocked' }));
  const frame = await page.locator('iframe').elementHandle();
  await page.evaluate(() =>
    window.harness.update({
      onLoadError: ({ code }) => {
        document.body.dataset.loadError = code;
      },
    }),
  );
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.loadError))
    .toBe('origin_not_allowed');
  expect(await frame!.evaluate((frame) => frame.isConnected)).toBe(true);
});

test('destroying from a load-error callback cleans up its recovery panel and scroll lock', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => {
    window.harness.mountVariant('floating', {
      restaurant: 'unavailable',
      onLoadError: () => window.harness.destroy(),
    });
    window.harness.open();
  });
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  await expect(page.locator('.frame-recovery')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(errors).toEqual([]);
});

test('custom elements bubble a separate load-error event with only the stable code', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.defineAll();
    const element = document.createElement('menueqr-reservation-inline');
    element.setAttribute('restaurant', 'blocked');
    element.setAttribute('base-url', `http://127.0.0.1:${Number(location.port) + 1}`);
    document.body.addEventListener('menueqr:loaderror', (event) => {
      document.body.dataset.loadError = JSON.stringify((event as CustomEvent).detail);
    });
    document.querySelector('#booking')!.append(element);
  });
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.loadError))
    .toBe('{"code":"origin_not_allowed"}');
});

test('successful initialization makes no diagnostics request', async ({ page }) => {
  const diagnostics: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/reservation-widget/access/')) diagnostics.push(request.url());
  });
  await page.clock.install();
  await page.evaluate(() => window.harness.mountVariant('inline'));
  await expect
    .poll(() => page.evaluate(() => window.harness.events().includes('ready')))
    .toBe(true);
  await page.clock.fastForward(12000);
  expect(diagnostics).toEqual([]);
  await expect(page.locator('.frame-recovery')).toHaveCount(0);
});

for (const component of ['inline', 'tab'] as const) {
  test(`${component}: a late trusted ready message replaces the timeout and leaves the form interactive`, async ({
    page,
  }) => {
    let resume: () => void = () => {};
    const paused = new Promise<void>((resolve) => {
      resume = resolve;
    });
    await page.route('**/fixture/preview.js', async (route) => {
      await paused;
      await route.continue();
    });
    await page.clock.install();
    await page.evaluate((component) => {
      window.harness.mountVariant(component);
      window.harness.open();
    }, component);
    await page.clock.fastForward(8000);
    await expect(page.getByRole('heading', { name: 'Reservation could not load' })).toBeVisible();
    resume();
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
    ).toBeVisible();
    await expect(page.locator('.frame-recovery')).toHaveCount(0);
    await expect(page.locator('iframe')).not.toHaveJSProperty('inert', true);
    await page.frameLocator('iframe').getByRole('button', { name: '18:00', exact: true }).click();
    await page
      .frameLocator('iframe')
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Contact details', exact: true }),
    ).toBeVisible();
  });
}

test('a missing diagnostic endpoint or host connect-src failure never claims permission was denied', async ({
  page,
}) => {
  await page.route('**/api/reservation-widget/access/**', (route) => route.abort());
  await page.clock.install();
  await page.evaluate(() => window.harness.mountVariant('inline', { restaurant: 'blocked' }));
  await page.clock.fastForward(8000);
  await expect(page.getByRole('heading', { name: 'Reservation could not load' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open website settings' })).toHaveCount(0);
});

test('destroy and restaurant changes abort stale diagnostic responses', async ({ page }) => {
  await page.route('**/api/reservation-widget/access/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route
      .fulfill({
        json: { status: 'origin_not_allowed' },
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
      .catch(() => {});
  });
  const request = page.waitForRequest('**/api/reservation-widget/access/**');
  await page.evaluate(() => window.harness.mountVariant('inline', { restaurant: 'blocked' }));
  await request;
  await page.evaluate(() => window.harness.update({ restaurant: 'sandbox-bistro' }));
  await expect
    .poll(() => page.evaluate(() => window.harness.events().includes('ready')))
    .toBe(true);
  await expect(
    page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
  ).toBeVisible();
  await expect(page.locator('.frame-recovery')).toHaveCount(0);
  await page.evaluate(() => window.harness.destroy());
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  await page.unrouteAll({ behavior: 'wait' });
});

test('all supported languages show localized recovery and language-preserving settings links', async ({
  page,
}) => {
  for (const language of ['de', 'en', 'fr', 'it', 'es', 'pt', 'pl', 'uk', 'tr'] as const) {
    await page.evaluate((language) => {
      window.harness.destroy();
      window.harness.mountVariant('inline', { restaurant: 'blocked', language });
    }, language);
    await expect(
      page.getByRole('heading', { name: recoveryLabels[language].blockedTitle, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: recoveryLabels[language].settings, exact: true }),
    ).toHaveAttribute(
      'href',
      new RegExp(
        `${language === 'de' ? '' : '/' + language}/dashboard/settings/profile/\\?setting=restaurant-website$`,
      ),
    );
  }
});
