import { spawn, execFileSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile, open } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextLayoutSnippet } from '../dist/prompt.js';

// Select dependency versions from an existing installation; never modify that project.
const root = fileURLToPath(new URL('..', import.meta.url));
const modules = resolve(process.env.NEXT_SMOKE_MODULES ?? join(root, 'node_modules'));
const port = Number(process.env.NEXT_SMOKE_PORT ?? 4340);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid Next.js QA port.');
for (const name of ['next', 'react', 'react-dom']) {
  try {
    await access(join(modules, name, 'package.json'));
  } catch {
    throw Error(
      'Next.js QA needs next, react and react-dom installed. Set NEXT_SMOKE_MODULES to an existing Next.js project node_modules directory.',
    );
  }
}
const directory = await mkdtemp(join(tmpdir(), 'menueqr-next-qa-'));
await mkdir(join(directory, 'app/about'), { recursive: true });
await mkdir(join(directory, 'app/api/health'), { recursive: true });
const [{ filename }] = JSON.parse(
  execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], {
    cwd: root,
    encoding: 'utf8',
  }),
);
await writeFile(
  join(directory, 'package.json'),
  JSON.stringify(
    {
      name: 'menueqr-next-qa',
      private: true,
      version: '1.0.0',
      dependencies: {
        next: JSON.parse(await readFile(join(modules, 'next/package.json'), 'utf8')).version,
        react: JSON.parse(await readFile(join(modules, 'react/package.json'), 'utf8')).version,
        'react-dom': JSON.parse(await readFile(join(modules, 'react-dom/package.json'), 'utf8'))
          .version,
        '@menueqr/widget': `file:${join(directory, filename)}`,
      },
      devDependencies: Object.fromEntries(
        await Promise.all(
          ['typescript', '@types/react', '@types/react-dom', '@types/node'].map(async (name) => [
            name,
            JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8'))
              .version,
          ]),
        ),
      ),
    },
    null,
    2,
  ),
);
await writeFile(
  join(directory, 'app/layout.tsx'),
  nextLayoutSnippet({ restaurant: 'next-widget-qa', language: 'en', component: 'floating' }) +
    '\nexport const metadata = { title: "Next widget QA" };\n',
);
await writeFile(
  join(directory, 'app/page.tsx'),
  'import Link from "next/link"; export default function Page(){return <main><h1>Next widget QA</h1><Link href="/about">About</Link></main>;}',
);
await writeFile(
  join(directory, 'app/about/page.tsx'),
  'import Link from "next/link"; export default function Page(){return <main><h1>About QA</h1><Link href="/">Home</Link></main>;}',
);
await writeFile(
  join(directory, 'app/api/health/route.ts'),
  'export function GET(){return Response.json({service:"menueqr-next-widget-qa"});}',
);
await writeFile(join(directory, 'next.config.mjs'), 'export default { devIndicators: false };\n');
const log = await open(join(directory, 'next.log'), 'a');
const children = [];
function stop(child, signal = 'SIGTERM') {
  if (!child?.pid || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {
    /* Already exited. */
  }
}
function cleanup() {
  for (const child of children) stop(child);
}
process.once('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.once('SIGTERM', () => {
  cleanup();
  process.exit(143);
});
async function runStep(command, args) {
  const child = spawn(command, args, {
    cwd: directory,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', log.fd, log.fd],
    detached: process.platform !== 'win32',
  });
  children.push(child);
  const timer = setTimeout(() => stop(child, 'SIGKILL'), 240000);
  try {
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) => resolve(code ?? 1));
    });
    if (code !== 0) throw Error(`Next.js QA ${args[0]} failed (${code}).`);
  } finally {
    clearTimeout(timer);
  }
}
try {
  console.log(`Isolated Next.js consumer: ${directory}`);
  console.log('Installing the packed SDK and building a production app with Turbopack.');
  await runStep('npm', [
    'install',
    '--ignore-scripts',
    '--package-lock=false',
    '--no-audit',
    '--no-fund',
    '--prefer-offline',
  ]);
  const nextCLI = join(directory, 'node_modules/next/dist/bin/next');
  await runStep(process.execPath, [nextCLI, 'build']);
  const next = spawn(
    process.execPath,
    [nextCLI, 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: directory,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', log.fd, log.fd],
      detached: process.platform !== 'win32',
    },
  );
  children.push(next);
  let startupError;
  next.on('error', (error) => {
    startupError = error;
  });
  console.log(`Starting the production Next.js server on http://127.0.0.1:${port}`);
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    if (startupError) throw startupError;
    if (next.exitCode !== null) throw Error('The task-local Next.js server exited during startup.');
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok && (await response.json()).service === 'menueqr-next-widget-qa') {
        ready = true;
        break;
      }
    } catch {
      /* Retry only this task-local server. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw Error('Next.js QA startup timed out.');
  console.log('Next.js ready. Testing the generated layout, metadata and navigation.');
  const checks = spawn(
    process.execPath,
    [
      join(root, 'node_modules/@playwright/test/cli.js'),
      'test',
      '--config',
      'playwright.next.config.ts',
    ],
    {
      cwd: root,
      env: { ...process.env, NEXT_WIDGET_QA_URL: `http://127.0.0.1:${port}` },
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    },
  );
  children.push(checks);
  const code = await new Promise((resolve, reject) => {
    checks.once('error', reject);
    checks.once('exit', (code) => resolve(code ?? 1));
  });
  if (code !== 0)
    throw Error(`Next.js integration checks failed (${code}). Log: ${join(directory, 'next.log')}`);
} catch (error) {
  console.error((await readFile(join(directory, 'next.log'), 'utf8')).slice(-8000));
  throw error;
} finally {
  cleanup();
  await log.close();
}
