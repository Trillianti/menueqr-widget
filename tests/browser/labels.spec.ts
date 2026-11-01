import { expect, test } from '@playwright/test';

for (const component of ['button', 'floating', 'tab'] as const) {
  for (const label of ['Reserve a table '.repeat(8).slice(0, 120), 'W'.repeat(120)]) {
    test(`${component}: ${label.includes(' ') ? 'spaced' : 'unbroken'} labels fit narrow screens and retain their accessible name`, async ({
      page,
    }) => {
      await page.goto('/harness.html');
      await page.waitForFunction(() => Boolean(window.harness));
      await page.evaluate(
        ({ component, label }) => window.harness.mountVariant(component, { label }),
        { component, label },
      );
      const launcher = page.getByRole('button', { name: label.trim(), exact: true });
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 640 });
        await expect(launcher).toBeVisible();
        await expect(launcher).toHaveAccessibleName(label.trim());
        const bounds = await launcher.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          const label = button.querySelector('.trigger-label')!.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            labelRight: label.right,
            labelBottom: label.bottom,
            pageWidth: document.documentElement.scrollWidth,
            viewport: innerWidth,
          };
        });
        expect(bounds.pageWidth).toBeLessThanOrEqual(bounds.viewport);
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(width + 1);
        expect(bounds.top).toBeGreaterThanOrEqual(0);
        expect(bounds.bottom).toBeLessThanOrEqual(641);
        expect(bounds.labelRight).toBeLessThanOrEqual(bounds.right + 1);
        expect(bounds.labelBottom).toBeLessThanOrEqual(bounds.bottom + 1);
      }
    });
  }
}

test('a Button label fits a narrow parent even with enlarged text', async ({ page }) => {
  await page.goto('/harness.html');
  await page.waitForFunction(() => Boolean(window.harness));
  await page.evaluate(() => {
    (document.querySelector('#booking') as HTMLElement).style.width = '160px';
    window.harness.mountVariant('button', { label: 'Reserve a table '.repeat(8).slice(0, 120) });
  });
  const launcher = page.locator('.trigger');
  await launcher.evaluate((button) => {
    button.style.fontSize = '28px';
  });
  expect((await launcher.boundingBox())!.width).toBeLessThanOrEqual(160);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
