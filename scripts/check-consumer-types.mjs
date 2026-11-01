import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'menueqr-types-'));
try {
  const [{ filename }] = JSON.parse(
    execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], {
      cwd: root,
      encoding: 'utf8',
    }),
  );
  const packageDirectory = join(directory, 'node_modules/@menueqr/widget');
  await mkdir(packageDirectory, { recursive: true });
  execFileSync('tar', [
    '-xzf',
    join(directory, filename),
    '-C',
    packageDirectory,
    '--strip-components=1',
  ]);
  // Resolve the consumer's React types, not any unpackaged SDK source files.
  await symlink(join(root, 'node_modules/@types'), join(directory, 'node_modules/@types'), 'dir');
  await symlink(join(root, 'node_modules/react'), join(directory, 'node_modules/react'), 'dir');
  const source = `
import { mountReservationButton, type FrameLoadError } from '@menueqr/widget';
import { mountReservationButton as button } from '@menueqr/widget/button';
import { mountReservationFloating } from '@menueqr/widget/floating';
import { mountReservationTab } from '@menueqr/widget/tab';
import { mountReservationInline } from '@menueqr/widget/inline';
import { defineReservationElements } from '@menueqr/widget/element';
import { createIntegrationGuide } from '@menueqr/widget/prompt';
import { ReservationButton, ReservationFloating, ReservationTab, ReservationInline } from '@menueqr/widget/react';
import { createElement } from 'react';
const mounts = [mountReservationButton, button, mountReservationFloating, mountReservationTab, mountReservationInline];
const error: FrameLoadError = { code: 'timeout' };
for (const mount of mounts) {
  const widget = mount(document.body, { restaurant: 'consumer', onLoadError: (event) => console.log(event.code, error.code) });
  widget.update({ icon: false, offsetX: 0, onLoadError: undefined });
  widget.destroy();
}
defineReservationElements();
createIntegrationGuide({ restaurant: 'consumer', inlineHeight: 1000 });
for (const component of [ReservationButton, ReservationFloating, ReservationTab, ReservationInline])
  createElement(component, { restaurant: 'consumer', onLoadError: ({ code }) => console.log(code) });
`;
  for (const extension of ['mts', 'cts']) {
    await writeFile(join(directory, `consumer.${extension}`), source);
  }
  for (const module of ['Node16', 'NodeNext']) {
    for (const extension of ['mts', 'cts']) {
      const result = execFileSync(
        process.execPath,
        [
          join(root, 'node_modules/typescript/bin/tsc'),
          join(directory, `consumer.${extension}`),
          '--module',
          module,
          '--moduleResolution',
          module,
          '--target',
          'ES2020',
          '--lib',
          'ES2020,DOM,DOM.Iterable',
          '--types',
          'react',
          '--strict',
          '--noEmit',
        ],
        { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      assert.equal(result.trim(), '');
    }
  }
  const pkg = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8'));
  console.log(`Packed ${pkg.name}: ESM/CommonJS consumers compile with Node16 and NodeNext.`);
} catch (error) {
  if (error.stdout) console.error(String(error.stdout));
  if (error.stderr) console.error(String(error.stderr));
  throw error;
} finally {
  await rm(directory, { recursive: true, force: true });
}
