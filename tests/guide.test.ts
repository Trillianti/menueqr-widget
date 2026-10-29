import { expect, it } from 'vitest';
import { transform } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  createIntegrationGuide,
  createIntegrationPrompt,
  reactSnippet,
  nextLayoutSnippet,
  elementRegistrationSnippet,
  elementMarkupSnippet,
  installationCommand,
} from '../src/prompt.js';
const input = { restaurant: 'https://www.menueqr.de/menu/bistro-lumi/', language: 'de' as const };
async function renderExample(source: string, loader: 'jsx' | 'tsx') {
  const { code } = await transform(source, { loader, jsx: 'automatic', format: 'cjs' });
  const widgets = Object.fromEntries(
    ['ReservationButton', 'ReservationFloating', 'ReservationTab', 'ReservationInline'].map(
      (name) => [
        name,
        (props: Record<string, unknown>) =>
          createElement('span', { 'data-component': name, 'data-options': JSON.stringify(props) }),
      ],
    ),
  );
  const module = {
    exports: {} as {
      SiteLayout?: ComponentType<{ children: ReactNode }>;
      default?: ComponentType<{ children: ReactNode }>;
    },
  };
  runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name: string) => {
        if (name === 'react/jsx-runtime') return jsxRuntime;
        if (name === '@menueqr/widget/react') return widgets;
        throw new Error(`Unexpected example import: ${name}`);
      },
    },
    { timeout: 1000, contextCodeGeneration: { strings: false, wasm: false } },
  );
  const Component = module.exports.SiteLayout ?? module.exports.default;
  if (!Component) throw new Error('The example must export its layout component.');
  return renderToStaticMarkup(
    createElement(Component, { children: createElement('p', null, 'Page content') }),
  );
}
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
      renderExample(guide.primary.code, 'jsx'),
      renderExample(typed.primary.code, 'tsx'),
    ]);
    expect(js).toBe(ts);
    expect(js).toContain('data-component="ReservationButton"');
    expect(js).toContain('bistro-lumi');
    expect(js).toContain('Page content');
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

it.each([
  ['npm', 'npm install @menueqr/widget'],
  ['pnpm', 'pnpm add @menueqr/widget'],
  ['yarn', 'yarn add @menueqr/widget'],
  ['bun', 'bun add @menueqr/widget'],
] as const)(
  'uses one registry package for the %s guide and AI prompt',
  (packageManager, command) => {
    expect(installationCommand(packageManager)).toBe(command);
    for (const integration of ['react', 'next', 'api', 'element'] as const) {
      expect(createIntegrationGuide({ ...input, packageManager, integration }).installCommand).toBe(
        command,
      );
      const prompt = createIntegrationPrompt({ ...input, packageManager, integration });
      expect(prompt).toContain(command);
      expect(prompt).not.toContain('releases/download');
      expect(prompt).not.toContain('not yet on the npm registry');
    }
  },
);
it('rejects an unsupported package manager instead of generating a shell command', () => {
  expect(() => installationCommand('npm; echo unsafe' as never)).toThrow(/Choose npm/);
});
