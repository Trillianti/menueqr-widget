import { expect, test } from '@playwright/test';
import type { ReservationWidgetOptions } from '../../src/types.js';
test.beforeEach(async ({ page }) => {
  await page.goto('/harness.html');
  await page.waitForFunction(() => Boolean(window.harness));
});
test('four layouts load the real cross-origin fixture, close and restore focus', async ({
  page,
}) => {
  for (const mode of ['button', 'floating', 'tab', 'inline'] as const) {
    await page.evaluate((mode) => window.harness.mount({ mode }), mode);
    if (mode !== 'inline')
      await page
        .getByRole('button', {
          name: mode === 'button' ? 'Reserve a table' : 'Reserve',
          exact: true,
        })
        .click();
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(
      page.frameLocator('iframe').getByRole('heading', { name: 'Reserve a table' }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.harness.events().filter((e) => e === 'ready').length))
      .toBeGreaterThan(0);
    if (mode !== 'inline') {
      await page.frameLocator('iframe').getByRole('button', { name: 'Close preview' }).click();
      await expect(page.locator('dialog')).toHaveCount(0);
      await expect(
        page.getByRole('button', {
          name: mode === 'button' ? 'Reserve a table' : 'Reserve',
          exact: true,
        }),
      ).toBeFocused();
    }
    await page.evaluate(() => window.harness.destroy());
    await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  }
});
test('mount deduplication, invalid updates and callback updates do not replace a live frame', async ({
  page,
}) => {
  await page.evaluate(() => window.harness.mount({ mode: 'inline' }));
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  expect(await page.evaluate(() => window.harness.mountAgain({ mode: 'inline' }))).toBe(true);
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(1);
  const stable = await page.locator('iframe').evaluate((frame) => {
    let rejected = false;
    try {
      window.harness.update({ restaurant: '../invalid' });
    } catch {
      rejected = true;
    }
    window.harness.update({ onReady: () => undefined });
    return rejected && frame.isConnected;
  });
  expect(stable).toBe(true);
  await expect(page.locator('#original')).toHaveText('Existing website content');
  await page.evaluate(() => {
    window.harness.destroy();
    window.harness.destroy();
  });
  await expect(page.locator('iframe')).toHaveCount(0);
});
test('message validation rejects wrong origin, wrong source and duplicate ready events', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mount();
    window.harness.open();
  });
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.harness.events().filter((e) => e === 'ready').length))
    .toBe(1);
  await page.evaluate(() => {
    const expected = window.harness.options()!.baseUrl;
    window.harness.send('menueqr:reservation:close', 'https://evil.example', 'frame');
    window.harness.send('menueqr:reservation:close', expected, 'self');
    window.harness.send('menueqr:reservation:ready', expected, 'frame');
  });
  await expect(page.locator('dialog')).toBeVisible();
  expect(
    await page.evaluate(() => window.harness.events().filter((e) => e === 'ready').length),
  ).toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reserve a table', exact: true })).toBeFocused();
});
test('closing one of two instances preserves the other scroll lock', async ({ page }) => {
  await page.evaluate(() => {
    document.body.style.overflow = 'clip';
    window.harness.mount();
    window.harness.open();
    window.harness.second();
  });
  await expect(page.locator('dialog')).toHaveCount(2);
  await page.evaluate(() => window.harness.close());
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.evaluate(() => window.harness.closeSecond());
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
});

test('destroying during an update callback does not resurrect the widget', async ({ page }) => {
  await page.evaluate(() => {
    window.harness.mount({ onClose: () => window.harness.destroy() });
    window.harness.open();
    window.harness.update({ language: 'fr' });
  });
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});
test('hidden mobile inline widgets defer navigation and respond to viewport changes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.harness.mount({ mode: 'inline', mobile: false }));
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect(page.locator('iframe')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('iframe')).toHaveCount(0);
});
test('mobile overlays fill the viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const mode of ['button', 'floating', 'tab'] as const) {
    await page.evaluate((mode) => {
      window.harness.mount({ mode });
      window.harness.open();
    }, mode);
    const box = await page.locator('dialog').boundingBox();
    expect(box?.x).toBeCloseTo(0);
    expect(box?.width).toBeCloseTo(390);
    expect(box?.height).toBeCloseTo(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() => window.harness.destroy());
  }
});
test('a refused frame retains the direct-link fallback and local close control', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mount({ restaurant: 'unavailable' });
    window.harness.open();
  });
  await expect(page.getByRole('link', { name: 'Open reservation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
});
test('custom element registers once, mounts and cleans up after removal', async ({ page }) => {
  const registrations = await page.evaluate(() => [
    window.harness.define(),
    window.harness.define(),
  ]);
  expect(registrations).toEqual([true, false]);
  await page.evaluate(() => {
    const el = document.createElement('menueqr-reservations');
    el.setAttribute('restaurant', 'element-smoke');
    el.setAttribute('language', 'en');
    el.setAttribute('mode', 'inline');
    el.setAttribute(
      'base-url',
      window.harness.options()?.baseUrl ?? `http://127.0.0.1:${Number(location.port) + 1}`,
    );
    document.querySelector('#booking')!.append(el);
  });
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(1);
  await page.evaluate(() => document.querySelector('menueqr-reservations')!.remove());
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
});
test('React Strict Mode and Vue mount once and release open overlays on unmount', async ({
  page,
}) => {
  await page.goto('/frameworks.html');
  for (const framework of ['react', 'vue']) {
    const root = page.locator(`[data-framework=${framework}]`);
    await expect(root.locator('[data-menueqr-widget-host]')).toHaveCount(1);
    await root.getByRole('button', { name: 'Reserve a table', exact: true }).click();
    await expect(page.locator('dialog')).toHaveCount(1);
    // Lifecycle unmount is programmatic, as it would be during client navigation.
    await page
      .locator(`#remove-${framework}`)
      .evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.locator('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  }
});
test('the sandbox uses the SDK and generates the versioned AI prompt without production requests', async ({
  page,
}) => {
  const production: string[] = [];
  page.on('request', (req) => {
    if (new URL(req.url()).hostname.endsWith('menueqr.de')) production.push(req.url());
  });
  await page.goto('/');
  await page.selectOption('#integration', 'api');
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible();
  await page.selectOption('#component', 'floating');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByLabel('Name', { exact: false }).fill('Preview Guest');
  await frame.getByLabel('Email', { exact: false }).fill('guest@example.invalid');
  await frame.getByRole('checkbox').check();
  await frame.getByRole('button', { name: 'Preview request' }).click();
  await expect(frame.getByRole('heading', { name: 'Preview only.' })).toBeVisible();
  const brand = frame.getByRole('link', { name: 'MenüQR', exact: true });
  await expect(brand).toHaveAttribute('href', 'https://www.menueqr.de/');
  await expect(brand).toHaveAttribute('target', '_blank');
  await expect(brand).toHaveAttribute('rel', 'noopener noreferrer');
  await frame.getByRole('button', { name: 'Close preview' }).click();
  await page.selectOption('#integration', 'element');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
  expect(production).toEqual([]);
});

test('WordPress-style selection requires a time and resets it when date or party changes', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mount();
    window.harness.open();
  });
  const frame = page.frameLocator('iframe');
  const next = frame.getByRole('button', { name: 'Continue', exact: true });
  await expect(next).toBeDisabled();
  await expect(frame.getByRole('button', { name: /^\d{2}:\d{2}$/ })).toHaveCount(9);
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  await expect(next).toBeEnabled();
  await frame.getByRole('button', { name: 'More guests' }).click();
  await expect(frame.locator('#guest-count')).toHaveText('3 guests');
  await expect(next).toBeDisabled();
  await frame.getByRole('button', { name: '19:30', exact: true }).click();
  await frame.getByRole('button', { name: 'Tomorrow', exact: true }).click();
  await expect(next).toBeDisabled();
  await expect(frame.getByRole('button', { name: 'Tomorrow', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await frame.getByRole('button', { name: '20:00', exact: true }).click();
  await expect(frame.locator('.mw-footer .selection-summary')).toContainText('3 guests');
  await expect(frame.locator('.mw-footer .selection-summary')).toContainText('20:00');
  const date = frame.getByLabel('Choose date', { exact: true });
  const max = await date.getAttribute('max');
  await date.fill(max!);
  await expect(next).toBeDisabled();
  await expect(frame.getByRole('button', { name: 'Tomorrow', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('contact step keeps drafts and notes while editing and makes no booking request', async ({
  page,
}) => {
  const writes: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') writes.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => {
    window.harness.mount();
    window.harness.open();
  });
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Contact details' })).toBeFocused();
  await frame.getByLabel('Name', { exact: false }).fill('Preview Guest');
  await frame.getByRole('button', { name: 'Add a request' }).click();
  await frame.getByLabel('Your request', { exact: true }).fill('Window table');
  await frame.getByLabel('Your request', { exact: true }).fill('');
  await expect(frame.getByLabel('Your request', { exact: true })).toBeVisible();
  await frame.getByRole('button', { name: 'Change', exact: true }).click();
  await expect(frame.getByRole('button', { name: '19:00', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(frame.getByLabel('Name', { exact: false })).toHaveValue('Preview Guest');
  await expect(frame.getByLabel('Your request', { exact: true })).toBeVisible();
  await frame.getByRole('button', { name: 'Preview request' }).click();
  await expect(frame.getByRole('heading', { name: 'Contact details' })).toBeVisible();
  await frame.getByLabel('Email', { exact: false }).fill('guest@example.invalid');
  await frame.getByRole('checkbox').check();
  await frame.getByRole('button', { name: 'Preview request' }).click();
  await expect(frame.getByRole('heading', { name: 'Preview only.' })).toBeVisible();
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('the preview matches the German WordPress UI and keeps its footer visible', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mount({ language: 'de', color: '#222222' });
    window.harness.open();
  });
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('heading', { name: 'Tisch reservieren' })).toBeVisible();
  await expect(frame.getByRole('link', { name: 'MenüQR', exact: true })).toHaveAttribute(
    'href',
    'https://www.menueqr.de/',
  );
  await expect(frame.getByRole('button', { name: 'Heute', exact: true })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Morgen', exact: true })).toBeVisible();
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  const next = frame.getByRole('button', { name: 'Weiter', exact: true });
  const colors = await next.evaluate((button) => ({
    background: getComputedStyle(button).backgroundColor,
    foreground: getComputedStyle(button).color,
  }));
  expect(colors).toEqual({ background: 'rgb(34, 34, 34)', foreground: 'rgb(255, 255, 255)' });
  const button = await next.boundingBox();
  const iframe = await page.locator('iframe').boundingBox();
  expect(button!.y + button!.height).toBeLessThanOrEqual(iframe!.y + iframe!.height);
  await next.click();
  await expect(frame.getByRole('heading', { name: 'Kontaktdaten' })).toBeVisible();
  await expect(frame.getByRole('link', { name: 'MenüQR', exact: true })).toBeVisible();
  await expect(frame.getByLabel('E-Mail', { exact: false })).toBeVisible();
});
