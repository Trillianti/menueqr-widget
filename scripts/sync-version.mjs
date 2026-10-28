import { readFile, writeFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) throw Error('Invalid package version');
await writeFile(
  'src/version.ts',
  `/** Kept in sync by npm version; verified before packing. */\nexport const WIDGET_VERSION = '${version}';\n`,
);
