import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const zip = new JSZip();
const extensionPath = resolve(root, 'extension');
const sourceFiles = new Map();
for (const name of await readdir(extensionPath)) {
  const contents = await readFile(resolve(extensionPath, name));
  sourceFiles.set(name, contents);
  zip.file(name, contents, { date: new Date('1980-01-01T00:00:00Z') });
}

const manifestBytes = sourceFiles.get('manifest.json');
const rulesBytes = sourceFiles.get('rules.json');
if (!manifestBytes || !rulesBytes) {
  throw new Error('The extension package must contain manifest.json and rules.json.');
}

const manifest = JSON.parse(manifestBytes.toString('utf8'));
const rules = JSON.parse(rulesBytes.toString('utf8'));
if (manifest.manifest_version !== 3 || !Array.isArray(rules) || rules.length === 0) {
  throw new Error('The extension manifest must be version 3 and rules.json must contain rules.');
}

const ruleResources = manifest.declarative_net_request?.rule_resources;
if (!Array.isArray(ruleResources) || ruleResources.length === 0) {
  throw new Error('The extension manifest does not declare declarative rule resources.');
}
for (const resource of ruleResources) {
  if (typeof resource.path !== 'string' || !sourceFiles.has(resource.path)) {
    throw new Error(`The declared extension rule resource is missing: ${resource.path}`);
  }
}

const ruleIds = new Set();
for (const rule of rules) {
  if (!Number.isInteger(rule.id) || rule.id < 1 || ruleIds.has(rule.id)) {
    throw new Error('The extension rules must have unique positive integer IDs.');
  }
  const domainFilter = rule.condition?.urlFilter;
  const validDomainFilter = typeof domainFilter === 'string' &&
    /^\|\|(?=.{1,253}\^)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\^$/.test(domainFilter);
  if (rule.action?.type !== 'block' || !validDomainFilter || !rule.condition.resourceTypes?.includes('main_frame')) {
    throw new Error(`The extension rule ${rule.id} is not a boundary-safe top-level domain block rule.`);
  }
  ruleIds.add(rule.id);
}

const target = resolve(root, 'public/downloads/Raqeeb-Extension.zip');
await mkdir(dirname(target), { recursive: true });
const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
const packagedZip = await JSZip.loadAsync(archive);
const packagedManifest = JSON.parse(await packagedZip.file('manifest.json').async('string'));
const packagedRules = JSON.parse(await packagedZip.file('rules.json').async('string'));
if (packagedManifest.manifest_version !== 3 || packagedRules.length !== rules.length) {
  throw new Error('The packaged extension contents did not match their validated sources.');
}
await writeFile(target, archive);
const sha256 = createHash('sha256').update(archive).digest('hex');
console.log(`Packaged ${target} (${rules.length} rules, SHA-256 ${sha256})`);
