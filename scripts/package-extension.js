import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const zip = new JSZip();
for (const name of await readdir(resolve(root, 'extension'))) {
  zip.file(name, await readFile(resolve(root, 'extension', name)));
}
const target = resolve(root, 'public/downloads/Raqeeb-Extension.zip');
await mkdir(dirname(target), { recursive: true });
await writeFile(target, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`Packaged ${target}`);
