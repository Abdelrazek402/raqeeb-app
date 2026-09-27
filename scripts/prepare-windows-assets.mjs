import { createRequire } from 'node:module';
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(root, 'src/utils/blocklist.ts');
const distPath = resolve(root, 'dist');
const projectPath = resolve(root, 'windows-native/RaqeebProtector');
const webRoot = resolve(projectPath, 'wwwroot');
const domainsPath = resolve(projectPath, 'blocked-domains.txt');
const zipPath = resolve(projectPath, 'wwwroot-assets.zip');

function readStringArray(sourceFile, name) {
  let values;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      if (!ts.isArrayLiteralExpression(node.initializer)) {
        throw new Error(`${name} must be initialized with an array literal.`);
      }
      values = node.initializer.elements.map((element) => {
        if (!ts.isStringLiteral(element)) {
          throw new Error(`${name} must contain only string literals.`);
        }
        return element.text;
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!values) throw new Error(`Could not find ${name} in ${sourcePath}.`);
  return values;
}

const source = ts.createSourceFile(
  sourcePath,
  await readFile(sourcePath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);
const blocked = readStringArray(source, 'DEFAULT_BLOCKED_DOMAINS');
const trusted = new Set(readStringArray(source, 'TRUSTED_SAFE_DOMAINS'));
const domains = [...new Set(blocked.map((domain) => domain.trim().toLowerCase()))].sort();

if (domains.length === 0 || domains.some((domain) => !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domain))) {
  throw new Error('The default blocklist contains an empty or invalid DNS domain.');
}
const trustedOverlap = domains.filter((domain) => trusted.has(domain));
if (trustedOverlap.length > 0) {
  throw new Error(`The default blocklist contains trusted-safe domains: ${trustedOverlap.join(', ')}`);
}
try {
  await access(resolve(distPath, 'index.html'));
} catch (error) {
  if (error.code === 'ENOENT')
    throw new Error('dist/index.html is missing; run npm run build before preparing Windows assets.');
  throw error;
}

await rm(webRoot, { recursive: true, force: true });
await cp(distPath, webRoot, { recursive: true });
await writeFile(domainsPath, `${domains.join('\r\n')}\r\n`, 'utf8');

const zip = new JSZip();
async function addDirectory(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name);
    const archivePath = [prefix, entry.name].filter(Boolean).join('/');
    if (entry.isDirectory()) {
      await addDirectory(fullPath, archivePath);
    } else if (entry.isFile()) {
      zip.file(archivePath, await readFile(fullPath));
    }
  }
}
await addDirectory(webRoot);
await mkdir(projectPath, { recursive: true });
await writeFile(zipPath, await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
}));

console.log(`Prepared ${domains.length} unique blocked domains from ${blocked.length} source entries.`);
if (domains.length + trusted.size === 529) {
  console.log(`The legacy 529-name payload included ${trusted.size} trusted-safe domains; they were excluded.`);
}
console.log(`Embedded WebView2 site payload: ${relative(root, zipPath).split(sep).join('/')}`);
