import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/harness.html');
  await page.waitForFunction(() => Boolean(window.harness));
});

for (const side of ['left', 'right'] as const) {
  test(`${side} drawer moves its original launcher, exposes one close control and keeps the footer clear`, async ({
    page,
  }) => {
    await page.evaluate((side) => window.harness.mountVariant('tab', { side }), side);
    const launcher = page.getByRole('button', { name: 'Reserve', exact: true });
    const compact = await launcher.evaluate((button) => {
      const box = button.getBoundingClientRect();
      const skin = getComputedStyle(button, '::before');
      const matrix = new DOMMatrixReadOnly(skin.transform === 'none' ? undefined : skin.transform);
      return { hit: box.width, visible: parseFloat(skin.width) * matrix.a };
    });
    if (page.viewportSize()!.width > 540) {
      expect(compact.hit).toBeCloseTo(48);
      expect(compact.visible).toBeCloseTo(40);
    } else expect(compact.visible).toBeCloseTo(compact.hit);
    const original = await launcher.elementHandle();
    await launcher.click();
    const close = page.getByRole('button', { name: 'Close', exact: true });
    await expect(close).toBeEnabled();
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    expect(await original!.evaluate((button) => Boolean(button.closest('dialog')))).toBe(true);
    const frame = page.frameLocator('iframe');
    await expect(frame.getByRole('heading', { name: 'Reserve a table' })).toBeVisible();
    await expect(frame.getByRole('button', { name: 'Close preview' })).toBeHidden();
    // Wait for actual CSS transitions, not a fixed animation timeout.
    await page.locator('dialog').evaluate(async (dialog) => {
      await Promise.allSettled(dialog.getAnimations({ subtree: true }).map((a) => a.finished));
    });
    const panel = (await page.locator('.drawer-panel').boundingBox())!;
    const control = (await close.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(control.width).toBeCloseTo(48);
    expect(control.height).toBeCloseTo(48);
    if (viewport.width <= 540) {
      expect(panel.y).toBeCloseTo(0);
      expect(panel.height).toBeCloseTo(viewport.height);
      expect(panel.width).toBeCloseTo(viewport.width);
      expect(control.x).toBeCloseTo(viewport.width - 60);
      expect(control.y).toBeCloseTo(12);
      const iframe = (await page.locator('iframe').boundingBox())!;
      expect(control.y + control.height + 3).toBeLessThanOrEqual(iframe.y);
      const footer = (await frame
        .getByRole('button', { name: 'Continue', exact: true })
        .boundingBox())!;
      expect(footer.y + footer.height).toBeLessThanOrEqual(panel.y + panel.height);
    } else if (side === 'right') {
      expect(control.x + control.width + 11).toBeLessThanOrEqual(panel.x);
      expect(panel.x + panel.width).toBeCloseTo(viewport.width);
    } else {
      expect(panel.x).toBeCloseTo(0);
      expect(panel.x + panel.width + 11).toBeLessThanOrEqual(control.x);
    }
    await test.info().attach(`${side}-drawer`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await close.click();
    await expect(page.locator('dialog')).toHaveCount(0);
    await expect(launcher).toBeFocused();
    expect(
      await original!.evaluate((button) => button.isConnected && !button.closest('dialog')),
    ).toBe(true);
    expect(
      await page.evaluate(() => window.harness.events().filter((event) => event === 'close')),
    ).toHaveLength(1);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
}

test('reversing a partially closed drawer keeps its frame, selection and callbacks', async ({
  page,
}) => {
  const navigations: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/embed/reservations/'))
      navigations.push(request.url());
  });
  await page.evaluate(() => {
    window.harness.mountVariant('tab');
    window.harness.open();
  });
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByLabel('Name', { exact: false }).fill('Preview Guest');
  const retained = await page.locator('iframe').evaluate(async (iframe) => {
    window.harness.close();
    const dialog = iframe.closest('dialog')!;
    const transitions = dialog.getAnimations({ subtree: true });
    // Scrub the real exit halfway to exercise reversal mid-flight on every browser.
    for (const animation of transitions) {
      animation.pause();
      animation.currentTime = Number(animation.effect!.getComputedTiming().duration) / 2;
    }
    const closing = dialog.dataset.state;
    window.harness.open();
    for (const animation of transitions) animation.play();
    return closing === 'closing' && dialog.dataset.state === 'open' && iframe.isConnected;
  });
  expect(retained).toBe(true);
  await expect(frame.getByLabel('Name', { exact: false })).toHaveValue('Preview Guest');
  expect(navigations).toHaveLength(1);
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'open')),
  ).toHaveLength(1);
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'close')),
  ).toHaveLength(0);
  // Escape is sent from inside the cross-origin form as well as the parent modal.
  await frame.getByLabel('Name', { exact: false }).press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'close')),
  ).toHaveLength(1);
});

test('switching between full-screen mobile and desktop preserves the booking draft', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mountVariant('tab');
    window.harness.open();
  });
  const original = await page.locator('iframe').elementHandle();
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByLabel('Name', { exact: false }).fill('Preview Guest');
  for (const width of [390, 1000, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    await expect(frame.getByLabel('Name', { exact: false })).toHaveValue('Preview Guest');
    await expect(frame.locator('.selection-summary').first()).toContainText('19:00');
    expect(await original!.evaluate((iframe) => iframe.isConnected)).toBe(true);
  }
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('native modality blocks the site and backdrop dismissal restores the launcher', async ({
  page,
}) => {
  await page.evaluate(() => {
    const outside = document.createElement('button');
    outside.id = 'outside-control';
    outside.textContent = 'Website action';
    document.body.append(outside);
    window.harness.mountVariant('tab');
    window.harness.open();
  });
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  expect(await page.locator('dialog').evaluate((dialog) => dialog.matches(':modal'))).toBe(true);
  await page.keyboard.press('Tab');
  await page.locator('#outside-control').evaluate((button: HTMLButtonElement) => button.focus());
  await expect(page.locator('#outside-control')).not.toBeFocused();
  const scrim = page.locator('.drawer-scrim');
  const small = page.viewportSize()!.width <= 540;
  // The mobile sheet covers the backdrop completely; use the native Escape path.
  if (small) await page.keyboard.press('Escape');
  else await scrim.click({ position: { x: 8, y: 8 } });
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reserve', exact: true })).toBeFocused();
});

test('reduced motion fades without sliding, scaling or blur and still closes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    window.harness.mountVariant('tab', { icon: false });
    window.harness.open();
  });
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  const effects = await page.locator('dialog').evaluate((dialog) => {
    const nodes = [
      dialog.querySelector('.drawer-panel')!,
      dialog.querySelector('.drawer-content')!,
      dialog.querySelector('.close-icon')!,
    ];
    return nodes.map((node) => {
      const css = getComputedStyle(node);
      return { transform: css.transform, filter: css.filter, properties: css.transitionProperty };
    });
  });
  for (const effect of effects) {
    expect(effect).toEqual({ transform: 'none', filter: 'none', properties: 'opacity' });
  }
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('update, unmount and mobile hiding cancel an exit without leaving modal or scroll locks', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => {
    document.body.style.overflow = 'clip';
    window.harness.mountVariant('tab');
    window.harness.open();
    window.harness.close();
    window.harness.update({ language: 'de' });
  });
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  await page.getByRole('button', { name: 'Reservieren', exact: true }).click();
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  await page.evaluate(() => {
    window.harness.close();
    window.harness.destroy();
  });
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.evaluate(() => {
    window.harness.mountVariant('tab', { mobile: false });
    window.harness.open();
  });
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  await page.evaluate(() => window.harness.close());
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  expect(errors).toEqual([]);
});

test('a slow or refused form can always be dismissed without trusting a fake ready message', async ({
  page,
}) => {
  await page.route('**/embed/reservations/slow/**', () => {});
  await page.evaluate(() => {
    window.harness.mountVariant('tab', { restaurant: 'slow' });
    window.harness.open();
  });
  await page.evaluate(() =>
    window.harness.send('menueqr:reservation:ready', window.harness.options()!.baseUrl, 'self'),
  );
  await expect(page.getByRole('link', { name: 'Open reservation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await page.evaluate(() => {
    window.harness.update({ restaurant: 'unavailable' });
    window.harness.open();
  });
  await expect(page.getByRole('link', { name: 'Open reservation', exact: true })).toBeVisible();
  await expect(page.locator('.drawer-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.drawer-content')).toHaveAttribute('data-loaded', 'true');
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'ready')),
  ).toHaveLength(0);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('motion transitions stay reversible when replayed at ten percent speed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const opening = await page.evaluate(async () => {
    window.harness.mountVariant('tab');
    window.harness.open();
    const host = document.querySelector('[data-menueqr-widget-host]')!;
    const panel = host.shadowRoot!.querySelector('.drawer-panel')!;
    const animation = panel
      .getAnimations()
      .find((a) => (a as CSSTransition).transitionProperty === 'transform');
    if (!animation) return false;
    animation.updatePlaybackRate(0.1);
    await animation.finished;
    return getComputedStyle(panel).transform === 'matrix(1, 0, 0, 1, 0, 0)';
  });
  expect(opening).toBe(true);
  const closing = await page.locator('dialog').evaluate(async (dialog) => {
    window.harness.close();
    const transitions = dialog.getAnimations({ subtree: true });
    for (const animation of transitions) animation.updatePlaybackRate(0.1);
    await Promise.allSettled(transitions.map((animation) => animation.finished));
    return transitions.length > 0;
  });
  expect(closing).toBe(true);
  await expect(page.locator('dialog')).toHaveCount(0);
});
