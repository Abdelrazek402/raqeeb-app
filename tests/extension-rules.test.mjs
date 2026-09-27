import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const extensionFile = (name) =>
  readFile(new URL(`../extension/${name}`, import.meta.url), 'utf8');

test('Manifest V3 loads the checked-in main-frame blocking rules', async () => {
  const manifest = JSON.parse(await extensionFile('manifest.json'));
  const rules = JSON.parse(await extensionFile('rules.json'));

  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.permissions.includes('declarativeNetRequest'));
  assert.ok(manifest.declarative_net_request.rule_resources.some(
    (resource) => resource.path === 'rules.json' && resource.enabled
  ));
  assert.equal(rules.length, 529);
  assert.ok(rules.every((rule) =>
    rule.action.type === 'block' &&
    rule.condition.resourceTypes.includes('main_frame') &&
    /^\|\|(?:[a-z0-9-]+\.)+[a-z0-9-]+\^$/.test(rule.condition.urlFilter)
  ));
});

test('extension UI computes count from packaged rules rather than a constant', async () => {
  const popup = await extensionFile('popup.js');
  assert.match(popup, /fetch\(chrome\.runtime\.getURL\('rules\.json'\)\)/);
  assert.match(popup, /count\.textContent = String\(rules\.length\)/);
  assert.doesNotMatch(popup, /count\.textContent = ['"]529['"]/);
});
