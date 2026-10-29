import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const esm = await import('../dist/index.js');
const element = await import('../dist/element.js');
const cjs = require('../dist/index.cjs');
const prompt = await import('../dist/prompt.js');
const cjsElement = require('../dist/element.cjs');
const cjsPrompt = require('../dist/prompt.cjs');
for (const kind of ['Button', 'Floating', 'Tab', 'Inline']) {
  const name = `mountReservation${kind}`;
  const esmPart = await import(`../dist/components/${kind.toLowerCase()}.js`);
  const cjsPart = require(`../dist/components/${kind.toLowerCase()}.cjs`);
  assert.equal(typeof esm[name], 'function');
  assert.equal(esm[name], esmPart[name]);
  assert.equal(cjs[name], cjsPart[name]);
}
const { createElement } = await import('react');
const { renderToString } = await import('react-dom/server');
const react = await import('../dist/react.js');
assert.match(await readFile('dist/react.js', 'utf8'), /^["']use client["'];/);
for (const name of [
  'ReservationButton',
  'ReservationFloating',
  'ReservationTab',
  'ReservationInline',
]) {
  assert.equal(typeof react[name], 'function');
  assert.match(renderToString(createElement(react[name], { restaurant: 'example' })), /<div/);
}
assert.equal(typeof esm.mountReservations, 'function');
assert.equal(typeof cjs.mountReservations, 'function');
assert.equal(element.defineReservationsElement(), false);
assert.equal(cjsElement.defineReservationsElement(), false);
assert.equal(typeof cjsPrompt.createIntegrationPrompt, 'function');
assert.throws(() => esm.mountReservations('#booking', { restaurant: 'example' }), /browser/);
for (const file of [
  'dist/index.js',
  'dist/index.cjs',
  'dist/element.js',
  'dist/index.d.ts',
  'dist/element.d.ts',
  'dist/prompt.d.ts',
])
  assert.ok((await stat(file)).size > 0);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0);
assert.ok(
  prompt.releaseInstallSource.includes(`/v${pkg.version}/menueqr-widget-${pkg.version}.tgz`),
);
for (const manager of ['npm', 'pnpm', 'yarn', 'bun']) {
  assert.equal(
    prompt.installationCommand(manager),
    `${manager} ${manager === 'npm' ? 'install' : 'add'} @menueqr/widget`,
  );
}
console.log(
  'ESM, CommonJS, SSR-safe imports, declarations and zero runtime dependencies verified.',
);
