import { transform } from 'esbuild';
import { rm, readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
if (!(await readFile('src/version.ts', 'utf8')).includes(`'${version}'`))
  throw Error('Run npm version to synchronize the package version.');
async function sources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? sources(join(directory, entry.name))
        : entry.name.endsWith('.ts')
          ? [join(directory, entry.name)]
          : [],
    ),
  );
  return files.flat();
}
await rm('dist', { recursive: true, force: true });
// Preserve module boundaries: every import path shares one core instance registry.
for (const file of await sources('src')) {
  const source = await readFile(file, 'utf8');
  const target = join('dist', relative('src', file).replace(/\.ts$/, ''));
  await mkdir(dirname(target), { recursive: true });
  for (const format of ['esm', 'cjs']) {
    let { code } = await transform(source, {
      loader: 'ts',
      format,
      target: 'es2020',
      minify: true,
      legalComments: 'none',
    });
    if (format === 'cjs')
      code = code.replace(/require\((['"])(\.{1,2}\/[^'"]+)\.js\1\)/g, 'require("$2.cjs")');
    await writeFile(`${target}.${format === 'esm' ? 'js' : 'cjs'}`, code);
  }
}
