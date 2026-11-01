import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function commonJSDeclarations(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await commonJSDeclarations(file);
    else if (entry.name.endsWith('.d.ts')) {
      // CJS declarations must resolve every relative type import to the CJS graph.
      const source = await readFile(file, 'utf8');
      const commonJS = source.replace(/(['"])(\.{1,2}\/[^'"]+)\.js\1/g, '$1$2.cjs$1');
      await writeFile(file.replace(/\.d\.ts$/, '.d.cts'), commonJS);
    }
  }
}

await commonJSDeclarations('dist');
