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
console.log(
  'ESM, CommonJS, SSR-safe imports, declarations and zero runtime dependencies verified.',
);
