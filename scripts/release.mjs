import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

export const REGISTRY = 'https://registry.npmjs.org';
export const REPOSITORY = 'Trillianti/menueqr-widget';
export const PACKAGE = '@menueqr/widget';
const root = fileURLToPath(new URL('..', import.meta.url));
const directory = join(root, 'release');
const run = (command, args, options = {}) => execFileSync(command, args, { cwd: root, ...options });
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));

export function releaseInfo(pkg, tag = `v${pkg.version}`) {
  assert.equal(pkg.name, PACKAGE, 'Unexpected npm package name');
  assert.equal(
    pkg.repository?.url,
    `git+https://github.com/${REPOSITORY}.git`,
    'Unexpected repository',
  );
  assert(pkg.private === undefined || pkg.private === false, 'The SDK must be publishable');
  assert.equal(pkg.publishConfig?.access, 'public', 'Public npm access is required');
  assert.match(
    pkg.version,
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
    'Invalid release version',
  );
  assert.equal(tag, `v${pkg.version}`, 'Release tag must match package.json');
  const prerelease = pkg.version.split('-').slice(1).join('-');
  if (prerelease)
    for (const part of prerelease.split('.')) {
      assert(!/^0\d+$/.test(part), 'Prerelease numeric identifiers cannot have leading zeroes');
    }
  return {
    name: pkg.name,
    version: pkg.version,
    tag,
    filename: `menueqr-widget-${pkg.version}.tgz`,
    channel: prerelease ? 'next' : 'latest',
  };
}

export function archiveHashes(bytes) {
  return {
    integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

export function publishedState(info, published) {
  if (published === null) return 'publish';
  assert.equal(published.name, info.name, 'npm returned a different package');
  assert.equal(published.version, info.version, 'npm returned a different version');
  assert.equal(
    published.dist?.integrity,
    info.integrity,
    'This npm version already contains different bytes. Choose a new version.',
  );
  return 'already-published';
}

export async function registryVersion(version, request = fetch) {
  const response = await request(`${REGISTRY}/@menueqr%2fwidget/${encodeURIComponent(version)}`, {
    signal: AbortSignal.timeout(10000),
    redirect: 'error',
    credentials: 'omit',
    headers: { accept: 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(
      `npm registry lookup failed (${response.status}); publication was not attempted.`,
    );
  return response.json();
}

export function assertForwardRelease(info, latest) {
  if (info.channel !== 'latest' || !latest) return;
  const current = String(latest.version).split('-')[0].split('.').map(Number);
  const candidate = info.version.split('.').map(Number);
  assert(current.length === 3 && current.every(Number.isSafeInteger), 'Invalid npm latest version');
  const difference = candidate.findIndex((value, index) => value !== current[index]);
  assert(
    difference >= 0 ? candidate[difference] > current[difference] : latest.version.includes('-'),
    'This release would move npm latest backwards.',
  );
}

export async function publishArchive(info, archive, { request = fetch, execute = run } = {}) {
  const state = publishedState(info, await registryVersion(info.version, request));
  if (state === 'already-published') return state;
  assertForwardRelease(info, await registryVersion('latest', request));
  execute(
    'npm',
    [
      'publish',
      archive,
      '--access',
      'public',
      '--registry',
      REGISTRY,
      '--tag',
      info.channel,
      '--provenance',
      '--ignore-scripts',
    ],
    { stdio: 'inherit' },
  );
  return 'published';
}

async function config() {
  assert.equal(
    run('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
    '',
    'Commit the release changes before packing.',
  );
  const pkg = await json(join(root, 'package.json'));
  const info = releaseInfo(pkg, process.env.RELEASE_TAG || undefined);
  assert(
    (await readFile(join(root, 'src/version.ts'), 'utf8')).includes(`'${info.version}'`),
    'Run npm version to synchronize src/version.ts',
  );
  return info;
}

async function verify() {
  const dryRun = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  assert(dryRun || process.env.RELEASE_TAG, 'RELEASE_TAG is required for a tag release');
  if (dryRun)
    assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Run release validation from main.');
  const info = await config();
  assert.equal(
    process.env.GITHUB_REPOSITORY,
    REPOSITORY,
    'Release only from the official repository',
  );
  run('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main']);
  console.log(`Verified ${info.tag} is merged into main and matches the SDK version.`);
}

async function pack() {
  const info = await config();
  await mkdir(directory, { recursive: true });
  const [packed] = JSON.parse(
    run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory], {
      encoding: 'utf8',
    }),
  );
  assert.equal(packed.filename, info.filename);
  assert.equal(packed.name, info.name);
  assert.equal(packed.version, info.version);
  const hashes = archiveHashes(await readFile(join(directory, info.filename)));
  assert.equal(packed.integrity, hashes.integrity);
  const sourceCommit = run('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  await writeFile(
    join(directory, 'manifest.json'),
    JSON.stringify({ ...info, ...hashes, sourceCommit }, null, 2) + '\n',
  );
  await writeFile(join(directory, 'SHA256SUMS'), `${hashes.sha256}  ${info.filename}\n`);
  await copyFile(join(root, 'CHANGELOG.md'), join(directory, 'NOTES.md'));
  console.log(`Prepared release/${info.filename} (${info.channel}); nothing was published.`);
}

async function inspect() {
  await verify();
  const expected = await config();
  const info = await json(join(directory, 'manifest.json'));
  for (const key of Object.keys(expected))
    assert.equal(info[key], expected[key], `Artifact ${key} mismatch`);
  assert.equal(
    info.sourceCommit,
    run('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    'Artifact came from a different commit',
  );
  const archive = join(directory, expected.filename);
  const hashes = archiveHashes(await readFile(archive));
  assert.equal(info.integrity, hashes.integrity, 'Release archive integrity mismatch');
  assert.equal(info.sha256, hashes.sha256, 'Release archive checksum mismatch');
  const packaged = JSON.parse(
    run('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }),
  );
  assert.deepEqual(releaseInfo(packaged, expected.tag), expected, 'Packaged metadata mismatch');
  console.log(`Verified archive ${info.filename} from ${info.sourceCommit}.`);
  return { info, archive };
}

async function publish() {
  assert.equal(process.env.GITHUB_EVENT_NAME, 'push', 'Only a pushed release tag can publish.');
  assert.equal(
    process.env.GITHUB_REF,
    `refs/tags/${process.env.RELEASE_TAG}`,
    'Publication requires the matching tag ref.',
  );
  const { info, archive } = await inspect();
  const result = await publishArchive(info, archive);
  console.log(`${info.name}@${info.version}: ${result}`);
  if (process.env.GITHUB_OUTPUT)
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `archive=${archive}\ntag=${info.tag}\nchannel=${info.channel}\n`,
    );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const action = { verify, pack, inspect, publish }[process.argv[2]];
  if (!action) throw new Error('Choose verify, pack, inspect or publish.');
  await action();
}
