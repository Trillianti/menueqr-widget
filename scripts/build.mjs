import { build } from 'esbuild';
import { rm, readFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const declared = await readFile('src/version.ts', 'utf8');
if (!declared.includes(`'${version}'`))
  throw Error('Run npm version to synchronize the package version.');
await rm('dist', { recursive: true, force: true });
for (const format of ['esm', 'cjs'])
  await build({
    entryPoints: ['src/index.ts', 'src/element.ts', 'src/prompt.ts'],
    outdir: 'dist',
    outExtension: { '.js': format === 'esm' ? '.js' : '.cjs' },
    bundle: true,
    format,
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    legalComments: 'none',
  });
