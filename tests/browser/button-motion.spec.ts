import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/harness.html');
  await page.waitForFunction(() => Boolean(window.harness));
});

test('keyboard focus keeps its visible ring when the pointer moves over the button', async ({
  page,
}) => {
  await page.evaluate(() => window.harness.mountVariant('button'));
  const launcher = page.getByRole('button', { name: 'Reserve a table', exact: true });
  await launcher.press('Enter');
  await expect(page.locator('dialog')).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(launcher).toBeFocused();
  await launcher.hover();
  await expect
    .poll(() => launcher.evaluate((button) => getComputedStyle(button).boxShadow))
    .toContain('0px 0px 0px 5px');
});

test('ordinary button has a tactile press, anchored entrance and animated exit with restored focus', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => window.harness.mountVariant('button'));
  const launcher = page.getByRole('button', { name: 'Reserve a table', exact: true });
  expect(await launcher.evaluate((button) => button.getAnimations().length)).toBe(0);
  const rect = (await launcher.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await expect
    .poll(() => launcher.evaluate((button) => getComputedStyle(button).transform))
    .toBe('matrix(0.96, 0, 0, 0.96, 0, 0)');
  await page.mouse.up();
  await expect(page.locator('dialog')).toHaveAttribute('data-state', 'open');
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  await page.locator('dialog').evaluate(async (dialog) => {
    await Promise.allSettled(
      dialog.getAnimations({ subtree: true }).map((animation) => animation.finished),
    );
  });
  const modal = (await page.locator('dialog').boundingBox())!;
  if (page.viewportSize()!.width <= 540) {
    expect(modal.x).toBeCloseTo(0);
    expect(modal.y).toBeCloseTo(0);
    expect(modal.width).toBeCloseTo(page.viewportSize()!.width);
    expect(modal.height).toBeCloseTo(page.viewportSize()!.height);
  }
  const closing = await page.locator('dialog').evaluate((dialog) => {
    window.harness.close();
    return dialog.getAttribute('data-state') === 'closing' && (dialog as HTMLDialogElement).open;
  });
  expect(closing).toBe(true);
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(launcher).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'close')),
  ).toHaveLength(1);
});

test('reopening mid-exit preserves the reservation draft and makes no second frame request', async ({
  page,
}) => {
  const navigations: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/embed/reservations/'))
      navigations.push(request.url());
  });
  await page.evaluate(() => {
    window.harness.mountVariant('button');
    window.harness.open();
  });
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByLabel('Name', { exact: false }).fill('Preview Guest');
  await page.locator('dialog').evaluate((dialog) => {
    window.harness.close();
    const transitions = dialog.getAnimations({ subtree: true });
    for (const animation of transitions) {
      animation.pause();
      animation.currentTime = Number(animation.effect!.getComputedTiming().duration) / 2;
    }
    window.harness.open();
    for (const animation of transitions) animation.play();
  });
  await expect(frame.getByLabel('Name', { exact: false })).toHaveValue('Preview Guest');
  expect(navigations).toHaveLength(1);
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'open')),
  ).toHaveLength(1);
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'close')),
  ).toHaveLength(0);
  await frame.getByLabel('Name', { exact: false }).press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('reduced motion keeps the button and form still while fading the overlay', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    window.harness.mountVariant('button', { icon: false });
    window.harness.open();
  });
  await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
  const css = await page.locator('dialog').evaluate((dialog) => ({
    transform: getComputedStyle(dialog).transform,
    properties: getComputedStyle(dialog).transitionProperty,
  }));
  expect(css).toEqual({ transform: 'none', properties: 'opacity' });
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reserve a table', exact: true })).toBeFocused();
});

test('update, destroy and native close immediately clean up a transitioning button modal', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => {
    document.body.style.overflow = 'clip';
    window.harness.mountVariant('button');
    window.harness.open();
    window.harness.close();
    window.harness.update({ language: 'fr' });
  });
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  await page.evaluate(() => {
    window.harness.open();
    window.harness.close();
    window.harness.destroy();
  });
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  await page.evaluate(() => {
    window.harness.mountVariant('button');
    window.harness.open();
  });
  await page.locator('dialog').evaluate((dialog) => (dialog as HTMLDialogElement).close());
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  expect(errors).toEqual([]);
});

test('the button dialog completes both directions at ten percent playback speed', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(
    await page.evaluate(async () => {
      window.harness.mountVariant('button');
      window.harness.open();
      const dialog = document
        .querySelector('[data-menueqr-widget-host]')!
        .shadowRoot!.querySelector('dialog')!;
      const movement = dialog
        .getAnimations()
        .find((animation) => (animation as CSSTransition).transitionProperty === 'transform');
      if (!movement) return false;
      movement.updatePlaybackRate(0.1);
      await movement.finished;
      window.harness.close();
      const exits = dialog.getAnimations({ subtree: true });
      for (const animation of exits) animation.updatePlaybackRate(0.1);
      await Promise.allSettled(exits.map((animation) => animation.finished));
      return true;
    }),
  ).toBe(true);
  await expect(page.locator('dialog')).toHaveCount(0);
});
