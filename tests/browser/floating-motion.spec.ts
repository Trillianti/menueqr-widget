import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/harness.html');
  await page.waitForFunction(() => Boolean(window.harness));
});

test('the actual launcher stays painted and retains its DOM node throughout opening and closing', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const trace = await page.evaluate(async () => {
    window.harness.mountVariant('floating');
    const root = document.querySelector('[data-menueqr-widget-host]')!.shadowRoot!;
    const button = root.querySelector<HTMLButtonElement>('.trigger')!;
    const samples: Array<{
      same: boolean;
      visibility: string;
      opacity: number;
      disabled: boolean;
    }> = [];
    let recording = true;
    const sample = () => {
      if (!recording) return;
      const css = getComputedStyle(button);
      samples.push({
        same: root.querySelector('.trigger') === button && button.isConnected,
        visibility: css.visibility,
        opacity: Number(css.opacity),
        disabled: button.disabled,
      });
      requestAnimationFrame(sample);
    };
    const until = (predicate: () => boolean) =>
      new Promise<void>((resolve) => {
        const check = () => (predicate() ? resolve() : requestAnimationFrame(check));
        check();
      });
    sample();
    window.harness.open();
    const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
    await until(() => dialog.getAttribute('aria-busy') === 'false');
    button.focus();
    const modalBlocksFocus = root.activeElement !== button && dialog.matches(':modal');
    window.harness.close();
    await until(() => !dialog.isConnected);
    recording = false;
    return { samples, modalBlocksFocus };
  });
  expect(trace.samples.length).toBeGreaterThan(5);
  expect(
    trace.samples.every(
      (sample) =>
        sample.same && sample.visibility === 'visible' && sample.opacity === 1 && !sample.disabled,
    ),
  ).toBe(true);
  expect(trace.modalBlocksFocus).toBe(true);
});

test('the expanded surface covers the real launcher at zero offsets, including a long custom label', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mountVariant('floating', {
      offsetX: 0,
      offsetY: 0,
      label: 'Reserve a table for our next restaurant evening together '.repeat(2),
    });
    window.harness.open();
  });
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
  const panel = (await page.locator('dialog').boundingBox())!;
  const button = (await page.locator('.trigger').boundingBox())!;
  expect(panel.x).toBeLessThanOrEqual(button.x + 0.5);
  expect(panel.y).toBeLessThanOrEqual(button.y + 0.5);
  expect(panel.x + panel.width).toBeGreaterThanOrEqual(button.x + button.width - 0.5);
  expect(panel.y + panel.height).toBeGreaterThanOrEqual(button.y + button.height - 0.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('the loading close control hands over only after the hosted close icon is fully painted', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const initial = await page.evaluate(
    () =>
      new Promise<{ frame: number; close: string; opacity: number }>((resolve) => {
        window.harness.mountVariant('floating');
        const root = document.querySelector('[data-menueqr-widget-host]')!.shadowRoot!;
        const observer = new MutationObserver(() => {
          const surface = root.querySelector<HTMLElement>('.floating-surface');
          if (!surface?.dataset.ready) return;
          observer.disconnect();
          const frame = surface.querySelector('iframe')!;
          const fade = frame
            .getAnimations()
            .find((animation) => (animation as CSSTransition).transitionProperty === 'opacity');
          if (fade) {
            fade.pause();
            fade.currentTime = 0;
          }
          const control = getComputedStyle(surface.querySelector('.close')!);
          resolve({
            frame: Number(getComputedStyle(frame).opacity),
            close: control.display,
            opacity: Number(control.opacity),
          });
          fade?.play();
        });
        observer.observe(root, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['data-ready'],
        });
        window.harness.open();
      }),
  );
  expect(initial.frame).toBeLessThan(1);
  expect(initial.close).not.toBe('none');
  expect(initial.opacity).toBe(1);
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
  await expect(page.locator('.floating-surface > .close')).toHaveAttribute('aria-hidden', 'true');
  for (const width of [390, 500, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(async () => {
        const local = (await page.locator('.floating-surface > .close > svg').boundingBox())!;
        const hosted = (await page
          .frameLocator('iframe')
          .getByRole('button', { name: 'Close preview' })
          .locator('svg')
          .boundingBox())!;
        return Math.max(
          ...(['x', 'y', 'width', 'height'] as const).map((key) =>
            Math.abs(local[key] - hosted[key]),
          ),
        );
      })
      .toBeLessThan(0.5);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('the native window stays unpainted until the starting capsule is prepared', async ({
  page,
}) => {
  const visibility = await page.evaluate(() => {
    let initial = '';
    const show = HTMLDialogElement.prototype.showModal;
    HTMLDialogElement.prototype.showModal = function () {
      show.call(this);
      initial = getComputedStyle(this).visibility;
    };
    try {
      window.harness.mountVariant('floating');
      window.harness.open();
      const dialog = document
        .querySelector('[data-menueqr-widget-host]')!
        .shadowRoot!.querySelector('dialog')!;
      return { initial, prepared: getComputedStyle(dialog).visibility };
    } finally {
      HTMLDialogElement.prototype.showModal = show;
    }
  });
  expect(visibility).toEqual({ initial: 'hidden', prepared: 'visible' });
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('closing prepares the real button and hides the native window before detaching the frame', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mountVariant('floating');
    window.harness.open();
  });
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
  const order = await page.locator('dialog').evaluate(async (node) => {
    const dialog = node as HTMLDialogElement;
    const root = dialog.getRootNode() as ShadowRoot;
    const trigger = root.querySelector('.trigger')!;
    const frame = dialog.querySelector('iframe')!;
    const observations: string[] = [];
    const close = dialog.close.bind(dialog);
    const remove = frame.remove.bind(frame);
    dialog.close = () => {
      observations.push(`close:${getComputedStyle(trigger).visibility}`);
      close();
    };
    frame.remove = () => {
      observations.push(`detach:${dialog.open}`);
      remove();
    };
    window.harness.close();
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (!dialog.isConnected) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(root, { childList: true });
    });
    return observations;
  });
  expect(order).toEqual(['close:visible', 'detach:false']);
  await expect(page.getByRole('button', { name: 'Reserve', exact: true })).toBeFocused();
});

for (const side of ['left', 'right'] as const) {
  test(`${side} floating surface grows from the actual launcher bounds and returns with focus`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const geometry = await page.evaluate((side) => {
      document.body.style.minHeight = '2200px';
      window.scrollTo(0, 600);
      window.harness.mountVariant('floating', { side, offsetX: 0 });
      const root = document.querySelector('[data-menueqr-widget-host]')!.shadowRoot!;
      const trigger = root.querySelector('button')!;
      const source = trigger.getBoundingClientRect().toJSON();
      window.harness.open();
      const dialog = root.querySelector('dialog')!;
      const transitions = dialog.getAnimations({ subtree: true });
      for (const animation of transitions) {
        animation.pause();
        animation.currentTime = 0;
      }
      const surface = dialog.querySelector<HTMLElement>('.floating-surface')!;
      const css = getComputedStyle(surface);
      const inset = css.clipPath.match(/^inset\((.*?)(?:round|\))/)?.[1];
      if (!inset) throw new Error('The opening surface must have a capsule clip.');
      const values = inset.trim().split(/\s+/).map(parseFloat);
      const top = values[0] ?? 0;
      const right = values[1] ?? top;
      const bottom = values[2] ?? top;
      const left = values[3] ?? right;
      const bounds = dialog.getBoundingClientRect();
      const origin = css.transformOrigin.split(' ').map(parseFloat);
      const originX = origin[0] ?? 0;
      const originY = origin[1] ?? 0;
      const matrix = new DOMMatrixReadOnly(css.transform === 'none' ? undefined : css.transform);
      const start = new DOMPoint(left - originX, top - originY).matrixTransform(matrix);
      const end = new DOMPoint(
        surface.offsetWidth - right - originX,
        surface.offsetHeight - bottom - originY,
      ).matrixTransform(matrix);
      const capsule = {
        x: bounds.x + originX + start.x,
        y: bounds.y + originY + start.y,
        width: end.x - start.x,
        height: end.y - start.y,
      };
      const formTransform = getComputedStyle(dialog.querySelector('iframe')!).transform;
      for (const animation of transitions) animation.play();
      return { source, capsule, formTransform };
    }, side);
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(geometry.capsule[key]).toBeCloseTo(geometry.source[key], 0);
    expect(geometry.formTransform).toBe('none');
    await expect(page.locator('.floating-surface > iframe')).toHaveJSProperty('inert', false);
    await expect(page.frameLocator('iframe').getByRole('heading')).toBeVisible();
    await expect(page.locator('.trigger')).toHaveCSS('visibility', 'visible');
    await expect(page.locator('.trigger')).toBeEnabled();
    const dialog = (await page.locator('dialog').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(dialog.x).toBeGreaterThanOrEqual(0);
    expect(dialog.y).toBeGreaterThanOrEqual(0);
    expect(dialog.x + dialog.width).toBeLessThanOrEqual(viewport.width);
    expect(dialog.y + dialog.height).toBeLessThanOrEqual(viewport.height);
    if (viewport.width <= 540) {
      expect(dialog).toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    }
    await page.frameLocator('iframe').getByRole('button', { name: 'Close preview' }).click();
    await expect(page.locator('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reserve', exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await page.evaluate(() => window.scrollY)).toBe(600);
  });
}

test('reversing the collapse retains the frame, selected time and contact draft', async ({
  page,
}) => {
  const navigations: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/embed/reservations/'))
      navigations.push(request.url());
  });
  await page.evaluate(() => {
    window.harness.mountVariant('floating');
    window.harness.open();
  });
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
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
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
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
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'close')),
  ).toHaveLength(1);
});

test('a mobile full-screen surface adapts to desktop without reloading or losing the draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.harness.mountVariant('floating', { side: 'left' });
    window.harness.open();
  });
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: '19:00', exact: true }).click();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByLabel('Name', { exact: false }).fill('Preview Guest');
  const original = await page.locator('iframe').elementHandle();
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(frame.getByLabel('Name', { exact: false })).toHaveValue('Preview Guest');
    expect(await original!.evaluate((iframe) => iframe.isConnected)).toBe(true);
    const rect = (await page.locator('dialog').boundingBox())!;
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
});

test('reduced motion uses only a fade and keeps the form reachable by keyboard', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.harness.mountVariant('floating', { icon: false }));
  await page.getByRole('button', { name: 'Reserve', exact: true }).press('Enter');
  await expect(page.locator('iframe')).toHaveJSProperty('inert', false);
  const styles = await page.locator('.floating-surface').evaluate((surface) => ({
    transform: getComputedStyle(surface).transform,
    clip: getComputedStyle(surface).clipPath,
    transition: getComputedStyle(surface).transitionProperty,
  }));
  expect(styles).toEqual({ transform: 'none', clip: 'none', transition: 'opacity' });
  await expect(page.locator('.trigger')).toHaveCSS('visibility', 'visible');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reserve', exact: true })).toBeFocused();
});

test('update, destroy and mobile hiding immediately release a growing or collapsing surface', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => {
    document.body.style.overflow = 'clip';
    window.harness.mountVariant('floating');
    window.harness.open();
    window.harness.close();
    window.harness.update({ language: 'de' });
  });
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  await page.evaluate(() => {
    window.harness.open();
    window.harness.close();
    window.harness.destroy();
  });
  await expect(page.locator('[data-menueqr-widget-host]')).toHaveCount(0);
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.evaluate(() => {
    window.harness.mountVariant('floating', { mobile: false });
    window.harness.open();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  expect(errors).toEqual([]);
});

test('a failed form keeps the local close control and untrusted ready messages cannot remove the fallback', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.harness.mountVariant('floating', { restaurant: 'unavailable' });
    window.harness.open();
  });
  await page.evaluate(() =>
    window.harness.send('menueqr:reservation:ready', window.harness.options()!.baseUrl, 'self'),
  );
  await expect(page.getByRole('link', { name: 'Open reservation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(
    await page.evaluate(() => window.harness.events().filter((event) => event === 'ready')),
  ).toHaveLength(0);
});

test('the capsule grows and collapses smoothly at ten percent playback speed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(
    await page.evaluate(async () => {
      window.harness.mountVariant('floating');
      window.harness.open();
      const dialog = document
        .querySelector('[data-menueqr-widget-host]')!
        .shadowRoot!.querySelector('dialog')!;
      const surface = dialog.querySelector('.floating-surface')!;
      const movement = surface
        .getAnimations()
        .find((animation) => (animation as CSSTransition).transitionProperty === 'clip-path');
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
