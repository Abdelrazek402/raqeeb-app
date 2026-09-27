import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('synthetic native artifact builders are absent from production code', async () => {
  await assert.rejects(access(new URL('../server/installerBuilder.ts', import.meta.url)));
  await assert.rejects(access(new URL('../dist/downloads/Raqeeb.apk', import.meta.url)));
  await assert.rejects(access(new URL('../public/downloads/Raqeeb.apk', import.meta.url)));
  const nativeDownloads = await read('src/utils/nativeInstallers.ts');
  const server = await read('server.ts');
  const forbidden = /buildWindowsPeExe|buildAndroidApk|preGenerateStaticInstallers|generateWindowsExeBuffer|generateAndroidApkBlob|classes\.dex|CERT\.RSA|WinExec/;

  assert.doesNotMatch(nativeDownloads, forbidden);
  assert.doesNotMatch(server, forbidden);
  assert.doesNotMatch(server, /installerBuilder/);
  assert.match(nativeDownloads, /\/api\/download\/windows-exe/);
  assert.match(nativeDownloads, /\/api\/download\/android-apk/);
});

test('extension count comes from packaged rules and rule IDs are unique', async () => {
  const popup = await read('extension/popup.js');
  const html = await read('extension/popup.html');
  const rules = JSON.parse(await read('extension/rules.json'));
  const ids = new Set();

  assert.doesNotMatch(`${popup}\n${html}`, /\b529\b/);
  assert.match(popup, /fetch\(chrome\.runtime\.getURL\('rules\.json'\)\)/);
  assert.equal(rules.length, 529);

  for (const rule of rules) {
    assert.ok(Number.isInteger(rule.id) && rule.id > 0);
    assert.ok(!ids.has(rule.id), `duplicate rule id ${rule.id}`);
    ids.add(rule.id);
    assert.equal(rule.action.type, 'block');
    assert.ok(rule.condition.resourceTypes.includes('main_frame'));

    const match = /^\|\|([a-z0-9.-]+)\^$/.exec(rule.condition.urlFilter);
    assert.ok(match, `rule ${rule.id} is not boundary-safe`);
    const hostname = match[1];
    const matchesHostname = (candidate) =>
      candidate === hostname || candidate.endsWith(`.${hostname}`);
    assert.equal(matchesHostname(hostname), true);
    assert.equal(matchesHostname(`sub.${hostname}`), true);
    assert.equal(matchesHostname(`not${hostname}`), false);
  }
});

test('release workflow runs artifact and Firestore security checks', async () => {
  const workflow = await read('.github/workflows/release.yml');
  assert.match(workflow, /npm run test:firestore-rules/);
  assert.match(workflow, /npm run test:anti-fake/);
  assert.match(workflow, /npm run test:extension/);
  assert.match(workflow, /npm run test:analytics-data/);
  assert.match(workflow, /ExtractAssociatedIcon\(\$path\)/);
});
