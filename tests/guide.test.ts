import { expect, it } from 'vitest';
import { transform } from 'esbuild';
import {
  createIntegrationGuide,
  createIntegrationPrompt,
  reactSnippet,
  nextLayoutSnippet,
  elementRegistrationSnippet,
  elementMarkupSnippet,
} from '../src/prompt.js';
const input = { restaurant: 'https://www.menueqr.de/menu/bistro-lumi/', language: 'de' as const };
it.each(['button', 'floating', 'tab', 'inline'] as const)(
  'generates valid React and Next.js TSX for the %s component',
  async (component) => {
    for (const generate of [reactSnippet, nextLayoutSnippet]) {
      const code = generate({ ...input, component });
      const compiled = await transform(code, { loader: 'tsx', format: 'esm', jsx: 'automatic' });
      expect(compiled.warnings).toEqual([]);
      expect(code).toContain('from "@menueqr/widget/react"');
      expect(code).toContain('restaurant="bistro-lumi"');
      expect(code).not.toContain('mountReservation');
      expect(code).not.toContain('"mode"');
    }
  },
);
it('keeps a label with quotes, HTML and newlines inside one JSX string expression', async () => {
  const label = '" /> <script>alert(1)</script> &\nHello';
  const code = reactSnippet({ ...input, label });
  expect(code).toContain(`label={${JSON.stringify(label)}}`);
  await expect(transform(code, { loader: 'tsx', jsx: 'automatic' })).resolves.toBeDefined();
});
it.each(['react', 'next'] as const)(
  'offers JavaScript JSX without TypeScript syntax for %s',
  async (integration) => {
    const guide = createIntegrationGuide({ ...input, integration, codeLanguage: 'javascript' });
    expect(guide.primary.filename).toMatch(/\.jsx$/);
    expect(guide.primary.language).toBe('JSX');
    expect(guide.primary.code).not.toContain('ReactNode');
    expect(guide.primary.code).not.toContain('import type');
    await expect(
      transform(guide.primary.code, { loader: 'jsx', jsx: 'automatic' }),
    ).resolves.toBeDefined();
    const typed = createIntegrationGuide({ ...input, integration, codeLanguage: 'typescript' });
    const [js, ts] = await Promise.all([
      transform(guide.primary.code, {
        loader: 'jsx',
        jsx: 'automatic',
        format: 'esm',
        minify: true,
      }),
      transform(typed.primary.code, {
        loader: 'tsx',
        jsx: 'automatic',
        format: 'esm',
        minify: true,
      }),
    ]);
    expect(js.code).toBe(ts.code);
  },
);
it.each(['react', 'next', 'api', 'element'] as const)(
  'keeps the %s guide and AI prompt consistent',
  (integration) => {
    const guide = createIntegrationGuide({ ...input, integration, component: 'floating' });
    const prompt = createIntegrationPrompt({ ...input, integration, component: 'floating' });
    expect(prompt).toContain(guide.installCommand);
    expect(prompt).toContain(guide.primary.code);
    expect(guide.installCommand).not.toContain('localhost');
    expect(prompt).not.toContain('127.0.0.1');
    if (guide.support) expect(prompt).toContain(guide.support.code);
    if (integration === 'react' || integration === 'next') {
      expect(guide.primary.language).toBe('TSX');
      expect(prompt).not.toContain('mountReservationFloating');
    }
  },
);
it('separates Web Component registration from HTML so each copied file is valid', () => {
  const registration = elementRegistrationSnippet(input);
  const html = elementMarkupSnippet(input);
  expect(registration).toContain('defineReservationButtonElement();');
  expect(registration).not.toContain('<menueqr-');
  expect(html).toContain('<menueqr-reservation-button');
  expect(html).not.toContain('import ');
  expect(createIntegrationGuide({ ...input, integration: 'api' }).support?.code).toBe(
    '<div id="booking"></div>',
  );
});
