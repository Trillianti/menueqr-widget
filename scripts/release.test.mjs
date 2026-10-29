import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  releaseInfo,
  archiveHashes,
  publishedState,
  registryVersion,
  publishArchive,
  assertForwardRelease,
  PACKAGE,
  REPOSITORY,
  REGISTRY,
} from './release.mjs';
const pkg = {
  name: PACKAGE,
  version: '0.3.0',
  repository: { url: `git+https://github.com/${REPOSITORY}.git` },
  publishConfig: { access: 'public' },
};
const info = { ...releaseInfo(pkg), ...archiveHashes(Buffer.from('isolated test archive')) };
const existing = { name: PACKAGE, version: info.version, dist: { integrity: info.integrity } };
test('stable 0.x releases use latest; explicit prereleases use next', () => {
  assert.equal(releaseInfo(pkg).channel, 'latest');
  assert.equal(releaseInfo({ ...pkg, version: '0.3.1-beta.2' }).channel, 'next');
});
test('rejects tag mismatches, invalid versions, repositories and private packages', () => {
  assert.throws(() => releaseInfo(pkg, 'v9.9.9'));
  for (const version of ['01.2.3', '0.3.0/../../x', '0.3.0; echo nope', '0.3.0-beta.01'])
    assert.throws(() => releaseInfo({ ...pkg, version }));
  assert.throws(() => releaseInfo({ ...pkg, private: true }));
  assert.throws(() => releaseInfo({ ...pkg, name: '@someone/else' }));
  assert.throws(() => releaseInfo({ ...pkg, repository: { url: 'https://other.example' } }));
});
test('identical published bytes are a no-op; version collisions fail closed', () => {
  assert.equal(publishedState(info, null), 'publish');
  assert.equal(publishedState(info, existing), 'already-published');
  assert.throws(() => publishedState(info, { ...existing, dist: { integrity: 'different' } }));
  assert.throws(() => publishedState(info, { ...existing, name: '@other/package' }));
});
test('only an npm 404 means an unpublished version; registry failures never permit publishing', async () => {
  assert.equal(await registryVersion('0.3.0', async () => ({ status: 404 })), null);
  for (const status of [401, 403, 429, 500])
    await assert.rejects(registryVersion('0.3.0', async () => ({ status, ok: false })));
  await assert.rejects(
    registryVersion('0.3.0', async () => {
      throw new Error('offline');
    }),
  );
});
test('does not move latest backwards or treat a prerelease as stable', () => {
  assert.throws(() => assertForwardRelease(info, { version: '0.4.0' }));
  assert.throws(() => assertForwardRelease(info, { version: '0.3.0' }));
  assertForwardRelease(info, { version: '0.2.1' });
  assertForwardRelease(info, { version: '0.3.0-beta.1' });
  assertForwardRelease({ ...info, channel: 'next' }, { version: '1.0.0' });
});
test('publishes the checked tarball with public access, provenance, no hooks and the correct channel', async () => {
  for (const channel of ['latest', 'next']) {
    const calls = [];
    const result = await publishArchive({ ...info, channel }, '/isolated/widget.tgz', {
      request: async (url, options) => {
        assert(url.startsWith(REGISTRY));
        assert.equal(options.credentials, 'omit');
        return { status: 404 };
      },
      execute: (...args) => calls.push(args),
    });
    assert.equal(result, 'published');
    assert.deepEqual(calls[0][1], [
      'publish',
      '/isolated/widget.tgz',
      '--access',
      'public',
      '--registry',
      REGISTRY,
      '--tag',
      channel,
      '--provenance',
      '--ignore-scripts',
    ]);
    assert.equal(calls.length, 1);
  }
});
test('bootstrap and retries never publish an existing version twice', async () => {
  const result = await publishArchive(info, '/isolated/widget.tgz', {
    request: async () => ({ status: 200, ok: true, json: async () => existing }),
    execute: () => {
      throw new Error('Publishing was not expected');
    },
  });
  assert.equal(result, 'already-published');
});
